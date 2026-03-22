const { Jimp } = require('jimp');
const path = require('path');

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
    const image = await Jimp.read(filePath);
    // In Jimp v1.x, width and height are in bitmap
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    console.log(`Dimensions: ${width}x${height}`);
    
    // Sampling background color from (width-100, height-100)
    const bgColor = image.getPixelColor(width - 100, height - 100);
    
    // Covering the bottom-right corner (80x80)
    for (let x = width - 80; x < width; x++) {
      for (let y = height - 80; y < height; y++) {
        image.setPixelColor(bgColor, x, y);
      }
    }
    
    // In v1.x, write returns a promise
    await image.write(backupPath);
    await image.write(filePath);
    
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
