import type { ObjectId } from "mongodb";
import { foldersCol, parseId, productsCol, type FolderDoc } from "./db";
import { resolveFlow } from "./flows";
import { HttpError } from "./http";
import { removeObjects, storageConfigured } from "./storage";
import type { Folder, FlowId } from "./types";

const COLORS = ["#6366F1", "#F59E0B", "#EC4899", "#10B981", "#8B5CF6", "#06B6D4", "#EF4444", "#14B8A6"];

export type FolderMap = Map<string, FolderDoc>;

const key = (id: ObjectId | null) => (id ? id.toString() : "root");

/** All folders of an owner, keyed by id. Catalogues are small, so one read is fine. */
export async function loadFolderMap(ownerId: string): Promise<FolderMap> {
  const docs = await (await foldersCol()).find({ ownerId }).toArray();
  return new Map(docs.map((d) => [d._id.toString(), d]));
}

/** The flow that applies to products in `folderId`, walking up the tree. */
export function effectiveFlowFor(folderId: ObjectId | null, map: FolderMap): FlowId {
  const chain: Array<FlowId | null> = [];
  let own: FlowId | null = null;
  let cursor = folderId ? map.get(folderId.toString()) : undefined;
  if (cursor) own = cursor.flow;
  let guard = 0;
  cursor = cursor?.parentId ? map.get(cursor.parentId.toString()) : undefined;
  while (cursor && guard++ < 50) {
    chain.push(cursor.flow);
    cursor = cursor.parentId ? map.get(cursor.parentId.toString()) : undefined;
  }
  return resolveFlow(own, chain);
}

/** Number of products per folder, keyed by folder id or "root". */
export async function imageCounts(ownerId: string): Promise<Map<string, number>> {
  const rows = await (await productsCol())
    .aggregate<{ _id: ObjectId | null; n: number }>([
      { $match: { ownerId } },
      { $group: { _id: "$folderId", n: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((r) => [key(r._id), r.n]));
}

export function serializeFolder(doc: FolderDoc, map: FolderMap, counts: Map<string, number>): Folder {
  return {
    id: doc._id.toString(),
    name: doc.name,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    imageCount: counts.get(doc._id.toString()) ?? 0,
    createdAt: doc.createdAt.toISOString(),
    color: doc.color,
    flow: doc.flow,
    effectiveFlow: effectiveFlowFor(doc._id, map),
  };
}

export async function listFolders(ownerId: string, parentId: ObjectId | null): Promise<Folder[]> {
  const [map, counts] = await Promise.all([loadFolderMap(ownerId), imageCounts(ownerId)]);
  return [...map.values()]
    .filter((d) => key(d.parentId) === key(parentId))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((d) => serializeFolder(d, map, counts));
}

export async function getFolderDoc(ownerId: string, id: ObjectId): Promise<FolderDoc> {
  const doc = await (await foldersCol()).findOne({ _id: id, ownerId });
  if (!doc) throw new HttpError(404, "Folder not found");
  return doc;
}

export async function createFolder(
  ownerId: string,
  input: { name: string; parentId: ObjectId | null; flow: FlowId | null; color?: string }
): Promise<Folder> {
  if (!input.name) throw new HttpError(400, "Folder name is required");
  if (input.parentId) await getFolderDoc(ownerId, input.parentId);
  const col = await foldersCol();
  const now = new Date();
  const siblings = await col.countDocuments({ ownerId, parentId: input.parentId });
  const doc: Omit<FolderDoc, "_id"> = {
    ownerId,
    name: input.name,
    parentId: input.parentId,
    color: input.color && /^#[0-9a-fA-F]{6}$/.test(input.color) ? input.color : COLORS[siblings % COLORS.length],
    flow: input.flow,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await col.insertOne(doc as FolderDoc);
  const [map, counts] = await Promise.all([loadFolderMap(ownerId), imageCounts(ownerId)]);
  return serializeFolder({ ...doc, _id: insertedId }, map, counts);
}

export async function updateFolder(
  ownerId: string,
  id: ObjectId,
  patch: { name?: string; flow?: FlowId | null; color?: string }
): Promise<Folder> {
  await getFolderDoc(ownerId, id);
  const $set: Partial<FolderDoc> = { updatedAt: new Date() };
  if (patch.name !== undefined) {
    if (!patch.name) throw new HttpError(400, "Folder name is required");
    $set.name = patch.name;
  }
  if (patch.flow !== undefined) $set.flow = patch.flow;
  if (patch.color !== undefined && /^#[0-9a-fA-F]{6}$/.test(patch.color)) $set.color = patch.color;
  await (await foldersCol()).updateOne({ _id: id, ownerId }, { $set });
  const [map, counts] = await Promise.all([loadFolderMap(ownerId), imageCounts(ownerId)]);
  return serializeFolder(map.get(id.toString())!, map, counts);
}

/** Ids of a folder and every folder below it. */
export function descendantIds(id: ObjectId, map: FolderMap): ObjectId[] {
  const out: ObjectId[] = [id];
  const queue = [id.toString()];
  while (queue.length) {
    const parent = queue.shift()!;
    for (const d of map.values()) {
      if (d.parentId && d.parentId.toString() === parent) {
        out.push(d._id);
        queue.push(d._id.toString());
      }
    }
  }
  return out;
}

/** Delete a folder, its subfolders, their products and the stored image files. */
export async function deleteFolderCascade(ownerId: string, id: ObjectId): Promise<{ folders: number; products: number }> {
  await getFolderDoc(ownerId, id);
  const map = await loadFolderMap(ownerId);
  const ids = descendantIds(id, map);
  const products = await productsCol();
  const victims = await products.find({ ownerId, folderId: { $in: ids } }, { projection: { storageKey: 1 } }).toArray();
  if (storageConfigured() && victims.length) {
    try {
      await removeObjects(victims.map((v) => v.storageKey));
    } catch (err) {
      console.error("[folders] storage cleanup failed:", err);
    }
  }
  const { deletedCount: productCount } = await products.deleteMany({ ownerId, folderId: { $in: ids } });
  const { deletedCount: folderCount } = await (await foldersCol()).deleteMany({ ownerId, _id: { $in: ids } });
  return { folders: folderCount, products: productCount };
}

export { parseId };
