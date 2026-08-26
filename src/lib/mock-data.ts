// ─── Types ────────────────────────────────────────────────────────────────────

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null = root
  imageCount: number;
  createdAt: string;
  color: string; // accent color for the card
}

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
}

// ─── Stub Folders ─────────────────────────────────────────────────────────────

export const MOCK_FOLDERS: Folder[] = [
  {
    id: "f1",
    name: "Summer Collection",
    parentId: null,
    imageCount: 24,
    createdAt: "2026-06-01T09:00:00Z",
    color: "#F59E0B",
  },
  {
    id: "f2",
    name: "Winter Essentials",
    parentId: null,
    imageCount: 18,
    createdAt: "2026-07-15T10:30:00Z",
    color: "#6366F1",
  },
  {
    id: "f3",
    name: "Festive Wear",
    parentId: null,
    imageCount: 31,
    createdAt: "2026-08-01T08:00:00Z",
    color: "#EC4899",
  },
  {
    id: "f4",
    name: "Accessories",
    parentId: null,
    imageCount: 12,
    createdAt: "2026-08-10T11:00:00Z",
    color: "#10B981",
  },
  {
    id: "f5",
    name: "Sarees",
    parentId: "f1",
    imageCount: 9,
    createdAt: "2026-06-05T09:00:00Z",
    color: "#8B5CF6",
  },
  {
    id: "f6",
    name: "Kurtas",
    parentId: "f1",
    imageCount: 15,
    createdAt: "2026-06-05T09:30:00Z",
    color: "#06B6D4",
  },
];

// ─── Stub Images ──────────────────────────────────────────────────────────────

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80",
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80",
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&q=80",
  "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400&q=80",
  "https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=400&q=80",
  "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=400&q=80",
  "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&q=80",
];

function img(
  id: string,
  folderId: string | null,
  name: string,
  price: number,
  sku: string,
  tags: string[],
  imgIndex: number
): ProductImage {
  return {
    id,
    folderId,
    thumbnailUrl: PLACEHOLDER_IMAGES[imgIndex % PLACEHOLDER_IMAGES.length],
    fullUrl: PLACEHOLDER_IMAGES[imgIndex % PLACEHOLDER_IMAGES.length],
    productName: name,
    price,
    sku,
    tags,
    description: `Premium quality ${name.toLowerCase()} crafted with finest materials.`,
    uploadedAt: "2026-08-20T10:00:00Z",
    fileSize: 1024 * 1024 * (1 + imgIndex * 0.3),
  };
}

export const MOCK_IMAGES: ProductImage[] = [
  img("i1", "f5", "Banarasi Silk Saree", 3499, "SAR-001", ["silk", "banarasi", "festive"], 0),
  img("i2", "f5", "Chanderi Cotton Saree", 1299, "SAR-002", ["cotton", "chanderi", "casual"], 1),
  img("i3", "f5", "Georgette Designer Saree", 2199, "SAR-003", ["georgette", "designer"], 2),
  img("i4", "f6", "Embroidered Kurta Set", 1899, "KUR-001", ["kurta", "embroidered", "festive"], 3),
  img("i5", "f6", "Linen Casual Kurta", 799, "KUR-002", ["linen", "casual", "daily-wear"], 4),
  img("i6", "f2", "Woolen Shawl", 2499, "WIN-001", ["wool", "shawl", "winter"], 5),
  img("i7", "f3", "Lehenga Choli Set", 5999, "FES-001", ["lehenga", "festive", "premium"], 6),
  img("i8", "f4", "Oxidised Jhumka Earrings", 449, "ACC-001", ["earrings", "oxidised", "traditional"], 7),
  img("i9", null, "Handloom Cotton Dupatta", 599, "DUP-001", ["dupatta", "handloom", "cotton"], 0),
  img("i10", null, "Embroidered Clutch Bag", 1199, "BAG-001", ["bag", "clutch", "embroidered"], 1),
];

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export const MOCK_STATS = {
  totalImages: 127,
  totalFolders: 14,
  storageUsed: "2.4 GB",
  storageTotal: "10 GB",
  recentUploads: 8,
  thisWeekGrowth: 12,
};
