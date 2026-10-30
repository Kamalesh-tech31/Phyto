import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '../node_modules/onnxruntime-web/dist');
const targetDir = path.resolve(__dirname, '../public/ort');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (!fs.existsSync(sourceDir)) {
  console.warn(`[copy-ort-wasm] Warning: ${sourceDir} does not exist. Skipping copy.`);
  process.exit(0);
}

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.wasm'));

let count = 0;
for (const file of files) {
  const src = path.join(sourceDir, file);
  const dest = path.join(targetDir, file);
  fs.copyFileSync(src, dest);
  count++;
}

console.log(`[copy-ort-wasm] Successfully copied ${count} wasm file(s) to public/ort/`);
