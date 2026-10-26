import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { productsCol } from "@/lib/db";
import { handle, jsonError, readJson, strList } from "@/lib/http";
import { removeObjects, storageConfigured } from "@/lib/storage";

/**
 * DELETE /api/upload { keys: string[] } — discard uploaded files that never
 * became products (the admin pressed "Skip All" after uploading). Only the
 * caller's own keys are accepted, and keys that already have a product record
 * are left alone.
 */
export const DELETE = withAdmin(async (request, _ctx, admin) =>
  handle(async () => {
    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");
    const keys = strList(body.keys, 100).filter((k) => k.startsWith(`users/${admin.id}/`));
    if (!keys.length) return NextResponse.json({ removed: 0 });

    const referenced = new Set(
      (await (await productsCol()).find({ ownerId: admin.id, storageKey: { $in: keys } }, { projection: { storageKey: 1 } }).toArray()).map(
        (d) => d.storageKey
      )
    );
    const orphans = keys.filter((k) => !referenced.has(k));
    const canRemove = storageConfigured();
    if (orphans.length && canRemove) await removeObjects(orphans);
    return NextResponse.json({ removed: canRemove ? orphans.length : 0, kept: keys.length - orphans.length });
  })
);
