import jimp from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, '../public/images/products');

const IMAGES = [
  'chicken-65-raw.png',
  'chicken-lollipop-raw.png',
  'chicken-popcorn-raw.png',
  'chicken-wings-raw.png'
];

async function processImage(filename) {
  const filePath = path.join(PRODUCTS_DIR, filename);
  const backupPath = path.join(PRODUCTS_DIR, `backup-${filename}`);
  
  console.log(`Processing ${filename}...`);
  
  try {
    const image = await jimp.read(filePath);
    const width = image.getWidth();
    const height = image.getHeight();
    
    // Sampling background color from slightly above and left of the watermark
    const bgColor = image.getPixelColor(width - 100, height - 100);
    
    // Covering the bottom-right corner (approx 80x80)
    for (let x = width - 80; x < width; x++) {
      for (let y = height - 80; y < height; y++) {
        image.setPixelColor(bgColor, x, y);
      }
    }
    
    // Save backup and overwrite
    await image.writeAsync(backupPath);
    await image.writeAsync(filePath);
    
    console.log(`Successfully cleaned ${filename}`);
  } catch (err) {
    console.error(`Error processing ${filename}:`, err);
  }
}

async function run() {
  for (const img of IMAGES) {
    await processImage(img);
  }
}

run();
