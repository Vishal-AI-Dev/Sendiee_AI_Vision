// Matching flows: the "multipurpose" part of Sendiee Vision.
//
// Admins pick a flow per folder. Clothing and décor go on the visual flow,
// where pattern, colour and shape decide and the best embedding score wins.
// Mechanical parts, electronics and bottles go on the precise flow, where
// look-alikes differ only by a label or part number, so the shortlist is
// double-checked by a second stage before an answer is sent.
//
// This module is pure (no server imports) so the admin UI can use the
// definitions for labels and pickers.

import type { DecisionKind, FlowId } from "./types";

export type SecondStage = "none" | "tiebreak";

export interface FlowDefinition {
  id: FlowId;
  label: string;
  short: string;
  description: string;
  examples: string;
  retrieval: {
    /** How many nearest reference images to pull from the vector index. */
    k: number;
    /** Below this cosine similarity nothing counts as a candidate. */
    minCosine: number;
    /** The best candidate must beat the runner-up by this much to be a confident match on score alone. */
    minMargin: number;
  };
  secondStage: SecondStage;
  /** For the tie-break stage: the pick must reach this confidence to be accepted. */
  tiebreakMinConfidence: number;
}

export const FLOWS: Record<FlowId, FlowDefinition> = {
  visual: {
    id: "visual",
    label: "Visual match",
    short: "Visual",
    description: "Pattern, colour and shape decide. The best-scoring reference image wins.",
    examples: "Sarees, kurtas, clothing, décor, furniture",
    retrieval: { k: 5, minCosine: 0.8, minMargin: 0.015 },
    secondStage: "none",
    tiebreakMinConfidence: 0.6,
  },
  precise: {
    id: "precise",
    label: "Precise match",
    short: "Precise",
    description:
      "Look-alikes differ by a label, model number or text. Close candidates are double-checked before answering.",
    examples: "Mechanical parts, electronics, bottles, packaged goods",
    retrieval: { k: 5, minCosine: 0.85, minMargin: 0.03 },
    secondStage: "tiebreak",
    tiebreakMinConfidence: 0.6,
  },
};

export const FLOW_IDS: FlowId[] = ["visual", "precise"];
export const DEFAULT_FLOW: FlowId = "visual";

export function isFlowId(value: unknown): value is FlowId {
  return value === "visual" || value === "precise";
}

/**
 * The flow that applies to a folder: its own setting, else the nearest
 * ancestor's, else the default. `ancestors` is ordered parent first.
 */
export function resolveFlow(own: FlowId | null, ancestors: Array<FlowId | null>): FlowId {
  if (own) return own;
  for (const flow of ancestors) if (flow) return flow;
  return DEFAULT_FLOW;
}

export interface ScoredCandidate {
  id: string;
  cosine: number;
}

export interface TiebreakOutcome {
  /** The candidate id the second stage picked, or null for "none of these". */
  pick: string | null;
  confidence: number;
}

export interface Decision {
  kind: DecisionKind;
  flow: FlowId;
  winnerId: string | null;
  confidence: number;
  reason: string;
  verifiedBy: "score" | "tiebreak" | null;
}

/** Candidates that clear the flow's score floor, best first. */
export function shortlist(flow: FlowDefinition, candidates: ScoredCandidate[]): ScoredCandidate[] {
  return candidates
    .filter((c) => c.cosine >= flow.retrieval.minCosine)
    .sort((a, b) => b.cosine - a.cosine);
}

/** Whether the flow wants its second stage run for these candidates. */
export function needsTiebreak(flow: FlowDefinition, candidates: ScoredCandidate[]): boolean {
  return flow.secondStage === "tiebreak" && shortlist(flow, candidates).length > 1;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Turn retrieval scores (and, for the precise flow, the tie-break result)
 * into a decision. Pure, so it can be unit-tested and tuned without a database.
 */
export function decide(
  flow: FlowDefinition,
  candidates: ScoredCandidate[],
  tiebreak: TiebreakOutcome | null = null
): Decision {
  const ranked = shortlist(flow, candidates);
  const best = [...candidates].sort((a, b) => b.cosine - a.cosine)[0];

  if (!ranked.length) {
    return {
      kind: "no_match",
      flow: flow.id,
      winnerId: null,
      confidence: best?.cosine ?? 0,
      reason: best
        ? `Best similarity ${pct(best.cosine)} is below the ${pct(flow.retrieval.minCosine)} floor`
        : "No reference images to compare against",
      verifiedBy: null,
    };
  }

  const [top, second] = ranked;
  const margin = second ? top.cosine - second.cosine : 1;

  if (flow.secondStage === "tiebreak" && ranked.length > 1) {
    if (tiebreak) {
      if (tiebreak.pick === null) {
        const sure = tiebreak.confidence >= flow.tiebreakMinConfidence;
        return {
          kind: sure ? "no_match" : "ambiguous",
          flow: flow.id,
          winnerId: sure ? null : top.id,
          confidence: tiebreak.confidence,
          reason: sure
            ? `Double-check rejected all ${ranked.length} candidates (${pct(tiebreak.confidence)} sure)`
            : `Double-check leaned to "none" but was only ${pct(tiebreak.confidence)} sure`,
          verifiedBy: "tiebreak",
        };
      }
      const picked = ranked.find((c) => c.id === tiebreak.pick);
      if (picked && tiebreak.confidence >= flow.tiebreakMinConfidence) {
        return {
          kind: "match",
          flow: flow.id,
          winnerId: picked.id,
          confidence: tiebreak.confidence,
          reason: `Double-check picked it at ${pct(tiebreak.confidence)} confidence (similarity ${pct(picked.cosine)})`,
          verifiedBy: "tiebreak",
        };
      }
      return {
        kind: "ambiguous",
        flow: flow.id,
        winnerId: picked?.id ?? top.id,
        confidence: tiebreak.confidence,
        reason: `Double-check was only ${pct(tiebreak.confidence)} sure between ${ranked.length} close candidates`,
        verifiedBy: "tiebreak",
      };
    }
    // No second stage available: fall back to the score margin, but say so.
    if (margin >= flow.retrieval.minMargin) {
      return {
        kind: "match",
        flow: flow.id,
        winnerId: top.id,
        confidence: top.cosine,
        reason: `Best by ${pct(margin)} margin; no double-check configured`,
        verifiedBy: "score",
      };
    }
    return {
      kind: "ambiguous",
      flow: flow.id,
      winnerId: top.id,
      confidence: top.cosine,
      reason: `${ranked.length} candidates within ${pct(margin)} of each other and no double-check configured`,
      verifiedBy: null,
    };
  }

  if (margin >= flow.retrieval.minMargin) {
    return {
      kind: "match",
      flow: flow.id,
      winnerId: top.id,
      confidence: top.cosine,
      reason: second
        ? `Similarity ${pct(top.cosine)}, ${pct(margin)} ahead of the runner-up`
        : `Similarity ${pct(top.cosine)}, no other candidate above the floor`,
      verifiedBy: "score",
    };
  }
  return {
    kind: "ambiguous",
    flow: flow.id,
    winnerId: top.id,
    confidence: top.cosine,
    reason: `${ranked.length} candidates within ${pct(margin)} of each other`,
    verifiedBy: null,
  };
}
