// A/B two Jina models on our own photos.
//
//   npx tsx scripts/compare-embeddings.ts [photo ...]
//   optional: scripts/pairs.json  { "same_product_other_angle": ["a.jpeg","b.jpeg"], "lookalike_variant": ["c.jpeg","d.jpeg"] }
//   env: JINA_API_KEY (required), COMPARE_MODELS=jina-clip-v2,jina-embeddings-v5-omni-small (optional)
//
// Prints a cosine matrix per model and task, the gap between "same product" and
// "look-alike" pairs (the number that decides the switch), token cost and latency,
// and writes scripts/COMPARE-RESULTS.md.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { loadEnv, percentile } from "./_env";
import { cosine, embedImage, EmbeddingError } from "../src/lib/embedding";
import { prepareImage } from "../src/lib/image";

loadEnv();

if (!process.env.JINA_API_KEY) {
  console.error("JINA_API_KEY is not set. Put it in .env.local and run again.");
  process.exit(1);
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync("Images")
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .map((f) => join("Images", f));
if (!files.length) {
  console.error("No photos found. Pass paths or put some in Images/.");
  process.exit(1);
}

type Run = { label: string; model: string; task?: string };
const models = (process.env.COMPARE_MODELS || "jina-clip-v2,jina-embeddings-v5-omni-small").split(",").map((s) => s.trim()).filter(Boolean);
const runs: Run[] = [];
for (const model of models) {
  runs.push({ label: model, model });
  // The v4/v5 families take a task adapter; symmetric photo-to-photo matching may prefer text-matching.
  if (model.startsWith("jina-embeddings-v")) runs.push({ label: `${model} (text-matching)`, model, task: "text-matching" });
}

const pairs: Record<string, [string, string]> = existsSync("scripts/pairs.json") ? JSON.parse(readFileSync("scripts/pairs.json", "utf8")) : {};
const names = files.map((f) => basename(f));
const findIdx = (name: string) => names.findIndex((n) => n === name || n === basename(name));

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const lines: string[] = [`# Embedding A/B — ${new Date().toISOString()}`, "", `Photos: ${names.join(", ")}`, ""];

async function main() {
  const prepared = await Promise.all(files.map(async (f) => prepareImage(readFileSync(f))));

  for (const run of runs) {
    console.log(`\n=== ${run.label}`);
    const vectors: number[][] = [];
    const tokens: number[] = [];
    const ms: number[] = [];
    let failed = false;
    for (let i = 0; i < prepared.length; i++) {
      try {
        const r = await embedImage(prepared[i].bytes, "index", { model: run.model, task: run.task });
        vectors.push(r.vector);
        tokens.push(r.tokens);
        ms.push(r.ms);
        process.stdout.write(`  ${names[i]}: ${r.tokens} tokens, ${r.ms} ms\n`);
      } catch (err) {
        console.log(`  ${names[i]}: FAILED — ${(err as EmbeddingError).message}`);
        failed = true;
        break;
      }
    }
    if (failed) {
      lines.push(`## ${run.label}`, "", "Failed; see console.", "");
      continue;
    }

    const header = ["", ...names.map((n) => n.slice(0, 12))].join(" | ");
    const rows = names.map((n, i) => [n.slice(0, 12), ...vectors.map((v) => pct(cosine(vectors[i], v)))].join(" | "));
    console.log(`  ${header}`);
    rows.forEach((r) => console.log(`  ${r}`));

    const totalTokens = tokens.reduce((a, b) => a + b, 0);
    const summary = `tokens: ${totalTokens} total, ${Math.round(totalTokens / tokens.length)} per photo · latency p50 ${percentile(ms, 50)} ms, p95 ${percentile(ms, 95)} ms`;
    console.log(`  ${summary}`);

    lines.push(`## ${run.label}`, "", `| ${header} |`, `| ${["---", ...names.map(() => "---")].join(" | ")} |`, ...rows.map((r) => `| ${r} |`), "", summary, "");

    const pairLines: string[] = [];
    let same: number | null = null;
    let lookalike: number | null = null;
    for (const [label, [a, b]] of Object.entries(pairs)) {
      const ia = findIdx(a);
      const ib = findIdx(b);
      if (ia < 0 || ib < 0) {
        pairLines.push(`- ${label}: photo not found (${a}, ${b})`);
        continue;
      }
      const c = cosine(vectors[ia], vectors[ib]);
      if (/same/i.test(label)) same = c;
      if (/look|variant/i.test(label)) lookalike = c;
      pairLines.push(`- ${label}: ${pct(c)}`);
    }
    if (same !== null && lookalike !== null) {
      pairLines.push(`- **gap (same − look-alike): ${pct(same - lookalike)}** — bigger is better`);
    }
    if (pairLines.length) {
      pairLines.forEach((l) => console.log(`  ${l}`));
      lines.push(...pairLines, "");
    }
  }

  writeFileSync("scripts/COMPARE-RESULTS.md", lines.join("\n"));
  console.log("\nWrote scripts/COMPARE-RESULTS.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
