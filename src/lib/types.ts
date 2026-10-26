// Shared API types used by both the admin UI and the route handlers.

/** A matching flow decides how a customer photo is compared with the catalogue. */
export type FlowId = "visual" | "precise";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null = root
  imageCount: number;
  createdAt: string;
  color: string; // accent colour for the card
  /** Flow set on this folder, or null to inherit from the parent (the root inherits the default). */
  flow: FlowId | null;
  /** The flow that actually applies to products in this folder, after inheritance. */
  effectiveFlow: FlowId;
}

export type EmbeddingStatus = "ready" | "pending" | "failed";

export interface ProductImage {
  id: string;
  folderId: string | null; // null = root
  thumbnailUrl: string;
  fullUrl: string;
  productName: string;
  price: number;
  sku: string;
  tags: string[];
  description: string;
  uploadedAt: string;
  fileSize: number; // bytes
  /** Whether the reference image has an embedding and can be matched. */
  embeddingStatus: EmbeddingStatus;
}

export interface LibraryStats {
  totalImages: number;
  totalFolders: number;
  storageUsedBytes: number;
  recentUploads: number; // last 7 days
  readyImages: number;
  failedImages: number;
  byFlow: Record<FlowId, number>;
}

export interface ApiKeyInfo {
  prefix: string | null;
  createdAt: string | null;
}

export type DecisionKind = "match" | "ambiguous" | "no_match";

export interface MatchCandidate {
  product: ProductImage;
  /** Cosine similarity between the customer photo and this reference image (1 = identical). */
  cosine: number;
}

export interface MatchResult {
  decision: DecisionKind;
  flow: FlowId;
  product: ProductImage | null;
  confidence: number;
  reason: string;
  verifiedBy: "score" | "tiebreak" | null;
  candidates: MatchCandidate[];
  timings: Record<string, number>;
  notes: string[];
  /** Photo quality check on the customer photo; a failed check short-circuits to no_match. */
  quality: { ok: boolean; reasons: string[] };
}
