const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=== TEST: AHT & ART CARDS EMPTY vs POPULATED MONTH FLOW ===\n');

let storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { storage = {}; }
};

class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = '';
    this._textContent = '';
    this._innerHTML = '';
    this.checked = false;
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
    this._listeners = {};
  }
  get textContent() {
    if (this._textContent) return this._textContent;
    return this._innerHTML.replace(/<[^>]+>/g, '').trim();
  }
  set textContent(val) {
    this._textContent = val;
    this._innerHTML = val;
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = val;
    this._textContent = '';
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
  querySelectorAll() { return []; }
  querySelector() { return null; }
  addEventListener(evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
  }
  click() {
    if (this._listeners['click']) {
      this._listeners['click'].forEach(fn => fn({ preventDefault: () => {} }));
    }
  }
  dispatchEvent(evt) {
    const fnList = this._listeners[evt.type] || [];
    fnList.forEach(fn => fn(evt));
  }
  scrollIntoView() {}
}

const elements = {};
function getEl(id, tag = 'div') {
  if (!elements[id]) {
    elements[id] = new MockElement(id, tag);
  }
  return elements[id];
}

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  RegExp,
  JSON,
  parseFloat,
  parseInt
};

sandbox.localStorage = mockLocalStorage;
sandbox.sessionStorage = mockLocalStorage;

sandbox.document = {
  getElementById: (id) => getEl(id),
  querySelector: (sel) => {
    const clean = sel.replace(/^[#.]/, '').split(' ')[0];
    return getEl(clean);
  },
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement('', tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  visibilityState: 'visible'
};

sandbox.window = sandbox;
sandbox.window.document = sandbox.document;
sandbox.window.addEventListener = () => {};
sandbox.window.removeEventListener = () => {};
sandbox.window.location = { reload: () => {} };
sandbox.window.navigator = { userAgent: 'node' };
sandbox.window.CustomEvent = class { constructor(type) { this.type = type; } };

sandbox.XLSX = {
  utils: {
    book_new: () => ({}),
    aoa_to_sheet: () => ({}),
    book_append_sheet: () => {}
  },
  writeFile: () => {}
};

const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const script = new vm.Script(appCode, { filename: 'app.js' });
const context = vm.createContext(sandbox);
script.runInContext(context);

const state = sandbox.state;
const UI = sandbox.UI;

if (!state || !UI) {
  console.error('FAIL: state or UI not initialized');
  process.exit(1);
}

// Setup test users
const adminUser = { id: 'u_admin', username: 'admin', fullName: 'Administrator', role: 'admin', department: 'MANAGEMENT' };
const regularUserWithData = { id: 'u_rofi', username: 'rofi', fullName: 'Rofi Andiyono', role: 'user', department: 'CSO DIGILIVE CHAT - WA' };
const regularUserNoData = { id: 'u_nobody', username: 'nobody', fullName: 'User Tanpa Data', role: 'user', department: 'CSO DIGILIVE CHAT - WA' };

state.saveUsers([adminUser, regularUserWithData, regularUserNoData]);

// Setup mock logs for 2026-10 only
const ahtOctLogs = [
  { id: 'aht_1', userFullName: 'Rofi Andiyono', date: '2026-10-05', actualSeconds: 180, interactionCount: 10, service: 'CSO', status: 'Compliant' },
  { id: 'aht_2', userFullName: 'Rofi Andiyono', date: '2026-10-06', actualSeconds: 200, interactionCount: 15, service: 'CSO', status: 'Compliant' }
];

const artOctLogs = [
  { id: 'art_1', userFullName: 'Rofi Andiyono', date: '2026-10-05', avgResponseSeconds: 12.5, frtSeconds: 6.0, interactionCount: 10, targetSeconds: 30, service: 'CSO', status: 'Sesuai SLA' },
  { id: 'art_2', userFullName: 'Rofi Andiyono', date: '2026-10-06', avgResponseSeconds: 14.0, frtSeconds: 7.0, interactionCount: 15, targetSeconds: 30, service: 'CSO', status: 'Sesuai SLA' }
];

state.saveAhtLogs(ahtOctLogs);
state.saveArtLogs(artOctLogs);

// Setup dropdown options on filter selects
const optOct = new MockElement('', 'option'); optOct.value = '2026-10';
const optSep = new MockElement('', 'option'); optSep.value = '2026-09';
UI.filterAhtMonth.options = [optOct, optSep];
UI.filterArtMonth.options = [optOct, optSep];

UI.filterSummaryAhtUser.value = 'ALL';
UI.filterSummaryAhtService.value = 'ALL';
UI.filterSummaryArtUser.value = 'ALL';
UI.filterSummaryArtService.value = 'ALL';
UI.filterAhtUserSelect.value = 'ALL';
UI.filterArtUserSelect.value = 'ALL';

sandbox.initEvents();

// --------------------------------------------------------------------------
// TEST 1: AHT Admin - Empty Month (2026-09)
// --------------------------------------------------------------------------
console.log('--- TEST 1: AHT Admin Mode - Empty Month (2026-09) ---');
state.currentUser = adminUser;
UI.filterAhtMonth.value = '2026-09';
sandbox.renderAhtPage();

assert.strictEqual(UI.ahtStatAvg.textContent.trim(), '-', 'AHT Card 1 must be "-" when empty');
assert.strictEqual(UI.ahtStatAvgSub.textContent.trim(), 'Belum ada data bulan ini', 'AHT Card 1 sub must say Belum ada data bulan ini');
assert.strictEqual(UI.ahtStatCompliance.textContent.trim(), '-', 'AHT Card 2 must be "-" when empty');
assert.strictEqual(UI.ahtStatComplianceSub.textContent.trim(), 'Belum ada data bulan ini', 'AHT Card 2 sub must say Belum ada data bulan ini');
assert.strictEqual(UI.ahtStatOver.textContent.trim(), '-', 'AHT Card 3 must be "-" when empty');
assert.strictEqual(UI.ahtStatOverSub.textContent.trim(), 'Belum ada data bulan ini', 'AHT Card 3 sub must say Belum ada data bulan ini');
assert.strictEqual(UI.ahtStatTopUser.textContent.trim(), '-', 'AHT Card 4 must be "-" when empty');
assert.strictEqual(UI.ahtStatTopUserSub.textContent.trim(), 'Belum ada data bulan ini', 'AHT Card 4 sub must say Belum ada data bulan ini');
console.log('[PASS] AHT Admin displays "-" on all 4 cards for empty month');

// --------------------------------------------------------------------------
// TEST 2: AHT Admin - Populated Month (2026-10)
// --------------------------------------------------------------------------
console.log('--- TEST 2: AHT Admin Mode - Populated Month (2026-10) ---');
UI.filterAhtMonth.value = '2026-10';
sandbox.renderAhtPage();

assert(UI.ahtStatAvg.textContent.includes('192'), 'AHT Card 1 shows calculated team average (192 Detik)');
assert(UI.ahtStatAvg.textContent.includes('Detik'), 'AHT Card 1 includes Detik unit');
assert(UI.ahtStatCompliance.textContent.includes('25'), 'AHT Card 2 shows total interactions 25 Sesi');
assert(UI.ahtStatOver.textContent.includes('Detik'), 'AHT Card 3 shows total duration in seconds');
assert.strictEqual(UI.ahtStatTopUser.textContent.trim(), 'Rofi Andiyono', 'AHT Card 4 shows Top user Rofi Andiyono');
console.log('[PASS] AHT Admin displays calculated metrics on all 4 cards for populated month');

// --------------------------------------------------------------------------
// TEST 3: AHT Regular User - Populated Month with Data vs without Data
// --------------------------------------------------------------------------
console.log('--- TEST 3: AHT User Mode - With Data vs Without Data ---');
state.currentUser = regularUserWithData;
UI.filterAhtMonth.value = '2026-10';
sandbox.renderAhtPage();

assert(UI.ahtStatAvg.textContent.includes('192'), 'User with data sees their average (192 Detik)');
assert(UI.ahtStatCompliance.textContent.includes('25'), 'User with data sees total interactions 25 Sesi');
assert(UI.ahtStatTopUser.textContent.includes('Sangat Efisien'), 'User with data sees efficiency badge');

state.currentUser = regularUserNoData;
sandbox.renderAhtPage();

assert.strictEqual(UI.ahtStatAvg.textContent.trim(), '-', 'User without data sees "-" on Card 1');
assert.strictEqual(UI.ahtStatAvgSub.textContent.trim(), 'Belum ada data bulan ini', 'User without data sees empty subtext');
assert.strictEqual(UI.ahtStatCompliance.textContent.trim(), '-', 'User without data sees "-" on Card 2');
assert.strictEqual(UI.ahtStatOver.textContent.trim(), '-', 'User without data sees "-" on Card 3');
assert.strictEqual(UI.ahtStatTopUser.textContent.trim(), '-', 'User without data sees "-" on Card 4');
assert.strictEqual(UI.ahtStatTopUserSub.textContent.trim(), 'Belum ada data bulan ini', 'User without data sees empty subtext on Card 4');
console.log('[PASS] AHT Regular User handles data and empty state correctly');

// --------------------------------------------------------------------------
// TEST 4: ART Admin - Empty Month (2026-09)
// --------------------------------------------------------------------------
console.log('--- TEST 4: ART Admin Mode - Empty Month (2026-09) ---');
state.currentUser = adminUser;
UI.filterArtMonth.value = '2026-09';
sandbox.renderArtPage();

assert.strictEqual(UI.artStatAvg.textContent.trim(), '-', 'ART Card 1 must be "-" when empty');
assert.strictEqual(UI.artStatAvgSub.textContent.trim(), 'Belum ada data bulan ini', 'ART Card 1 sub must say Belum ada data bulan ini');
assert.strictEqual(UI.artStatFrt.textContent.trim(), '-', 'ART Card 2 must be "-" when empty');
assert.strictEqual(UI.artStatFrtSub.textContent.trim(), 'Belum ada data bulan ini', 'ART Card 2 sub must say Belum ada data bulan ini');
assert.strictEqual(UI.artStatCompliance.textContent.trim(), '-', 'ART Card 3 must be "-" when empty');
assert.strictEqual(UI.artStatComplianceSub.textContent.trim(), 'Belum ada data bulan ini', 'ART Card 3 sub must say Belum ada data bulan ini');
assert.strictEqual(UI.artStatTopUser.textContent.trim(), '-', 'ART Card 4 must be "-" when empty');
assert.strictEqual(UI.artStatTopUserSub.textContent.trim(), 'Belum ada data bulan ini', 'ART Card 4 sub must say Belum ada data bulan ini');
console.log('[PASS] ART Admin displays "-" on all 4 cards for empty month');

// --------------------------------------------------------------------------
// TEST 5: ART Admin - Populated Month (2026-10)
// --------------------------------------------------------------------------
console.log('--- TEST 5: ART Admin Mode - Populated Month (2026-10) ---');
UI.filterArtMonth.value = '2026-10';
sandbox.renderArtPage();

assert(UI.artStatAvg.textContent.includes('13.4'), 'ART Card 1 shows calculated team average (13.4 Detik)');
assert(UI.artStatAvg.textContent.includes('Detik'), 'ART Card 1 includes Detik unit');
assert(UI.artStatFrt.textContent.includes('6.6'), 'ART Card 2 shows calculated FRT average');
assert.strictEqual(UI.artStatCompliance.textContent.trim(), '100.0%', 'ART Card 3 shows 100.0% compliance');
assert.strictEqual(UI.artStatTopUser.textContent.trim(), 'Rofi Andiyono', 'ART Card 4 shows Top user Rofi Andiyono');
console.log('[PASS] ART Admin displays calculated metrics on all 4 cards for populated month');

// --------------------------------------------------------------------------
// TEST 6: ART Regular User - Populated Month with Data vs without Data
// --------------------------------------------------------------------------
console.log('--- TEST 6: ART User Mode - With Data vs Without Data ---');
state.currentUser = regularUserWithData;
UI.filterArtMonth.value = '2026-10';
sandbox.renderArtPage();

assert(UI.artStatAvg.textContent.includes('13.4'), 'User with data sees their average (13.4 Detik)');
assert.strictEqual(UI.artStatCompliance.textContent.trim(), '100.0%', 'User with data sees compliance 100.0%');
assert(UI.artStatTopUser.textContent.includes('Sangat Responsif'), 'User with data sees status badge');

state.currentUser = regularUserNoData;
sandbox.renderArtPage();

assert.strictEqual(UI.artStatAvg.textContent.trim(), '-', 'User without data sees "-" on Card 1');
assert.strictEqual(UI.artStatAvgSub.textContent.trim(), 'Belum ada data bulan ini', 'User without data sees empty subtext');
assert.strictEqual(UI.artStatFrt.textContent.trim(), '-', 'User without data sees "-" on Card 2');
assert.strictEqual(UI.artStatCompliance.textContent.trim(), '-', 'User without data sees "-" on Card 3');
assert.strictEqual(UI.artStatTopUser.textContent.trim(), '-', 'User without data sees "-" on Card 4');
assert.strictEqual(UI.artStatTopUserSub.textContent.trim(), 'Belum ada data bulan ini', 'User without data sees empty subtext on Card 4');
console.log('[PASS] ART Regular User handles data and empty state correctly');

// --------------------------------------------------------------------------
// TEST 7: Reset Filter restores default to 2026-10
// --------------------------------------------------------------------------
console.log('--- TEST 7: Reset Filters ---');
state.currentUser = adminUser;
UI.filterAhtMonth.value = '2026-09';
UI.btnResetAhtFilters.click();
assert.strictEqual(UI.filterAhtMonth.value, '2026-10', 'AHT filter reset restores month to 2026-10');

UI.filterArtMonth.value = '2026-09';
UI.btnResetArtFilters.click();
assert.strictEqual(UI.filterArtMonth.value, '2026-10', 'ART filter reset restores month to 2026-10');
console.log('[PASS] Reset buttons restore filterAhtMonth and filterArtMonth to 2026-10');

console.log('\n========================================');
console.log('🎉 ALL AHT & ART CARDS EMPTY/POPULATED TESTS PASSED 100%!');
console.log('========================================');
