import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontsDir = path.resolve(__dirname, '..', 'public', 'assets', 'fonts');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Google Fonts CSS URLs for the scripts with user-agent for woff2
const fontConfigs = [
  {
    name: 'noto-sans-tamil.woff2',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap',
  },
  {
    name: 'noto-sans-devanagari.woff2',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap',
  },
  {
    name: 'noto-sans-malayalam.woff2',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;600;700&display=swap',
  },
  {
    name: 'noto-sans-telugu.woff2',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&display=swap',
  },
  {
    name: 'plus-jakarta-sans.woff2',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap',
  },
  {
    name: 'newsreader.woff2',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600;700&display=swap',
  },
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      // Modern browser User-Agent to ensure Google Fonts returns woff2 format
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    https
      .get(url, { headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

async function run() {
  console.log('Downloading offline fonts...');
  for (const item of fontConfigs) {
    try {
      console.log(`Fetching CSS for ${item.name}...`);
      const css = await fetchText(item.cssUrl);
      // Extract first woff2 url
      const match = css.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/);
      if (match && match[1]) {
        const woff2Url = match[1];
        const dest = path.join(fontsDir, item.name);
        console.log(`Downloading ${woff2Url} -> ${item.name}`);
        await downloadBinary(woff2Url, dest);
        console.log(`Saved ${item.name}`);
      } else {
        console.warn(`Could not extract woff2 url for ${item.name}`);
      }
    } catch (err) {
      console.warn(`Failed downloading ${item.name}:`, err.message);
    }
  }
  console.log('Font download complete.');
}

run();
