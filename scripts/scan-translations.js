const fs = require('fs');
const T = require('../translations.js');

console.log('=== 1. LANGUAGE KEY PARITY ===');
const frKeys = Object.keys(T.fr);
const arKeys = Object.keys(T.ar);
const enKeys = Object.keys(T.en);

const missingInAr = frKeys.filter(k => !(k in T.ar));
const missingInFr = arKeys.filter(k => !(k in T.fr));
const missingInEn = frKeys.filter(k => !(k in T.en));
console.log(`FR total: ${frKeys.length}, AR total: ${arKeys.length}, EN total: ${enKeys.length}`);
if (missingInAr.length) console.log('Missing in AR:', missingInAr);
if (missingInFr.length) console.log('Missing in FR:', missingInFr);
if (missingInEn.length) console.log('Missing in EN:', missingInEn);

console.log('\n=== 2. LATIN-ONLY TEXT IN ARABIC (UNTRANSLATED RESIDUES) ===');
const untranslatedInAr = [];
for (const [k, v] of Object.entries(T.ar)) {
  if (typeof v === 'string') {
    const cleaned = v.replace(/\{[a-zA-Z0-9_]+\}/g, '')
                     .replace(/[\d\s\.,;:!?\-\(\)\/\\%\+€\$#@&]/g, '')
                     .replace(/[🌾🥚💰🤖🍽️➕🎉💡📦🥫⚖️🥣⏳🏷️📊💵📈📉🏷️🐓🐔🐥🦆🦃]/gu, '');
    if (cleaned.length > 2 && !/[\u0600-\u06FF]/.test(cleaned)) {
      untranslatedInAr.push({ key: k, value: v, fr: T.fr[k] });
    }
  }
}
console.log(`Found ${untranslatedInAr.length} potentially untranslated entries in AR:`, untranslatedInAr);

console.log('\n=== 3. HTML DATA-I18N KEYS MISSING FROM TRANSLATIONS ===');
const html = fs.readFileSync('index.html', 'utf8');
const htmlAttrRegex = /data-i18n(?:-placeholder|-title|-html)?=["']([^"']+)["']/g;
let m;
const missingHtmlKeys = new Set();
while ((m = htmlAttrRegex.exec(html)) !== null) {
  const k = m[1];
  if (!(k in T.fr)) missingHtmlKeys.add(k);
}
console.log(`Missing HTML keys (${missingHtmlKeys.size}):`, Array.from(missingHtmlKeys));

console.log('\n=== 4. APP.JS THIS.T(...) CALLS MISSING FROM TRANSLATIONS ===');
const appJs = fs.readFileSync('app.js', 'utf8');
const appTRegex = /this\.t\(\s*['"]([^'"]+)['"]\s*\)/g;
const missingAppTKeys = new Set();
while ((m = appTRegex.exec(appJs)) !== null) {
  const k = m[1];
  if (!(k in T.fr)) missingAppTKeys.add(k);
}
console.log(`Missing app.js this.t keys (${missingAppTKeys.size}):`, Array.from(missingAppTKeys));

console.log('\n=== 5. BUTTONS IN INDEX.HTML MISSING DATA-I18N ===');
// Search for <button ...>Some text</button> where there is text inside but no data-i18n
const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
const buttonsWithoutI18n = [];
while ((m = buttonRegex.exec(html)) !== null) {
  const attrs = m[1];
  const inner = m[2].replace(/<[^>]+>/g, '').trim();
  // If button has visible text (> 1 char) and is not just an icon or close symbol (&times;, ×, +, −)
  if (inner.length > 1 && !/^[×&times;+−\-\d\s]+$/.test(inner)) {
    if (!attrs.includes('data-i18n') && !m[2].includes('data-i18n')) {
      buttonsWithoutI18n.push({ text: inner, snippet: m[0].substring(0, 100) });
    }
  }
}
console.log(`Buttons without data-i18n (${buttonsWithoutI18n.length}):`, buttonsWithoutI18n);

console.log('\n=== 7. LABELS WITHOUT DATA-I18N ===');
const labelRegex = /<label\b([^>]*)>([\s\S]*?)<\/label>/gi;
const labelsWithoutI18n = [];
while ((m = labelRegex.exec(html)) !== null) {
  const attrs = m[1];
  const inner = m[2].replace(/<[^>]+>/g, '').trim();
  if (inner.length > 1) {
    if (!attrs.includes('data-i18n') && !m[2].includes('data-i18n')) {
      labelsWithoutI18n.push({ text: inner, snippet: m[0].substring(0, 80) });
    }
  }
}
console.log(`Labels without data-i18n (${labelsWithoutI18n.length}):`, labelsWithoutI18n);

console.log('\n=== 8. OPTIONS WITHOUT DATA-I18N ===');
const optionRegex = /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;
const optionsWithoutI18n = [];
while ((m = optionRegex.exec(html)) !== null) {
  const attrs = m[1];
  const inner = m[2].replace(/<[^>]+>/g, '').trim();
  if (inner.length > 0 && attrs.includes('value')) {
    if (!attrs.includes('data-i18n') && !m[2].includes('data-i18n')) {
      // Exclude simple numbers or currencies
      if (!/^[0-9A-Z\s\.\,\-\/]+$/.test(inner) || inner.length > 5) {
        optionsWithoutI18n.push({ text: inner, snippet: m[0] });
      }
    }
  }
}
console.log(`Options without data-i18n (${optionsWithoutI18n.length}):`, optionsWithoutI18n);

console.log('\n=== 9. TABLE HEADERS (TH) WITHOUT DATA-I18N ===');
const thRegex = /<th\b([^>]*)>([\s\S]*?)<\/th>/gi;
const thWithoutI18n = [];
while ((m = thRegex.exec(html)) !== null) {
  const attrs = m[1];
  const inner = m[2].replace(/<[^>]+>/g, '').trim();
  if (inner.length > 1) {
    if (!attrs.includes('data-i18n') && !m[2].includes('data-i18n')) {
      thWithoutI18n.push({ text: inner, snippet: m[0] });
    }
  }
}
console.log(`Table headers without data-i18n (${thWithoutI18n.length}):`, thWithoutI18n);

