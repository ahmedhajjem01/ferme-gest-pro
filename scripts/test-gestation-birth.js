// Test script for Gestation & Maternity / Birth monitoring
const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; }
};

// 1. Test Gestation Calculation
console.log('=== TEST 1: GESTATION TIMING & MILESTONES ===');

const testMatingDate = '2026-05-01';
const today = new Date('2026-11-06'); // J +189

// Bovine (283 days)
const bovineMating = new Date(testMatingDate);
const bovineDaysElapsed = Math.floor((today - bovineMating) / (1000 * 60 * 60 * 24));
const bovineDaysRemaining = 283 - bovineDaysElapsed;
const bovineProgress = Math.round((bovineDaysElapsed / 283) * 100);

console.log('Bovine - Elapsed:', bovineDaysElapsed, 'Remaining:', bovineDaysRemaining, 'Progress:', bovineProgress + '%');
assert.strictEqual(bovineDaysElapsed, 189);
assert.strictEqual(bovineDaysRemaining, 94);
assert.strictEqual(bovineProgress, 67);

// Ovine (150 days)
const ovineMating = new Date('2026-08-01');
const ovineDaysElapsed = Math.floor((today - ovineMating) / (1000 * 60 * 60 * 24));
const ovineDaysRemaining = 150 - ovineDaysElapsed;
const ovineProgress = Math.round((ovineDaysElapsed / 150) * 100);

console.log('Ovine - Elapsed:', ovineDaysElapsed, 'Remaining:', ovineDaysRemaining, 'Progress:', ovineProgress + '%');
assert.strictEqual(ovineDaysElapsed, 97);
assert.strictEqual(ovineDaysRemaining, 53);
assert.strictEqual(ovineProgress, 65);

console.log('✔ Gestation calculations verified successfully!');
