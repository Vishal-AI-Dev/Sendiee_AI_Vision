// The matching loop: embed the customer photo, pull the nearest reference
// images from Atlas Vector Search, work out which flow applies from the best
// hit's folder, and let that flow decide. Query photos are embedded from
// memory and never written to storage.

import { productsCol, VECTOR_INDEX, type ProductDoc } from "./db";
import { embedImage } from "./embedding";
import { effectiveFlowFor, loadFolderMap } from "./folders";
import { decide, FLOWS, needsTiebreak, shortlist, type ScoredCandidate, type TiebreakOutcome } from "./flows";
import { serializeProduct } from "./products";
import { downloadObject, fetchImageBytes, storageConfigured } from "./storage";
import { tiebreakConfigured, tiebreakWithDecisions } from "./tiebreak";
import type { MatchResult } from "./types";

export class VectorSearchUnavailable extends Error {}

const MAX_K = Math.max(...Object.values(FLOWS).map((f) => f.retrieval.k));

type Hit = Omit<ProductDoc, "embedding"> & { score: number };

export async function matchImage(input: { ownerId: string; bytes: Buffer; contentType?: string | null }): Promise<MatchResult> {
  const timings: Record<string, number> = {};
  const notes: string[] = [];
  const t0 = Date.now();

  const query = await embedImage(input.bytes, "query");
  timings.embedMs = query.ms;

  const t1 = Date.now();
  let hits: Hit[];
  try {
    hits = await (await productsCol())
      .aggregate<Hit>([
        {
          $vectorSearch: {
            index: VECTOR_INDEX.name,
            path: VECTOR_INDEX.path,
            queryVector: query.vector,
            numCandidates: Math.max(100, MAX_K * 20),
            limit: MAX_K,
            filter: { ownerId: input.ownerId },
          },
        },
        { $project: { embedding: 0 } },
        { $addFields: { score: { $meta: "vectorSearchScore" } } },
      ])
      .toArray();
  } catch (err) {
    const message = (err as Error).message || "";
    if (/\$vectorSearch|Unrecognized pipeline stage/i.test(message)) {
      throw new VectorSearchUnavailable("Vector search needs MongoDB Atlas with the vector_index search index");
    }
    throw err;
  }
  timings.searchMs = Date.now() - t1;

  // Atlas reports cosine as (1 + cos) / 2; thresholds are written in plain cosine.
  const scored: ScoredCandidate[] = hits.map((h) => ({ id: h._id.toString(), cosine: 2 * h.score - 1 }));
  const byId = new Map(hits.map((h) => [h._id.toString(), h]));

  const map = await loadFolderMap(input.ownerId);
  const flowId = hits.length ? effectiveFlowFor(hits[0].folderId, map) : "visual";
  const flow = FLOWS[flowId];

  let outcome: TiebreakOutcome | null = null;
  if (needsTiebreak(flow, scored)) {
    if (!tiebreakConfigured()) {
      notes.push("Precise flow: no double-check provider configured (set OPENAI_API_KEY), fell back to score margin");
    } else {
      const t2 = Date.now();
      try {
        const list = shortlist(flow, scored);
        const candidates = await Promise.all(
          list.map(async (c) => {
            const doc = byId.get(c.id)!;
            const file = storageConfigured() ? await downloadObject(doc.storageKey) : await fetchImageBytes(doc.publicUrl);
            return { id: c.id, bytes: file.bytes, contentType: file.contentType };
          })
        );
        timings.candidateFetchMs = Date.now() - t2;
        const result = await tiebreakWithDecisions({ bytes: input.bytes, contentType: input.contentType }, candidates);
        timings.tiebreakMs = result.ms;
        outcome = { pick: result.pick, confidence: result.confidence };
      } catch (err) {
        notes.push(`Double-check failed, fell back to score margin: ${(err as Error).message.slice(0, 200)}`);
      }
    }
  }

  const decision = decide(flow, scored, outcome);
  timings.totalMs = Date.now() - t0;

  const winner = decision.winnerId ? byId.get(decision.winnerId) : undefined;
  return {
    decision: decision.kind,
    flow: decision.flow,
    product: decision.kind === "match" && winner ? serializeProduct(winner) : null,
    confidence: decision.confidence,
    reason: decision.reason,
    verifiedBy: decision.verifiedBy,
    candidates: scored.map((c) => ({ product: serializeProduct(byId.get(c.id)!), cosine: c.cosine })),
    timings,
    notes,
  };
}
