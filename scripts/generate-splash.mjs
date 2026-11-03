/**
 * Generates the iOS PWA launch images (apple-touch-startup-image).
 *
 * Run with: node scripts/generate-splash.mjs
 * The output lives in public/splash and is referenced from src/app/layout.tsx.
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const ICON = "public/favicon/icon-512.png";
const OUT_DIR = "public/splash";

// [width, height, device description] matching common iPhone / iPad viewports.
const SIZES = [
  [1290, 2796, "iPhone 14/15/16 Pro Max"],
  [1179, 2556, "iPhone 14/15/16 Pro"],
  [1170, 2532, "iPhone 12/13/14"],
  [1125, 2436, "iPhone X/XS/11 Pro"],
  [1242, 2688, "iPhone XS Max/11 Pro Max"],
  [828, 1792, "iPhone XR/11"],
  [750, 1334, "iPhone SE/8"],
  [1536, 2048, "iPad 9.7/10.2"],
  [2048, 2732, "iPad Pro 12.9"],
];

function backdrop(width, height) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<defs><radialGradient id="glow" cx="50%" cy="41%" r="46%">` +
      `<stop offset="0%" stop-color="#00c950" stop-opacity="0.18"/>` +
      `<stop offset="55%" stop-color="#00c950" stop-opacity="0.06"/>` +
      `<stop offset="100%" stop-color="#00c950" stop-opacity="0"/>` +
      `</radialGradient></defs>` +
      `<rect width="100%" height="100%" fill="#ffffff"/>` +
      `<rect width="100%" height="100%" fill="url(#glow)"/>` +
      `</svg>`
  );
}

await mkdir(OUT_DIR, { recursive: true });

for (const [width, height, label] of SIZES) {
  const iconSize = Math.round(Math.min(width, height) * 0.23);
  const icon = await sharp(ICON).resize(iconSize, iconSize).png().toBuffer();

  await sharp(backdrop(width, height))
    .composite([
      {
        input: icon,
        left: Math.round((width - iconSize) / 2),
        top: Math.round(height * 0.41 - iconSize / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT_DIR}/splash-${width}x${height}.png`);

  process.stdout.write(`✓ ${width}x${height} — ${label}\n`);
}
