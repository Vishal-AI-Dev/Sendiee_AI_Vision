import { createHash, randomBytes } from "node:crypto";
import { usersCol } from "./db";

// Per-admin API keys for the customer-facing match endpoint (the Sendiee
// webhook). Only a hash is stored; the key is shown once when created.

const PREFIX = "sv_";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = PREFIX + randomBytes(24).toString("base64url");
  return { key, hash: hashApiKey(key), prefix: key.slice(0, 10) };
}

export function looksLikeApiKey(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(PREFIX) && value.length > 20;
}

export interface KeyOwner {
  id: string;
  email: string;
}

export async function findOwnerByApiKey(key: string): Promise<KeyOwner | null> {
  if (!looksLikeApiKey(key)) return null;
  const user = await (await usersCol()).findOne({ apiKeyHash: hashApiKey(key) }, { projection: { email: 1 } });
  return user ? { id: user._id.toString(), email: user.email } : null;
}
