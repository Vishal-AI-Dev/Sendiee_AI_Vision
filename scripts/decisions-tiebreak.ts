// Prototype the precise flow's double-check on look-alike products.
//
//   npx tsx scripts/decisions-tiebreak.ts <query.jpg> <candidate1.jpg> [candidate2.jpg ...]
//   default: Images/Airpods.jpeg against Airpods, Power Bank and Joy Stick
//   env: OPENAI_API_KEY (required), TIEBREAK_RUNS=3
//
// Uses the same code path as /api/match (src/lib/tiebreak.ts): one choice
// question with a "none" option, candidates shuffled each run. Prints the
// pick, confidence, per-candidate probabilities, tokens and p50/p95 latency,
// and writes scripts/DECISIONS-RESULTS.md.

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { loadEnv, percentile } from "./_env";
import { prepareImage, TIEBREAK_MAX_SIDE } from "../src/lib/image";
import { tiebreakWithDecisions, type TiebreakResult } from "../src/lib/tiebreak";

loadEnv();

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set. Put it in .env.local and run again.");
  process.exit(1);
}

const args = process.argv.slice(2);
const query = args[0] ?? "Images/Airpods.jpeg";
const candidates = args.length > 1 ? args.slice(1) : ["Images/Airpods.jpeg", "Images/Power Bank.jpeg", "Images/Joy Stick.jpeg"];
const runs = Number(process.env.TIEBREAK_RUNS || 3);

const pct = (n: number) => `${Math.round(n * 100)}%`;

async function main() {
  const q = await prepareImage(readFileSync(query), TIEBREAK_MAX_SIDE);
  const cands = await Promise.all(
    candidates.map(async (p) => {
      const img = await prepareImage(readFileSync(p), TIEBREAK_MAX_SIDE);
      return { id: basename(p), bytes: img.bytes, contentType: img.contentType };
    })
  );
  console.log(`Query: ${basename(query)} (${q.width}×${q.height}); candidates: ${cands.map((c) => c.id).join(", ")}; ${runs} runs\n`);

  const results: TiebreakResult[] = [];
  const lines = [`# Decisions tie-break — ${new Date().toISOString()}`, "", `Query: ${basename(query)}`, `Candidates: ${cands.map((c) => c.id).join(", ")}`, ""];
  for (let i = 0; i < runs; i++) {
    try {
      const r = await tiebreakWithDecisions({ bytes: q.bytes, contentType: q.contentType }, cands);
      results.push(r);
      const probs = Object.entries(r.probabilities)
        .sort((a, b) => b[1] - a[1])
        .map(([id, p]) => `${id} ${pct(p)}`)
        .join(", ");
      const line = `run ${i + 1}: pick=${r.pick ?? "none"} confidence=${pct(r.confidence)} tokens=${r.tokens ?? "?"} latency=${r.ms} ms · ${probs}`;
      console.log(line);
      lines.push(`- ${line}`);
    } catch (err) {
      const line = `run ${i + 1}: FAILED — ${(err as Error).message}`;
      console.log(line);
      lines.push(`- ${line}`);
    }
  }

  if (results.length) {
    const ms = results.map((r) => r.ms);
    const tokens = results.map((r) => r.tokens).filter((t): t is number => typeof t === "number");
    const avgTokens = tokens.length ? Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length) : null;
    const cost = avgTokens !== null ? `$${((avgTokens / 1_000_000) * 0.1).toFixed(5)} per call at $0.10 per 1M input tokens` : "token usage not reported";
    const summary = `latency p50 ${percentile(ms, 50)} ms, p95 ${percentile(ms, 95)} ms with ${cands.length + 1} images · ${avgTokens !== null ? `${avgTokens} tokens (~${Math.round(avgTokens / (cands.length + 1))} per image)` : "tokens unknown"} · ${cost}`;
    const fits = percentile(ms, 95) < 1500 ? "fits" : "does NOT fit";
    console.log(`\n${summary}\nAt p95 this ${fits} inside a 2 s total budget once embedding (~0.5–1 s) is added.`);
    lines.push("", summary, "", `At p95 this ${fits} inside a 2 s total budget once embedding is added.`);
  }

  writeFileSync("scripts/DECISIONS-RESULTS.md", lines.join("\n") + "\n");
  console.log("\nWrote scripts/DECISIONS-RESULTS.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
