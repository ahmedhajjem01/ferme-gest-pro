/**
 * Unified Master Test Runner
 * Runs all test suites sequentially and reports consolidated results.
 */

const { execSync } = require('child_process');

const suites = [
  'scripts/test_collaborative_sync_and_disconnect.js',
  'scripts/test_24_egg_sync_and_button.js',
  'scripts/test_master_synchronization_suite.js',
  'scripts/test_sync_resilience_and_anti_429.js',
  'scripts/test_reset_farm_to_zero.js',
  'scripts/test_user_scenario_87_eggs.js',
  'scripts/test_reserve_stock_feed.js',
  'scripts/test_feed_deduplication.js',
  'scripts/test_decrement_numbers.js',
  'scripts/test_mobile_sovereignty.js'
];

console.log('========================================================================');
console.log('🚀 EXÉCUTION DE TOUTES LES SUITES DE TESTS FERMEGEST PRO');
console.log('========================================================================\n');

let allPassed = true;
const results = [];

for (const suite of suites) {
  process.stdout.write(`⏳ Exécution de ${suite} ... `);
  try {
    const output = execSync(`node ${suite}`, { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
    results.push({ suite, status: 'PASS' });
    console.log('✅ SUCCÈS');
  } catch (err) {
    results.push({ suite, status: 'FAIL', error: err.message });
    console.log('❌ ÉCHEC');
    console.error(err.stdout || err.stderr || err);
    allPassed = false;
  }
}

console.log('\n========================================================================');
console.log('📊 TABLEAU RÉCAPITULATIF DES SUITES DE TESTS');
console.log('========================================================================');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} ${r.suite.padEnd(50)} : ${r.status}`);
});

if (allPassed) {
  console.log('\n🎉 TOUTES LES SUITES DE TESTS SONT 100% VALIDES ET SANS AUCUNE RÉGRESSION !');
  process.exit(0);
} else {
  console.error('\n⚠️ DES TESTS ONT ÉCHOUÉ.');
  process.exit(1);
}
