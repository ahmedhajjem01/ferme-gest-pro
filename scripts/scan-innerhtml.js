const fs = require('fs');
const appJs = fs.readFileSync('app.js', 'utf8');

console.log('=== SCANNING TEMPLATE LITERALS FOR UNTRANSLATED FRENCH IN APP.JS ===');

// Match template literals `...` that span lines and contain French words like "Modifier", "Supprimer", "Aucun", "Total", "Date", etc.
const lines = appJs.split('\n');
const suspiciousLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Look for French UI text in innerHTML or template strings that don't have isAr or this.t
  if (/innerHTML\s*\+?=|>\s*(?:Ajouter|Modifier|Supprimer|Veuillez|Aucun|En stock|Total|Attention|Détails|Actions|Statut|Fermer|Valider)\s*</i.test(line)) {
    if (!line.includes('this.t(') && !line.includes('isAr') && !line.includes('lang')) {
      suspiciousLines.push({ lineNum: i + 1, content: line.trim() });
    }
  }
}
console.log(`Found ${suspiciousLines.length} suspicious lines in app.js:`);
suspiciousLines.forEach(l => console.log(`L${l.lineNum}: ${l.content.substring(0, 100)}`));
