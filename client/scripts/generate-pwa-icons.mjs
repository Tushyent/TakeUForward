import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const sizes = [192, 512];
const svgBuffer = readFileSync(path.join(publicDir, 'favicon.svg'));

for (const size of sizes) {
  const png = await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer();
  writeFileSync(path.join(publicDir, `pwa-${size}x${size}.png`), png);
  console.log(`Created pwa-${size}x${size}.png`);
}
