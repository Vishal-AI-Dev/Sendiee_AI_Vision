// Creates the MongoDB indexes Sendiee Vision needs. Safe to run repeatedly.
//
//   npx tsx scripts/ensure-indexes.ts
//
// Regular indexes work on any MongoDB. The vector search index only exists on
// MongoDB Atlas; on a local server this prints the definition to create by hand.

import { MongoClient } from "mongodb";
import { loadEnv } from "./_env";

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Set MONGODB_URI (in .env.local or the environment).");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB || "sendiee_vision";
const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 1024);

const vectorIndex = {
  name: "vector_index",
  type: "vectorSearch" as const,
  definition: {
    fields: [
      { type: "vector", path: "embedding", numDimensions: dimensions, similarity: "cosine" },
      { type: "filter", path: "ownerId" },
    ],
  },
};

async function main() {
  const client = await new MongoClient(uri!).connect();
  try {
    const db = client.db(dbName);
    await Promise.all([
      db.collection("folders").createIndex({ ownerId: 1, parentId: 1 }),
      db.collection("products").createIndex({ ownerId: 1, folderId: 1 }),
      db.collection("products").createIndex({ ownerId: 1, uploadedAt: -1 }),
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("users").createIndex(
        { apiKeyHash: 1 },
        { unique: true, partialFilterExpression: { apiKeyHash: { $type: "string" } } }
      ),
    ]);
    console.log(`Regular indexes ensured on ${dbName}.`);

    const products = db.collection("products");
    try {
      const existing = await products.listSearchIndexes().toArray();
      if (existing.some((i) => i.name === vectorIndex.name)) {
        console.log(`Vector search index "${vectorIndex.name}" already exists.`);
      } else {
        await products.createSearchIndex(vectorIndex);
        console.log(`Vector search index "${vectorIndex.name}" created (Atlas builds it in the background).`);
      }
    } catch (err) {
      console.log("Could not manage the vector search index here (needs MongoDB Atlas):", (err as Error).message);
      console.log("Create it in Atlas → Search → Create Search Index → JSON editor with:");
      console.log(JSON.stringify(vectorIndex.definition, null, 2));
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
