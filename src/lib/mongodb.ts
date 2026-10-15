import { MongoClient, type Db } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "sendiee_vision";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

/**
 * Shared MongoDB client. Connects on first use rather than at import time, so
 * `next build` and routes that never touch Mongo work without MONGODB_URI, and
 * the connection is reused across hot reloads in development.
 */
export function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI environment variable");

    const promise = new MongoClient(uri).connect();
    // Forget a failed connection so the next call retries instead of returning the cached rejection.
    promise.catch(() => {
      if (globalForMongo.mongoClientPromise === promise) globalForMongo.mongoClientPromise = undefined;
    });
    globalForMongo.mongoClientPromise = promise;
  }
  return globalForMongo.mongoClientPromise;
}

/** The application database (`MONGODB_DB`, default `sendiee_vision`). */
export async function getDb(): Promise<Db> {
  return (await getMongoClient()).db(DB_NAME);
}
