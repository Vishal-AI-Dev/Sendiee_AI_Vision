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

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in (MongoDB Atlas, next-auth secret, Jina key, Supabase project + a public-read bucket; the OpenAI key is optional).
3. `npm run ensure-indexes` — creates the regular indexes and, on Atlas, the `vector_index` vector search index (1024 dims, cosine, filter on `ownerId`). On a local MongoDB it prints the definition instead.
4. `npm run dev`, open `/register` to create the first admin, then `/admin`.
5. Settings → **Create key** gives the `x-api-key` Sendiee uses for `/api/match`.

`npm test` runs the flow decision tests. `npm run lint` and `npx tsc --noEmit` check the code.

## API

All `/api/*` routes except `/api/auth/*` and `/api/match` need a signed-in admin session.

| Route | Purpose |
|---|---|
| `GET/POST /api/folders` · `PATCH/DELETE /api/folders/:id` | folder tree; `flow` is `visual`, `precise` or `null` (inherit) |
| `GET/POST /api/images` · `PATCH/DELETE /api/images/:id` · `POST /api/images/:id/move` · `POST /api/images/:id/reembed` | product images; `POST` embeds the uploaded file |
| `POST /api/upload/presign` | signed Supabase upload URL for the browser |
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
  "timings": { "embedMs": 640, "searchMs": 35, "tiebreakMs": 410, "totalMs": 1180 },
  "notes": []
}
```

## Layout

- `src/proxy.ts` — admin pages require a session (Next.js 16 proxy)
- `src/lib/auth.ts` — next-auth options and the `withAdmin()` route guard
- `src/lib/flows.ts` — flow definitions and the pure decision rules
- `src/lib/match.ts` — embed → vector search → flow → decision
- `src/lib/embedding.ts` (Jina), `src/lib/storage.ts` (Supabase), `src/lib/tiebreak.ts` (OpenAI Decisions)
- `src/lib/folders.ts`, `src/lib/products.ts`, `src/lib/db.ts` — data layer
- `src/app/api/**` — route handlers; `src/app/admin/**` — the admin portal
