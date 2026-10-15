const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WWW_DIR = path.resolve(ROOT_DIR, 'www');

// List of assets to copy into www
const ASSETS = [
  'index.html',
  'app.js',
  'supabase-client.js',
  'mobile-bridge.js',
  'translations.js',
  'styles.css',
  'manifest.json',
  'sw.js',
  'logo.png',
  'icon-192.png',
  'icon-512.png'
];

console.log('[Build] Preparing www folder for Capacitor Android & iOS...');

if (!fs.existsSync(WWW_DIR)) {
  fs.mkdirSync(WWW_DIR, { recursive: true });
}

let count = 0;
for (const file of ASSETS) {
  const src = path.join(ROOT_DIR, file);
  const dest = path.join(WWW_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
    count++;
  } else {
    console.warn(`  ⚠ Warning: ${file} not found at ${src}`);
  }
}

console.log(`[Build] Successfully copied ${count} files to ${WWW_DIR}.`);
