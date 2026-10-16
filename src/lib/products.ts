import type { ObjectId } from "mongodb";
import { productsCol, type ProductDoc } from "./db";
import { embedImage } from "./embedding";
import { getFolderDoc, effectiveFlowFor, loadFolderMap } from "./folders";
import { HttpError } from "./http";
import { downloadObject, fetchImageBytes, publicUrlFor, removeObjects, storageConfigured } from "./storage";
import { FLOW_IDS } from "./flows";
import type { FlowId, LibraryStats, ProductImage } from "./types";

export function serializeProduct(doc: Omit<ProductDoc, "embedding">): ProductImage {
  return {
    id: doc._id.toString(),
    folderId: doc.folderId ? doc.folderId.toString() : null,
    thumbnailUrl: doc.publicUrl,
    fullUrl: doc.publicUrl,
    productName: doc.productName,
    price: doc.price,
    sku: doc.sku,
    tags: doc.tags,
    description: doc.description,
    uploadedAt: doc.uploadedAt.toISOString(),
    fileSize: doc.fileSize,
    embeddingStatus: doc.embeddingStatus,
  };
}

const PUBLIC_FIELDS = { embedding: 0 } as const;

export async function listProducts(ownerId: string, folderId: ObjectId | null): Promise<ProductImage[]> {
  const docs = await (await productsCol())
    .find({ ownerId, folderId }, { projection: PUBLIC_FIELDS })
    .sort({ uploadedAt: -1 })
    .toArray();
  return docs.map(serializeProduct);
}

export async function getProductDoc(ownerId: string, id: ObjectId, withEmbedding = false): Promise<ProductDoc> {
  const doc = await (await productsCol()).findOne({ _id: id, ownerId }, withEmbedding ? {} : { projection: PUBLIC_FIELDS });
  if (!doc) throw new HttpError(404, "Image not found");
  return doc;
}

export interface CreateProductInput {
  storageKey: string;
  publicUrl: string;
  folderId: ObjectId | null;
  productName: string;
  price: number;
  sku: string;
  tags: string[];
  description: string;
  fileSize: number;
  contentType: string | null;
}

/** Load the bytes of a stored reference image. */
async function referenceBytes(doc: Pick<ProductDoc, "storageKey" | "publicUrl">): Promise<{ bytes: Buffer; contentType: string | null }> {
  return storageConfigured() ? downloadObject(doc.storageKey) : fetchImageBytes(doc.publicUrl);
}

/** Compute and store the embedding for one product; records failure instead of throwing. */
export async function embedProduct(doc: ProductDoc): Promise<ProductDoc> {
  const col = await productsCol();
  try {
    const { bytes } = await referenceBytes(doc);
    const result = await embedImage(bytes, "index");
    const $set = {
      embedding: result.vector,
      embeddingModel: result.model,
      embeddingStatus: "ready" as const,
      embeddingError: null,
      updatedAt: new Date(),
    };
    await col.updateOne({ _id: doc._id }, { $set });
    return { ...doc, ...$set };
  } catch (err) {
    const message = (err as Error).message.slice(0, 300);
    const $set = { embeddingStatus: "failed" as const, embeddingError: message, updatedAt: new Date() };
    await col.updateOne({ _id: doc._id }, { $set });
    console.error(`[products] embedding failed for ${doc._id}: ${message}`);
    return { ...doc, ...$set };
  }
}

export async function createProduct(ownerId: string, input: CreateProductInput): Promise<ProductImage> {
  if (!input.storageKey) throw new HttpError(400, "key is required");
  if (!input.productName) throw new HttpError(400, "productName is required");
  if (!input.storageKey.startsWith(`users/${ownerId}/`)) throw new HttpError(403, "That upload does not belong to you");
  if (input.folderId) await getFolderDoc(ownerId, input.folderId);

  const now = new Date();
  const doc: Omit<ProductDoc, "_id"> = {
    ownerId,
    folderId: input.folderId,
    storageKey: input.storageKey,
    publicUrl: storageConfigured() ? publicUrlFor(input.storageKey) : input.publicUrl,
    contentType: input.contentType,
    fileSize: input.fileSize,
    productName: input.productName,
    price: input.price,
    sku: input.sku,
    tags: input.tags,
    description: input.description,
    embedding: null,
    embeddingModel: null,
    embeddingStatus: "pending",
    embeddingError: null,
    uploadedAt: now,
    updatedAt: now,
  };
  const { insertedId } = await (await productsCol()).insertOne(doc as ProductDoc);
  const stored = await embedProduct({ ...doc, _id: insertedId });
  return serializeProduct(stored);
}

export async function updateProduct(
  ownerId: string,
  id: ObjectId,
  patch: Partial<Pick<ProductDoc, "productName" | "price" | "sku" | "tags" | "description">>
): Promise<ProductImage> {
  await getProductDoc(ownerId, id);
  if (patch.productName !== undefined && !patch.productName) throw new HttpError(400, "productName is required");
  await (await productsCol()).updateOne({ _id: id, ownerId }, { $set: { ...patch, updatedAt: new Date() } });
  return serializeProduct(await getProductDoc(ownerId, id));
}

export async function moveProduct(ownerId: string, id: ObjectId, folderId: ObjectId | null): Promise<ProductImage> {
  await getProductDoc(ownerId, id);
  if (folderId) await getFolderDoc(ownerId, folderId);
  await (await productsCol()).updateOne({ _id: id, ownerId }, { $set: { folderId, updatedAt: new Date() } });
  return serializeProduct(await getProductDoc(ownerId, id));
}

export async function deleteProduct(ownerId: string, id: ObjectId): Promise<void> {
  const doc = await getProductDoc(ownerId, id);
  if (storageConfigured()) {
    try {
      await removeObjects([doc.storageKey]);
    } catch (err) {
      console.error("[products] storage delete failed:", err);
    }
  }
  await (await productsCol()).deleteOne({ _id: id, ownerId });
}

/** Retry the embedding of a product whose first attempt failed. */
export async function reembedProduct(ownerId: string, id: ObjectId): Promise<ProductImage> {
  const doc = await getProductDoc(ownerId, id, true);
  return serializeProduct(await embedProduct(doc));
}

export async function libraryStats(ownerId: string): Promise<LibraryStats> {
  const col = await productsCol();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [totals, map, recentUploads, ready, failed, perFolder] = await Promise.all([
    col
      .aggregate<{ n: number; bytes: number }>([
        { $match: { ownerId } },
        { $group: { _id: null, n: { $sum: 1 }, bytes: { $sum: "$fileSize" } } },
      ])
      .toArray(),
    loadFolderMap(ownerId),
    col.countDocuments({ ownerId, uploadedAt: { $gte: weekAgo } }),
    col.countDocuments({ ownerId, embeddingStatus: "ready" }),
    col.countDocuments({ ownerId, embeddingStatus: "failed" }),
    col
      .aggregate<{ _id: ObjectId | null; n: number }>([{ $match: { ownerId } }, { $group: { _id: "$folderId", n: { $sum: 1 } } }])
      .toArray(),
  ]);
  const byFlow = Object.fromEntries(FLOW_IDS.map((f) => [f, 0])) as Record<FlowId, number>;
  for (const row of perFolder) byFlow[effectiveFlowFor(row._id, map)] += row.n;
  return {
    totalImages: totals[0]?.n ?? 0,
    totalFolders: map.size,
    storageUsedBytes: totals[0]?.bytes ?? 0,
    recentUploads,
    readyImages: ready,
    failedImages: failed,
    byFlow,
  };
}
