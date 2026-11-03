const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WWW_DIR = path.resolve(ROOT_DIR, 'www');

// List of assets to copy into www
const ASSETS = [
  'index.html',
  'avatars.js',
  'app.js',
  'supabase-client.js',
  'mobile-bridge.js',
  'translations.js',
  'styles.css',
  'manifest.json',
  'sw.js',
  'logo.png',
  'icon-192.png',
  'icon-512.png',
  'privacy.html'
];

console.log('[Build] Preparing clean www folder for Capacitor Android & iOS...');

if (fs.existsSync(WWW_DIR)) {
  fs.rmSync(WWW_DIR, { recursive: true, force: true });
}
fs.mkdirSync(WWW_DIR, { recursive: true });

let count = 0;
for (const file of ASSETS) {
  const src = path.join(ROOT_DIR, file);
  const dest = path.join(WWW_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
    count++;
  } else if (file !== 'privacy.html') {
    console.warn(`  ⚠ Warning: ${file} not found at ${src}`);
  }
}

// Clean any leftover APK from android public assets if present
const androidPublicDir = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'public');
if (fs.existsSync(androidPublicDir)) {
  const redundantApk = path.join(androidPublicDir, 'FermeGestPro.apk');
  if (fs.existsSync(redundantApk)) {
    fs.unlinkSync(redundantApk);
    console.log('  ✓ Cleaned redundant FermeGestPro.apk from android assets.');
  }
}

console.log(`[Build] Successfully copied ${count} files to ${WWW_DIR}.`);
