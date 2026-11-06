const fs = require('fs');
const assert = require('assert');

// 1. Mock Browser Environment
const localStorageData = {};
global.localStorage = {
  getItem: k => (k in localStorageData ? localStorageData[k] : null),
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: k => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

function createMockElement(tag, id = '') {
  return {
    tagName: tag.toUpperCase(),
    id: id,
    style: {},
    children: [],
    attributes: {},
    innerHTML: '',
    textContent: '',
    value: '',
    options: [{ value: 'poule', text: 'Poule', getAttribute: () => '21' }],
    selectedIndex: 0,
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] || null; },
    removeAttribute(k) { delete this.attributes[k]; },
    classList: {
      classes: [],
      add(c) { if (!this.classes.includes(c)) this.classes.push(c); },
      remove(c) { this.classes = this.classes.filter(x => x !== c); },
      toggle(c, b) { if (b) this.add(c); else this.remove(c); },
      contains(c) { return this.classes.includes(c); }
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {},
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); return c; },
    remove() {},
    focus() {},
    blur() {}
  };
}

const domRegistry = {};
function getOrCreate(id, tag = 'div') {
  if (!domRegistry[id]) domRegistry[id] = createMockElement(tag, id);
  return domRegistry[id];
}

[
  'modalOnboarding', 'modalAuth', 'modalAuthPrompt', 'modalGuestWarning',
  'headerUserText', 'headerUserInitial', 'mobileUserInitial',
  'profileModalFarmerName', 'profileModalAgeAndRole', 'profileModalAvatar',
  'profileGuestWarningBanner'
].forEach(id => getOrCreate(id));

global.document = {
  documentElement: createMockElement('html'),
  body: createMockElement('body'),
  addEventListener: () => {},
  getElementById: id => getOrCreate(id),
  querySelector: sel => {
    if (sel.startsWith('#')) return getOrCreate(sel.slice(1));
    return createMockElement('div');
  },
  querySelectorAll: () => [],
  createElement: tag => createMockElement(tag)
};

global.window = {
  location: { reload: () => {}, hostname: 'localhost', pathname: '/', search: '', hash: '' },
  addEventListener: () => {}
};

eval(fs.readFileSync('avatars.js', 'utf8'));
const transCode = fs.readFileSync('translations.js', 'utf8').replace('const TRANSLATIONS =', 'global.TRANSLATIONS =');
eval(transCode);
eval(fs.readFileSync('app.js', 'utf8'));
eval(fs.readFileSync('supabase-client.js', 'utf8'));

const app = window.app;
const appAuth = window.appAuth;
const appState = window.appState;

console.log('=== TEST SUITE: PROFILE RECOVERY & SINGLE-COLLECTION GUARANTEE ===');

// TEST 1: Returning user quick login from onboarding modal
console.log('\n--- Test 1: switchToLoginFromOnboarding ---');
domRegistry.modalOnboarding.classList.remove('hidden');
app.switchToLoginFromOnboarding();
assert(domRegistry.modalOnboarding.classList.contains('hidden'), 'modalOnboarding must be closed');
assert(!domRegistry.modalAuth.classList.contains('hidden'), 'modalAuth must be opened for login');
console.log('✔ Test 1 Passed: Switch to login closes onboarding and displays authentication options');

// TEST 2: Cloud sync restores existing breeder profile (Name, Birth Date, Avatar)
console.log('\n--- Test 2: Cloud profile recovery during login ---');
const mockCloudProfile = {
  name: 'Ahmed Hajjem',
  birthDate: '1990-05-15',
  age: 36,
  avatar: 'avatar-m3',
  gender: 'male',
  managedAnimals: ['cattle', 'poultry'],
  updatedAt: 1700000000000
};

appAuth.currentUser = { id: 'user-123', email: 'ahmed@test.com' };

// Simulate cloud data payload arriving from user_farms
appAuth.applyCloudData({
  userProfile: mockCloudProfile,
  animals: [],
  expenses: [],
  sales: []
}, true);

// Verify profile is faithfully restored into state and local storage
assert.strictEqual(appState.userProfile.name, 'Ahmed Hajjem');
assert.strictEqual(appState.userProfile.avatar, 'avatar-m3');
assert.strictEqual(appState.userProfile.birthDate, '1990-05-15');
assert.strictEqual(appState.userProfile.age, 36);
assert.strictEqual(localStorage.getItem('fermegest_onboarding_completed'), 'true');
assert.strictEqual(domRegistry.headerUserText.textContent, 'Ahmed Hajjem');
assert(domRegistry.headerUserInitial.innerHTML.length > 20, 'Header avatar SVG must be rendered');
console.log('✔ Test 2 Passed: Breeder name "Ahmed Hajjem", avatar "avatar-m3" and birthdate restored from cloud!');

// TEST 3: Login via OAuth (Facebook / Google) automatically closes all onboarding prompts
console.log('\n--- Test 3: OAuth Login closes onboarding & prevents asking again ---');
domRegistry.modalOnboarding.classList.remove('hidden');
appAuth.handleAuthStateChange('SIGNED_IN', {
  user: {
    id: 'user-123',
    email: 'ahmed@test.com',
    user_metadata: {
      full_name: 'Ahmed Hajjem',
      avatar: 'avatar-m3'
    }
  }
});

assert(domRegistry.modalOnboarding.classList.contains('hidden'), 'Onboarding modal must be closed on auth');
assert.strictEqual(localStorage.getItem('fermegest_onboarding_completed'), 'true', 'Onboarding must be marked completed');
console.log('✔ Test 3 Passed: Authenticated user will never see onboarding modal again!');

console.log('\n===============================================================');
console.log('🎉 ALL PROFILE RECOVERY & ONBOARDING TESTS PASSED (100%)!');
console.log('===============================================================');
