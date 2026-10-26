# Sendiee Vision

Product-photo matching for Sendiee. A customer sends a photo over WhatsApp or
Instagram; Sendiee posts it to this service; the service finds the closest
reference image an admin uploaded and answers with that product's details.

## How it works

```
admin uploads photo ──► Supabase Storage ──► POST /api/images ──► Jina embedding ──► MongoDB (products + Atlas vector index)

customer photo ──► POST /api/match (x-api-key) ──► Jina embedding ──► $vectorSearch top-5
                                                        │
                                                        ▼
                                     flow of the best hit's folder decides
                                     ├─ visual  : best score wins (clothing, décor)
                                     └─ precise : close candidates double-checked (parts, electronics)
                                                        │
                                                        ▼
                                     { decision: match | ambiguous | no_match, product, candidates }
```

**Matching flows** are the multipurpose part. Each folder carries a flow, or
inherits its parent's (root folders default to visual). Products are matched
the way their folder's flow says:

| Flow | For | Rule |
|---|---|---|
| `visual` | sarees, kurtas, clothing, décor | top candidate above 0.80 cosine and 1.5 points ahead of the runner-up |
| `precise` | mechanical parts, electronics, bottles | top candidate above 0.85; if several are close, a decision model compares the photos (OpenAI Decisions API, optional) |

Thresholds live in `src/lib/flows.ts` and are unit-tested in `tests/flows.test.ts`.
Query photos are embedded from memory and never stored.

**Photo preprocessing** (`src/lib/image.ts`, uses `sharp`): every photo is EXIF-rotated and
capped at 512 px before embedding (1024 px for the double-check), and a customer photo that is
blurry, too dark, washed out or tiny is answered with `no_match` and a "send a clearer photo"
reason instead of a guess. Thresholds are env-tunable (see `.env.example`) and are first guesses
to tune on the evidence run.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in (MongoDB Atlas, next-auth secret, Jina key, Supabase project + a public-read bucket; the OpenAI key is optional).
3. `npm run ensure-indexes` — creates the regular indexes and, on Atlas, the `vector_index` vector search index (1024 dims, cosine, filter on `ownerId`). On a local MongoDB it prints the definition instead.
4. `npm run dev`, open `/register` to create the first admin, then `/admin`.
5. Settings → **Create key** gives the `x-api-key` Sendiee uses for `/api/match`.

`npm test` runs the flow-decision and image-quality tests. `npm run lint` and `npx tsc --noEmit` check the code.

### Measurement scripts (need keys in `.env.local`)

- `npm run compare-embeddings [photos…]` — A/B `jina-clip-v2` against `jina-embeddings-v5-omni-small` on your own photos: cosine matrices, tokens per photo, latency, and, with `scripts/pairs.json`, the gap between a same-product pair and a look-alike pair. Writes `scripts/COMPARE-RESULTS.md`.
- `npm run decisions-tiebreak <query> <candidate…>` — runs the precise flow's double-check through the same code as `/api/match`, three times: pick, confidence, probabilities, tokens, p50/p95 latency. Writes `scripts/DECISIONS-RESULTS.md`.

## API

All `/api/*` routes except `/api/auth/*` and `/api/match` need a signed-in admin session.

| Route | Purpose |
|---|---|
| `GET/POST /api/folders` · `PATCH/DELETE /api/folders/:id` | folder tree; `flow` is `visual`, `precise` or `null` (inherit) |
| `GET/POST /api/images` · `PATCH/DELETE /api/images/:id` · `POST /api/images/:id/move` · `POST /api/images/:id/reembed` | product images; `POST` embeds the uploaded file |
| `POST /api/upload/presign` · `DELETE /api/upload` | signed Supabase upload URL for the browser; discard uploads that were never saved |
| `GET /api/stats` | dashboard numbers |
| `GET/POST /api/settings/api-key` | create or rotate the match API key (shown once) |
| `POST /api/match` | the customer-facing matcher: `x-api-key` header or admin session; multipart `image`, or JSON `imageUrl` / `imageBase64` |

`POST /api/match` answers:

```json
{
  "decision": "match",
  "flow": "precise",
  "product": { "id": "…", "productName": "…", "price": 0, "sku": "…", "fullUrl": "…" },
  "confidence": 0.82,
  "reason": "Double-check picked it at 82% confidence (similarity 96%)",
  "verifiedBy": "tiebreak",
  "candidates": [{ "product": { "…": "…" }, "cosine": 0.96 }],
  "timings": { "qualityMs": 30, "prepareMs": 20, "embedMs": 640, "searchMs": 35, "tiebreakMs": 410, "totalMs": 1180 },
  "notes": [],
  "quality": { "ok": true, "reasons": [] }
}
```

## Layout

- `src/proxy.ts` — admin pages require a session (Next.js 16 proxy)
- `src/lib/auth.ts` — next-auth options and the `withAdmin()` route guard
- `src/lib/flows.ts` — flow definitions and the pure decision rules
- `src/lib/match.ts` — embed → vector search → flow → decision
- `src/lib/image.ts` — EXIF rotate, resize, quality gate (sharp)
- `src/lib/embedding.ts` (Jina), `src/lib/storage.ts` (Supabase), `src/lib/tiebreak.ts` (OpenAI Decisions)
- `src/lib/folders.ts`, `src/lib/products.ts`, `src/lib/db.ts` — data layer
- `src/app/api/**` — route handlers; `src/app/admin/**` — the admin portal
