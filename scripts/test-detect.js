const tests = [
  'Nourriture',
  'Aliment',
  'Aliments',
  'Paille',
  'Foin',
  'Alimentation',
  'Ensilage',
  'Concentré',
  'Nourriture vaches',
  'Nourriture animaux',
  'Achat aliment',
  'Table',
  'Étable'
];

function detectFeedTypeFromText(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  if (t.includes('bouchon') || t.includes('ponte') || t.includes('بوشون') || t.includes('بياض')) return 'bouchon';
  if (t.includes('blé') || t.includes('ble') || t.includes('قمح') || t.includes('بليه')) return 'ble';
  if (t.includes('maïs') || t.includes('mais') || t.includes('ذرة') || t.includes('ذرَة')) return 'mais';
  if (t.includes('son') || t.includes('نخالة') || t.includes('sedari') || t.includes('سداري')) return 'son';
  if (t.includes('démarrage') || t.includes('demarrage') || t.includes('بداية') || t.includes('starter')) return 'demarrage';
  if (t.includes('feverole') || t.includes('féverole') || t.includes('فول')) return 'feverole';
  if (t.includes('orge') || t.includes('شعير') || t.includes('barley')) return 'orge';
  if (t.includes('tournesol') || t.includes('عباد') || t.includes('قلوب') || t.includes('sunflower')) return 'tournesol';
  if (t.includes('mélange') || t.includes('melange') || t.includes('خلطة') || t.includes('mixture')) return 'melange';
  if (t.includes('soja') || t.includes('صويا') || t.includes('soy')) return 'soja';
  if (t.includes('concentré') || t.includes('concentre') || t.includes('مركز') || t.includes('cmv')) return 'concentre';
  if (t.includes('croissance') || t.includes('engraissement') || t.includes('تسمين') || t.includes('نمو') || t.includes('grower')) return 'croissance';
  return null;
}

tests.forEach(word => {
  console.log(`"${word}" ->`, detectFeedTypeFromText(word));
});
