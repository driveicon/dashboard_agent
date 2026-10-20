const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MockClassList {
  constructor() { this.set = new Set(); }
  add(c) { this.set.add(c); }
  remove(c) { this.set.delete(c); }
  toggle(c, f) {
    if (f !== undefined) { if (f) this.set.add(c); else this.set.delete(c); }
    else { if (this.set.has(c)) this.set.delete(c); else this.set.add(c); }
  }
  contains(c) { return this.set.has(c); }
}

class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this._innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.children = [];
    this.style = {};
    this.options = [];
    this.attributes = {};
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = val;
    this.children = [];
  }
  appendChild(child) { this.children.push(child); }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  querySelectorAll(sel) { return []; }
  querySelector(sel) { return null; }
  addEventListener() {}
  scrollIntoView() {}
  reset() {}
}

const elements = {};
function getEl(id, tag = 'div') {
  if (!elements[id]) elements[id] = new MockElement(id, tag);
  return elements[id];
}

const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  Set: Set,
  parseInt: parseInt,
  parseFloat: parseFloat,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  document: {
    getElementById: (id) => getEl(id),
    querySelector: (sel) => {
      const id = sel.replace(/^[#.]/, '').split(/[\s#.:]/)[0];
      return getEl(id);
    },
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement('', tag),
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  MONTHLY_TICKET_TARGET: 1320
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const code = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

vm.createContext(sandbox);
vm.runInContext(code, sandbox);
console.log('js/app.js initialized successfully.');

sandbox.state.currentUser = { id: 'admin_1', username: 'admin', fullName: 'Admin Icon', role: 'admin' };
sandbox.state.saveTikets([
  {
    id: "tkt_1",
    date: "2026-10-06",
    userFullName: "Sugeng Riyadi",
    department: "CSO DIGILIVE CHAT - WA",
    ticketCount: 283,
    notes: "Test 1"
  }
]);

console.log('Initial filterTiketMonth element value:', getEl('filterTiketMonth').value);
sandbox.renderTiketPage();
console.log('After renderTiketPage(), filterTiketMonth element value:', getEl('filterTiketMonth').value);

const tbody = getEl('tiketTableBody');
console.log('tbody children count:', tbody.children.length);
console.log('tbody child 0:\n', tbody.children[0].innerHTML);

console.log('\n--- Now setting filterTiketMonth to 2026-10 ---');
getEl('filterTiketMonth').value = '2026-10';
sandbox.saveUserControl('filterTiketMonth', '2026-10');
console.log('state.getTikets():', sandbox.state.getTikets());
getEl('filterTiketUserSelect').value = 'ALL';
getEl('filterTiketService').value = 'ALL';
getEl('filterTiketGrade').value = 'ALL';
sandbox.renderTiketPage();
console.log('After renderTiketPage(2026-10 with ALL):');
console.log('tbody children count:', tbody.children.length);
if (tbody.children.length > 0) {
  console.log('tbody child 0:\n', tbody.children[0].innerHTML);
}




