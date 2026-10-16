import test from "node:test";
import assert from "node:assert/strict";
import { decide, FLOWS, needsTiebreak, resolveFlow, shortlist } from "../src/lib/flows";

const c = (id: string, cosine: number) => ({ id, cosine });

test("resolveFlow: own setting wins, then nearest ancestor, then default", () => {
  assert.equal(resolveFlow("precise", ["visual"]), "precise");
  assert.equal(resolveFlow(null, [null, "precise", "visual"]), "precise");
  assert.equal(resolveFlow(null, [null, null]), "visual");
  assert.equal(resolveFlow(null, []), "visual");
});

test("shortlist keeps only candidates above the floor, best first", () => {
  const list = shortlist(FLOWS.visual, [c("a", 0.7), c("b", 0.9), c("c", 0.85)]);
  assert.deepEqual(list.map((x) => x.id), ["b", "c"]);
});

test("visual flow: clear winner on score alone", () => {
  const d = decide(FLOWS.visual, [c("saree-1", 0.95), c("saree-2", 0.86), c("kurta", 0.72)]);
  assert.equal(d.kind, "match");
  assert.equal(d.winnerId, "saree-1");
  assert.equal(d.verifiedBy, "score");
});

test("visual flow: nothing above the floor is no_match", () => {
  const d = decide(FLOWS.visual, [c("x", 0.72), c("y", 0.7)]);
  assert.equal(d.kind, "no_match");
  assert.equal(d.winnerId, null);
});

test("visual flow: two close candidates are ambiguous", () => {
  const d = decide(FLOWS.visual, [c("a", 0.95), c("b", 0.945)]);
  assert.equal(d.kind, "ambiguous");
  assert.equal(d.winnerId, "a");
});

test("precise flow: look-alikes need the tie-break", () => {
  const cands = [c("m1", 0.96), c("m5", 0.95)];
  assert.equal(needsTiebreak(FLOWS.precise, cands), true);
  // Without a tie-break result the flow falls back to the (stricter) margin and says so.
  const fallback = decide(FLOWS.precise, cands, null);
  assert.equal(fallback.kind, "ambiguous");
  assert.match(fallback.reason, /no double-check configured/);
});

test("precise flow: tie-break pick above confidence floor is a match", () => {
  const cands = [c("m1", 0.96), c("m5", 0.95)];
  const d = decide(FLOWS.precise, cands, { pick: "m5", confidence: 0.82 });
  assert.equal(d.kind, "match");
  assert.equal(d.winnerId, "m5");
  assert.equal(d.verifiedBy, "tiebreak");
});

test("precise flow: tie-break saying none, confidently, is no_match", () => {
  const cands = [c("m1", 0.96), c("m5", 0.95)];
  const d = decide(FLOWS.precise, cands, { pick: null, confidence: 0.9 });
  assert.equal(d.kind, "no_match");
});

test("precise flow: unsure tie-break stays ambiguous but suggests the pick", () => {
  const cands = [c("m1", 0.96), c("m5", 0.95)];
  const d = decide(FLOWS.precise, cands, { pick: "m1", confidence: 0.4 });
  assert.equal(d.kind, "ambiguous");
  assert.equal(d.winnerId, "m1");
});

test("precise flow: a single candidate above the floor skips the tie-break", () => {
  const cands = [c("only", 0.9), c("far", 0.6)];
  assert.equal(needsTiebreak(FLOWS.precise, cands), false);
  const d = decide(FLOWS.precise, cands);
  assert.equal(d.kind, "match");
  assert.equal(d.verifiedBy, "score");
});
