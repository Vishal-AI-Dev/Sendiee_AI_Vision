// Photo preprocessing. Runs before every embedding and every match:
//  - apply the EXIF orientation (phone photos are often stored rotated),
//  - cap the longest side so Jina bills the minimum tokens,
//  - cheap quality checks so the bot can ask for a better photo instead of guessing.

import sharp from "sharp";

export const EMBED_MAX_SIDE = Number(process.env.EMBED_MAX_SIDE || 512);
export const TIEBREAK_MAX_SIDE = Number(process.env.TIEBREAK_MAX_SIDE || 1024);

const BLUR_FLOOR = Number(process.env.QUALITY_BLUR_FLOOR || 12); // variance of the Laplacian on a ≤512 px grey copy; smooth white products score ~35 in focus, heavy blur <5
const DARK_FLOOR = Number(process.env.QUALITY_DARK_FLOOR || 40); // mean luminance, 0–255
const BRIGHT_CEIL = Number(process.env.QUALITY_BRIGHT_CEIL || 235);
const MIN_SIDE = Number(process.env.QUALITY_MIN_SIDE || 200); // pixels, after rotation

export interface PreparedImage {
  bytes: Buffer;
  contentType: "image/jpeg";
  width: number;
  height: number;
}

export interface QualityReport {
  ok: boolean;
  reasons: string[];
  width: number;
  height: number;
  brightness: number; // 0–255
  sharpness: number; // variance of the Laplacian; higher is sharper
}

export class ImageDecodeError extends Error {}

function pipeline(input: Buffer) {
  // `rotate()` with no argument applies the EXIF orientation and strips the tag.
  return sharp(input, { failOn: "none" }).rotate();
}

/** EXIF-rotate, cap the longest side, re-encode as JPEG. */
export async function prepareImage(input: Buffer, maxSide = EMBED_MAX_SIDE): Promise<PreparedImage> {
  try {
    const out = await pipeline(input)
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { bytes: out.data, contentType: "image/jpeg", width: out.info.width, height: out.info.height };
  } catch (err) {
    throw new ImageDecodeError(`Could not read the image: ${(err as Error).message}`);
  }
}

/**
 * Brightness and sharpness on a ≤512 px greyscale copy. Sharpness is the
 * variance of the Laplacian (4p − up − down − left − right), computed in JS so
 * negative responses are not clipped the way an 8-bit convolution would.
 */
export async function assessQuality(input: Buffer): Promise<QualityReport> {
  let grey: { data: Buffer; info: { width: number; height: number } };
  let full: { width: number; height: number };
  try {
    const base = pipeline(input);
    const meta = await base.metadata();
    const swap = (meta.orientation ?? 1) >= 5; // EXIF 5–8 are the 90° cases
    full = {
      width: (swap ? meta.height : meta.width) ?? 0,
      height: (swap ? meta.width : meta.height) ?? 0,
    };
    grey = await base
      .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch (err) {
    throw new ImageDecodeError(`Could not read the image: ${(err as Error).message}`);
  }

  const { data, info } = grey;
  const w = info.width;
  const h = info.height;

  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  const brightness = data.length ? sum / data.length : 0;

  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const i = row + x;
      const v = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
      lapSum += v;
      lapSq += v * v;
      n++;
    }
  }
  const mean = n ? lapSum / n : 0;
  const sharpness = n ? lapSq / n - mean * mean : 0;

  const reasons: string[] = [];
  if (Math.min(full.width, full.height) < MIN_SIDE) reasons.push(`too small (${full.width}×${full.height})`);
  if (brightness < DARK_FLOOR) reasons.push("too dark");
  else if (brightness > BRIGHT_CEIL) reasons.push("washed out");
  if (sharpness < BLUR_FLOOR) reasons.push("blurry");

  return {
    ok: reasons.length === 0,
    reasons,
    width: full.width,
    height: full.height,
    brightness: Math.round(brightness),
    sharpness: Math.round(sharpness),
  };
}
