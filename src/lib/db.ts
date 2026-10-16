import { ObjectId, type Collection, type Db } from "mongodb";
import { getDb } from "./mongodb";
import type { EmbeddingStatus, FlowId } from "./types";

// MongoDB documents. Everything is scoped by `ownerId` (the admin user's id),
// so one deployment can serve several catalogues.

export interface FolderDoc {
  _id: ObjectId;
  ownerId: string;
  name: string;
  parentId: ObjectId | null;
  color: string;
  flow: FlowId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDoc {
  _id: ObjectId;
  ownerId: string;
  folderId: ObjectId | null;
  storageKey: string;
  publicUrl: string;
  contentType: string | null;
  fileSize: number;
  productName: string;
  price: number;
  sku: string;
  tags: string[];
  description: string;
  /** The reference image's embedding, or null until it has been computed. */
  embedding: number[] | null;
  embeddingModel: string | null;
  embeddingStatus: EmbeddingStatus;
  embeddingError: string | null;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  createdAt: Date;
  /** sha256 of the API key; the key itself is shown once and never stored. */
  apiKeyHash?: string | null;
  apiKeyPrefix?: string | null;
  apiKeyCreatedAt?: Date | null;
}

export const VECTOR_INDEX = {
  name: "vector_index",
  path: "embedding",
  dimensions: Number(process.env.EMBEDDING_DIMENSIONS || 1024),
  similarity: "cosine" as const,
};

export async function foldersCol(): Promise<Collection<FolderDoc>> {
  return (await getDb()).collection<FolderDoc>("folders");
}
export async function productsCol(): Promise<Collection<ProductDoc>> {
  return (await getDb()).collection<ProductDoc>("products");
}
export async function usersCol(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}

/** Parse a client-supplied id; "root", "", null and undefined mean the root folder. */
export function parseFolderId(value: unknown): { ok: true; id: ObjectId | null } | { ok: false } {
  if (value === null || value === undefined || value === "" || value === "root") return { ok: true, id: null };
  if (typeof value === "string" && ObjectId.isValid(value)) return { ok: true, id: new ObjectId(value) };
  return { ok: false };
}

export function parseId(value: unknown): ObjectId | null {
  return typeof value === "string" && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

/** Definition of the Atlas Vector Search index on `products.embedding`. */
export function vectorIndexDefinition() {
  return {
    name: VECTOR_INDEX.name,
    type: "vectorSearch" as const,
    definition: {
      fields: [
        {
          type: "vector",
          path: VECTOR_INDEX.path,
          numDimensions: VECTOR_INDEX.dimensions,
          similarity: VECTOR_INDEX.similarity,
        },
        { type: "filter", path: "ownerId" },
      ],
    },
  };
}

/**
 * Create the regular indexes (idempotent). The vector index lives on Atlas and
 * is created by `scripts/ensure-indexes.ts`, since local MongoDB cannot build it.
 */
export async function ensureRegularIndexes(db?: Db): Promise<void> {
  const d = db ?? (await getDb());
  await Promise.all([
    d.collection("folders").createIndex({ ownerId: 1, parentId: 1 }),
    d.collection("products").createIndex({ ownerId: 1, folderId: 1 }),
    d.collection("products").createIndex({ ownerId: 1, uploadedAt: -1 }),
    d.collection("users").createIndex({ email: 1 }, { unique: true }),
    d.collection("users").createIndex(
      { apiKeyHash: 1 },
      { unique: true, partialFilterExpression: { apiKeyHash: { $type: "string" } } }
    ),
  ]);
}
