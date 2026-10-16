// Second stage for the precise flow: ask a decision model which shortlisted
// reference image shows the same product as the customer photo.
//
// Provider: OpenAI Decisions API (public beta, model gpt-6-luna). It is only
// used when OPENAI_API_KEY is set; otherwise the flow falls back to score
// margins and says so in the decision reason.

export interface TiebreakCandidate {
  id: string;
  bytes: Buffer;
  contentType?: string | null;
}

export interface TiebreakResult {
  pick: string | null; // candidate id, or null for "none of these"
  confidence: number;
  probabilities: Record<string, number>; // by candidate id, plus "none"
  model: string;
  ms: number;
}

export class TiebreakError extends Error {}

const DECISIONS_URL = "https://api.openai.com/v1/decisions";
const MODEL = "gpt-6-luna";
const LABELS = "ABCDEFGH".split("");

export function tiebreakConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function dataUrl(bytes: Buffer, contentType?: string | null): string {
  const type = contentType && contentType.startsWith("image/") ? contentType : "image/jpeg";
  return `data:${type};base64,${bytes.toString("base64")}`;
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function tiebreakWithDecisions(
  query: { bytes: Buffer; contentType?: string | null },
  candidates: TiebreakCandidate[]
): Promise<TiebreakResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new TiebreakError("Missing OPENAI_API_KEY environment variable");
  if (!candidates.length) throw new TiebreakError("No candidates to compare");

  // Shuffle so the model's option-order bias does not favour the top retrieval hit.
  const order = shuffle(candidates).slice(0, LABELS.length);
  const labelFor = new Map(order.map((c, i) => [c.id, LABELS[i]]));
  const idFor = new Map(order.map((c, i) => [LABELS[i], c.id]));

  const content: Array<Record<string, string>> = [
    { type: "input_text", text: "Query photo sent by a customer:" },
    { type: "input_image", image_url: dataUrl(query.bytes, query.contentType) },
  ];
  for (const c of order) {
    content.push({ type: "input_text", text: `Candidate ${labelFor.get(c.id)} (reference photo):` });
    content.push({ type: "input_image", image_url: dataUrl(c.bytes, c.contentType) });
  }

  const body = {
    model: MODEL,
    input: [{ role: "user", content }],
    questions: [
      {
        type: "choice",
        name: "match",
        instructions:
          "Which candidate shows exactly the same product as the query photo? Compare model numbers, labels, printed text, ports, buttons and proportions, not just overall shape or colour. Choose none if no candidate is the same product.",
        choices: [
          ...order.map((c) => ({ value: labelFor.get(c.id)!, description: `Candidate ${labelFor.get(c.id)} is the same product` })),
          { value: "none", description: "None of the candidates is the same product" },
        ],
      },
    ],
  };

  const started = Date.now();
  const res = await fetch(DECISIONS_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.TIEBREAK_TIMEOUT_MS || 6000)),
  });
  const text = await res.text();
  if (!res.ok) throw new TiebreakError(`Decisions API ${res.status}: ${text.slice(0, 300)}`);

  let parsed: {
    answers?: Array<{
      type: string;
      name?: string;
      choice?: string;
      confidence?: number;
      probabilities?: Array<{ value: string; probability: number }>;
    }>;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new TiebreakError("Decisions API returned a non-JSON response");
  }
  const answer = parsed.answers?.find((a) => a.name === "match") ?? parsed.answers?.[0];
  if (!answer) throw new TiebreakError("Decisions API returned no answer");
  if (answer.type === "refusal") throw new TiebreakError("Decisions API refused the request");

  const probabilities: Record<string, number> = {};
  for (const p of answer.probabilities ?? []) {
    const id = p.value === "none" ? "none" : idFor.get(p.value);
    if (id) probabilities[id] = p.probability;
  }
  const pick = answer.choice === "none" || !answer.choice ? null : (idFor.get(answer.choice) ?? null);
  const confidence =
    typeof answer.confidence === "number"
      ? answer.confidence
      : (pick ? probabilities[pick] : probabilities.none) ?? 0;

  return { pick, confidence, probabilities, model: MODEL, ms: Date.now() - started };
}
