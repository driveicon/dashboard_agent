const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=== TEST: CA USER SKOR TERTINGGI COMPLETE FLOW ===\n');

// 1. Static Checks in index.html and js/app.js
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// A. Check index.html filterCaMonth default selection
const caSelectMatch = htmlContent.match(/<select id="filterCaMonth"[^>]*>([\s\S]*?)<\/select>/);
assert(caSelectMatch, 'filterCaMonth select element must exist in index.html');
assert(caSelectMatch[1].includes('<option value="2026-10" selected>Oktober 2026</option>'),
  '2026-10 must be selected in filterCaMonth dropdown in index.html');
console.log('[PASS] index.html filterCaMonth has 2026-10 selected by default.');

// B. Check UI definition in js/app.js
assert(appJsContent.includes("caStatTopUser: document.getElementById('caStatTopUser'),"),
  'UI object must include caStatTopUser mapping');
console.log('[PASS] UI.caStatTopUser is defined in js/app.js');

// C. Check PAGE_CONTROL_DEFAULTS.ca
assert(appJsContent.includes("filterCaMonth: '2026-10',"),
  'PAGE_CONTROL_DEFAULTS.ca must default to 2026-10');
console.log('[PASS] PAGE_CONTROL_DEFAULTS.ca defaults to 2026-10.');

// 2. DOM & Runtime Simulation
class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.textContent = '';
    this._innerHTML = '';
    this.checked = false;
    this.title = '';
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList.classes.has(c)) this.classList.classes.delete(c);
          else this.classList.classes.add(c);
        } else if (force) {
          this.classList.classes.add(c);
        } else {
          this.classList.classes.delete(c);
        }
      }
    };
    this.children = [];
    this.style = {};
    this.options = [];
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = val;
    this.children = [];
    this.options = [];
    if (val && this.tagName === 'SELECT') {
      const regex = /<option\s+value="([^"]*)"[^>]*>([^<]*)<\/option>/gi;
      let match;
      while ((match = regex.exec(val)) !== null) {
        const opt = new MockElement('', 'option');
        opt.value = match[1];
        opt.textContent = match[2];
        this.options.push(opt);
        this.children.push(opt);
      }
    }
  }
  appendChild(c) {
    this.children.push(c);
    if (c.tagName === 'OPTION') {
      this.options.push(c);
    }
  }
  querySelectorAll(sel) {
    return [];
  }
  querySelector(sel) {
    return null;
  }
  addEventListener() {}
  scrollIntoView() {}
}

const domElements = {};
function getEl(id, tag = 'div') {
  if (!domElements[id]) {
    domElements[id] = new MockElement(id, tag);
  }
  return domElements[id];
}

const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.document = {
  getElementById: (id) => getEl(id),
  querySelector: (sel) => {
    const clean = sel.replace(/^[#.]/, '').split(' ')[0];
    return getEl(clean);
  },
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement('', tag),
  visibilityState: 'visible'
};

global.window = {
  document: global.document,
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { reload: () => {} },
  navigator: { userAgent: 'node' },
  CustomEvent: class {}
};

global.localStorage = mockLocalStorage;

const script = new vm.Script(appJsContent, { filename: 'app.js' });
const context = vm.createContext(global);
script.runInContext(context);

const state = global.window.state;
const UI = global.window.UI;
assert(state, 'state must exist');
assert(UI, 'UI must exist');

// Set up sample users
state.users = [
  { id: 'usr_admin', fullName: 'Admin Icon', username: 'admin', role: 'admin' },
  { id: 'usr_rofi', fullName: 'Rofi Andiyono', username: 'rofi', role: 'user' },
  { id: 'usr_avina', fullName: 'Avina Ainun Zahra', username: 'avina', role: 'user' },
  { id: 'usr_sugeng', fullName: 'Sugeng Riyadi', username: 'sugeng', role: 'user' }
];
state.saveUsers(state.users);

// Set up sample CA logs in 2026-10
const sampleCaLogs = [
  { id: 'ca1', date: '2026-10-05', userFullName: 'Rofi Andiyono', score: 98.5, department: 'CSO DIGILIVE CHAT - WA', status: 'Terverifikasi' },
  { id: 'ca2', date: '2026-10-12', userFullName: 'Rofi Andiyono', score: 90.0, department: 'CSO DIGILIVE CHAT - WA', status: 'Terverifikasi' }, // Avg: 94.25
  { id: 'ca3', date: '2026-10-06', userFullName: 'Avina Ainun Zahra', score: 96.6, department: 'CSO DIGILIVE CHAT - WA', status: 'Terverifikasi' },
  { id: 'ca4', date: '2026-10-15', userFullName: 'Avina Ainun Zahra', score: 91.0, department: 'CSO DIGILIVE CHAT - WA', status: 'Terverifikasi' }, // Avg: 93.80
  { id: 'ca5', date: '2026-10-07', userFullName: 'Sugeng Riyadi', score: 93.0, department: 'CSO DIGILIVE CHAT - WA', status: 'Terverifikasi' },
  { id: 'ca6', date: '2026-10-14', userFullName: 'Sugeng Riyadi', score: 89.0, department: 'CSO DIGILIVE CHAT - WA', status: 'Terverifikasi' } // Avg: 91.00
];
state.saveCaLogs(sampleCaLogs);

// Initialize UI elements for CA
UI.filterCaMonth = getEl('filterCaMonth', 'select');
UI.filterCaUserSelect = getEl('filterCaUserSelect', 'select');
UI.filterCaService = getEl('filterCaService', 'select');
UI.filterCaGrade = getEl('filterCaGrade', 'select');
UI.filterCaSummarySort = getEl('filterCaSummarySort', 'select');
UI.filterCaScoreSort = getEl('filterCaScoreSort', 'select');
UI.searchCaInput = getEl('searchCaInput', 'input');
UI.caStatAvgScore = getEl('caStatAvgScore', 'h3');
UI.caStatAvgScoreLabel = getEl('caStatAvgScoreLabel', 'span');
UI.caStatAvgScoreSubtext = getEl('caStatAvgScoreSubtext', 'span');
UI.caStatTotalSamples = getEl('caStatTotalSamples', 'h3');
UI.caCardTopUser = getEl('caCardTopUser', 'div');
UI.caStatTopUser = getEl('caStatTopUser', 'h3');
UI.caStatTopUserSub = getEl('caStatTopUserSub', 'span');
UI.caCardCompliance = getEl('caCardCompliance', 'div');
UI.caStatCompliance = getEl('caStatCompliance', 'h3');
UI.caTableBody = getEl('caTableBody', 'tbody');
UI.caUserSummaryBody = getEl('caUserSummaryBody', 'tbody');

// 3. Render CA Page for Admin in 2026-10
state.currentUser = state.users[0]; // Admin Icon
UI.filterCaMonth.value = '2026-10';
UI.filterCaUserSelect.value = 'ALL';
UI.filterCaService.value = 'ALL';
UI.filterCaGrade.value = 'ALL';

global.window.renderCaPage();

// Verify User Skor Tertinggi for Admin
assert.strictEqual(UI.caStatTopUser.textContent, 'Rofi Andiyono',
  `Admin should see "Rofi Andiyono" as Top Performer, got: ${UI.caStatTopUser.textContent}`);
console.log('[PASS] Admin mode displays Top Performer: Rofi Andiyono');

assert(UI.caStatTopUserSub.textContent.includes('94,25'),
  `Subtext should contain average 94,25, got: ${UI.caStatTopUserSub.textContent}`);
console.log(`[PASS] Admin mode subtext displays: "${UI.caStatTopUserSub.textContent}"`);

assert(!UI.caCardTopUser.classList.contains('hidden'), 'caCardTopUser should be visible for Admin');
console.log('[PASS] caCardTopUser is visible for Admin.');

// 4. Render CA Page for Regular User (Sugeng Riyadi)
state.currentUser = state.users[3]; // Sugeng Riyadi
global.window.renderCaPage();

assert.strictEqual(UI.caStatTopUser.textContent, 'Rofi Andiyono',
  `Regular User should also see "Rofi Andiyono" as Top Performer, got: ${UI.caStatTopUser.textContent}`);
console.log('[PASS] Regular User mode displays Top Performer: Rofi Andiyono');

assert(!UI.caCardTopUser.classList.contains('hidden'), 'caCardTopUser should NOT be hidden for Regular User');
console.log('[PASS] caCardTopUser remains visible for Regular User.');

// Verify regular user's own average in card 1 (Sugeng: (93+89)/2 = 91.00)
assert.strictEqual(UI.caStatAvgScore.textContent, '91,00',
  `Sugeng's average should be 91,00, got: ${UI.caStatAvgScore.textContent}`);
console.log('[PASS] Sugeng Riyadi personal average score is correctly 91,00');

// 5. Test Empty Month Handling
state.currentUser = state.users[0]; // Admin
UI.filterCaMonth.value = '2026-09'; // 0 CA logs in September 2026
global.window.saveUserControl('filterCaMonth', '2026-09');
global.window.renderCaPage();

assert.strictEqual(UI.caStatTopUser.textContent, '-', 'Empty month must show "-"');
assert.strictEqual(UI.caStatTopUserSub.textContent, 'Belum ada penilaian bulan ini',
  'Empty month subtext must show "Belum ada penilaian bulan ini"');
console.log('[PASS] Empty month correctly displays "-" and empty subtext.');

// Switch back to 2026-10
UI.filterCaMonth.value = '2026-10';
global.window.saveUserControl('filterCaMonth', '2026-10');
global.window.renderCaPage();
assert.strictEqual(UI.caStatTopUser.textContent, 'Rofi Andiyono');
console.log('[PASS] Restored 2026-10 correctly re-renders Rofi Andiyono.');

// 6. Test handleSaveCa updating the Top Performer
// Simulate adding a higher score for Avina Ainun Zahra: 100 on 2026-10-20
UI.modalCaForm = getEl('modalCaForm', 'div');
UI.formCa = getEl('formCa', 'form');
UI.formCaId = getEl('formCaId', 'input');
UI.formCaDate = getEl('formCaDate', 'input');
UI.formCaUserSelect = getEl('formCaUserSelect', 'select');
UI.formCaDept = getEl('formCaDept', 'select');
UI.formCaChannel = getEl('formCaChannel', 'select');
UI.formCaScore = getEl('formCaScore', 'input');
UI.formCaFocusParam = getEl('formCaFocusParam', 'input');
UI.formCaNotes = getEl('formCaNotes', 'textarea');

UI.formCaId.value = '';
UI.formCaDate.value = '2026-10-20';
UI.formCaUserSelect.value = 'Avina Ainun Zahra';
UI.formCaDept.value = 'CSO DIGILIVE CHAT - WA';
UI.formCaChannel.value = 'Live Chat WA';
UI.formCaScore.value = '100'; // Now Avina has [96.6, 91.0, 100] -> Avg: 95.87 > 94.25!
UI.formCaFocusParam.value = 'Solutif';
UI.formCaNotes.value = 'Outstanding performance';

const mockEvt = { preventDefault: () => {} };
global.window.handleSaveCa(mockEvt);

// Check if Top Performer dynamically changed to Avina Ainun Zahra!
assert.strictEqual(UI.caStatTopUser.textContent, 'Avina Ainun Zahra',
  `Top Performer should now be "Avina Ainun Zahra", got: ${UI.caStatTopUser.textContent}`);
assert(UI.caStatTopUserSub.textContent.includes('95,87'),
  `Subtext should reflect new average 95,87, got: ${UI.caStatTopUserSub.textContent}`);
console.log('[PASS] Dynamic Top Performer update verified: Avina Ainun Zahra (95,87)');

console.log('\n========================================');
console.log('🎉 ALL CA USER SKOR TERTINGGI TESTS PASSED 100%!');
console.log('========================================');
