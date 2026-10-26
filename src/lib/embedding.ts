// Image embeddings via the Jina Embeddings API.
//
// JINA_MODEL picks the model: `jina-clip-v2` (default, 1024 dims) or
// `jina-embeddings-v5-omni-small` (1024 dims, ~40x fewer tokens per image).
// Models with larger native vectors (jina-embeddings-v4, 2048) are truncated
// to EMBEDDING_DIMENSIONS and re-normalised, which Matryoshka models allow.

const JINA_URL = "https://api.jina.ai/v1/embeddings";

export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 1024);

export function embeddingModel(): string {
  return process.env.JINA_MODEL || "jina-clip-v2";
}

/** "index" = a reference image going into the catalogue; "query" = a customer photo. */
export type EmbedPurpose = "index" | "query";

export interface EmbeddingResult {
  vector: number[];
  model: string;
  tokens: number;
  ms: number;
}

export class EmbeddingError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

function taskFor(model: string, purpose: EmbedPurpose): string | undefined {
  // The jina-embeddings-v4/v5 families take a task adapter; CLIP models do not.
  if (!model.startsWith("jina-embeddings-v")) return undefined;
  return purpose === "index" ? "retrieval.passage" : "retrieval.query";
}

function normalise(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

/**
 * Embed one image. `image` is either raw bytes or a publicly reachable URL.
 */
export interface EmbedOptions {
  /** Override JINA_MODEL (the A/B script compares models side by side). */
  model?: string;
  /** Override the task adapter, e.g. "text-matching" for symmetric similarity. */
  task?: string;
}

export async function embedImage(image: Buffer | string, purpose: EmbedPurpose, options: EmbedOptions = {}): Promise<EmbeddingResult> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new EmbeddingError("Missing JINA_API_KEY environment variable");

  const model = options.model || embeddingModel();
  const task = options.task ?? taskFor(model, purpose);
  const body: Record<string, unknown> = {
    model,
    normalized: true,
    input: [{ image: typeof image === "string" ? image : image.toString("base64") }],
  };
  if (task) body.task = task;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.JINA_TIMEOUT_MS || 20000));
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(JINA_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new EmbeddingError(`Jina request failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  if (!res.ok) throw new EmbeddingError(`Jina ${res.status}: ${text.slice(0, 300)}`, res.status);

  let parsed: { data?: Array<{ embedding?: number[] }>; usage?: { total_tokens?: number } };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new EmbeddingError("Jina returned a non-JSON response");
  }
  const raw = parsed.data?.[0]?.embedding;
  if (!Array.isArray(raw) || !raw.length) throw new EmbeddingError("Jina returned no embedding");
  if (raw.length < EMBEDDING_DIMENSIONS) {
    throw new EmbeddingError(`Model ${model} returned ${raw.length} dims; the index expects ${EMBEDDING_DIMENSIONS}`);
  }
  const vector = raw.length === EMBEDDING_DIMENSIONS ? raw : normalise(raw.slice(0, EMBEDDING_DIMENSIONS));

  return { vector, model, tokens: parsed.usage?.total_tokens ?? 0, ms: Date.now() - started };
}

/** Cosine similarity of two unit vectors. */
export function cosine(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
