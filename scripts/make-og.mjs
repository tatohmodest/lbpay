import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const width = 1200;
const height = 630;
const iconSize = 176;
const iconLeft = 96;
const iconTop = Math.round((height - iconSize) / 2);

const rounded = Buffer.from(
  `<svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${iconSize}" height="${iconSize}" rx="40" fill="#fff"/>
  </svg>`,
);

const icon = await sharp(join(root, "public/icons/icon-512.png"))
  .resize(iconSize, iconSize)
  .composite([{ input: rounded, blend: "dest-in" }])
  .png()
  .toBuffer();

const card = Buffer.from(
  `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0c1913"/>
        <stop offset="100%" stop-color="#07140f"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="160" cy="90" r="260" fill="#00b369" fill-opacity="0.22"/>
    <circle cx="1080" cy="560" r="220" fill="#00b369" fill-opacity="0.12"/>
    <text x="316" y="286" font-family="Inter" font-weight="700" font-size="84" fill="#ffffff">LBPay</text>
    <text x="316" y="348" font-family="Inter" font-weight="500" font-size="32" fill="#d7ebe3">Send money in Cameroon</text>
    <text x="316" y="402" font-family="Inter" font-weight="500" font-size="22" fill="#8fb3a5">MTN  ·  Orange Money  ·  XAF wallet</text>
  </svg>`,
);

const png = await sharp(card)
  .composite([{ input: icon, top: iconTop, left: iconLeft }])
  .png({ compressionLevel: 9, quality: 90 })
  .toBuffer();

const targets = [
  join(root, "public/og.png"),
  join(root, "app/opengraph-image.png"),
  join(root, "app/twitter-image.png"),
];

for (const file of targets) writeFileSync(file, png);
console.log(`wrote ${targets.length} share images (${png.length} bytes)`);
