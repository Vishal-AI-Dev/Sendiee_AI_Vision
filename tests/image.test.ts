import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { assessQuality, prepareImage } from "../src/lib/image";

/** A high-contrast checkerboard: very sharp, mid brightness. */
async function checkerboard(width: number, height: number, square = 16): Promise<Buffer> {
  const data = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data[y * width + x] = (Math.floor(x / square) + Math.floor(y / square)) % 2 ? 230 : 25;
  return sharp(data, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

test("prepareImage caps the longest side and keeps the aspect ratio", async () => {
  const big = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "#808080" } }).jpeg().toBuffer();
  const out = await prepareImage(big);
  assert.equal(out.width, 512);
  assert.equal(out.height, 256);
  assert.equal(out.contentType, "image/jpeg");
});

test("prepareImage does not enlarge small photos", async () => {
  const small = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#808080" } }).jpeg().toBuffer();
  const out = await prepareImage(small);
  assert.equal(out.width, 300);
  assert.equal(out.height, 200);
});

test("prepareImage applies the EXIF orientation", async () => {
  // Orientation 6 = rotate 90° clockwise on display; a 400×200 file should come out 200×400.
  const rotated = await sharp({ create: { width: 400, height: 200, channels: 3, background: "#808080" } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const out = await prepareImage(rotated);
  assert.equal(out.width, 200);
  assert.equal(out.height, 400);
});

test("assessQuality accepts a sharp, well-lit photo", async () => {
  const q = await assessQuality(await checkerboard(640, 480));
  assert.equal(q.ok, true, JSON.stringify(q));
  assert.ok(q.sharpness > 1000);
});

test("assessQuality flags a blurry photo", async () => {
  const blurred = await sharp(await checkerboard(640, 480)).blur(12).png().toBuffer();
  const q = await assessQuality(blurred);
  assert.equal(q.ok, false);
  assert.ok(q.reasons.includes("blurry"), JSON.stringify(q));
});

test("assessQuality flags a dark photo", async () => {
  const dark = await sharp({ create: { width: 640, height: 480, channels: 3, background: "#0a0a0a" } }).png().toBuffer();
  const q = await assessQuality(dark);
  assert.ok(q.reasons.includes("too dark"), JSON.stringify(q));
});

test("assessQuality flags a tiny photo", async () => {
  const q = await assessQuality(await checkerboard(120, 90, 8));
  assert.ok(q.reasons.some((r) => r.startsWith("too small")), JSON.stringify(q));
});

test("assessQuality reports rotated dimensions", async () => {
  const rotated = await sharp(await checkerboard(640, 480)).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const q = await assessQuality(rotated);
  assert.equal(q.width, 480);
  assert.equal(q.height, 640);
});
