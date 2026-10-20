const fs = require('fs');
const path = require('path');
const vm = require('vm');

let storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { storage = {}; }
};
global.sessionStorage = global.localStorage;

class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.textContent = '';
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

const elements = {};
function getEl(id, tag = 'div') {
  if (!elements[id]) {
    elements[id] = new MockElement(id, tag);
  }
  return elements[id];
}

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
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { reload: () => {} },
  navigator: { userAgent: 'node' },
  CustomEvent: class {}
};

// Required libraries stubbed
global.XLSX = {
  utils: {
    book_new: () => ({}),
    aoa_to_sheet: () => ({}),
    book_append_sheet: () => {}
  },
  writeFile: () => {}
};

const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// Run code in context
const script = new vm.Script(appCode, { filename: 'app.js' });
const context = vm.createContext(global);
script.runInContext(context);

console.log('App code executed. Testing Tiket features:');

// Ensure state is initialized
const state = global.window.state;
const UI = global.window.UI;

if (!state || !UI) {
  console.error('FAIL: state or UI not initialized');
  process.exit(1);
}

// 1. Check MONTHLY_TICKET_TARGET
if (global.window.MONTHLY_TICKET_TARGET === 1320) {
  console.log('[PASS] MONTHLY_TICKET_TARGET is 1320');
} else {
  console.error('[FAIL] MONTHLY_TICKET_TARGET is not 1320:', global.window.MONTHLY_TICKET_TARGET);
  process.exit(1);
}

// 2. Setup mock users and tickets
state.users = [
  { id: 'usr_admin', username: 'admin', fullName: 'Administrator', role: 'admin' },
  { id: 'usr_sugeng', username: 'sugeng.riyadi', fullName: 'Sugeng Riyadi', role: 'user' },
  { id: 'usr_dika', username: 'andika.pratama', fullName: 'Andika Pratama', role: 'user' }
];
state.currentUser = state.users[0]; // Admin

const sampleTikets = [
  { id: 't1', date: '2026-10-01', userFullName: 'Sugeng Riyadi', userId: 'usr_sugeng', username: 'sugeng.riyadi', department: 'CSO DIGILIVE CHAT - WA', ticketCount: 75, notes: 'Day 1' },
  { id: 't2', date: '2026-10-02', userFullName: 'Sugeng Riyadi', userId: 'usr_sugeng', username: 'sugeng.riyadi', department: 'CSO DIGILIVE CHAT - WA', ticketCount: 65, notes: 'Day 2' },
  { id: 't3', date: '2026-10-01', userFullName: 'Andika Pratama', userId: 'usr_dika', username: 'andika.pratama', department: 'CSO DIGILIVE CHAT - WA', ticketCount: 50, notes: 'Day 1 Under target' },
  { id: 't4', date: '2026-09-30', userFullName: 'Sugeng Riyadi', userId: 'usr_sugeng', username: 'sugeng.riyadi', department: 'CSO DIGILIVE CHAT - WA', ticketCount: 80, notes: 'September ticket' }
];
state.saveTikets(sampleTikets);

// Initialize UI elements for tiket page
UI.filterTiketMonth = getEl('filterTiketMonth', 'select');
UI.filterTiketUserSelect = getEl('filterTiketUserSelect', 'select');
UI.filterTiketService = getEl('filterTiketService', 'select');
UI.filterTiketGrade = getEl('filterTiketGrade', 'select');
UI.searchTiket = getEl('searchTiket', 'input');
UI.filterTiketScoreSort = getEl('filterTiketScoreSort', 'select');
UI.tiketTableBody = getEl('tiketTableBody', 'tbody');
UI.tiketTotalCount = getEl('tiketTotalCount', 'div');
UI.tiketAvgCount = getEl('tiketAvgCount', 'div');
UI.tiketMaxCount = getEl('tiketMaxCount', 'div');
UI.tiketTopAgentName = getEl('tiketTopAgentName', 'div');
UI.tiketTableEmpty = getEl('tiketTableEmpty', 'div');
UI.tableTiketLogs = getEl('tableTiketLogs', 'table');
UI.tiketBatchToolbar = getEl('tiketBatchToolbar', 'div');
UI.tiketBatchCount = getEl('tiketBatchCount', 'span');
UI.selectAllTiket = getEl('selectAllTiket', 'input');
UI.tiketMonthBadge = getEl('tiketMonthBadge', 'span');
UI.tiketDailySubtitle = getEl('tiketDailySubtitle', 'span');

// 3. Render Tiket Page for Admin with default month 2026-10
UI.filterTiketMonth.value = '2026-10';
UI.filterTiketUserSelect.value = 'ALL';
UI.filterTiketService.value = 'ALL';
UI.filterTiketGrade.value = 'ALL';

global.window.renderTiketPage();

// Verify rows in 2026-10
// In 2026-10, sampleTikets has 3 tickets (t1, t2, t3). t4 is 2026-09.
const rowsInOct = UI.tiketTableBody.children;
if (rowsInOct.length === 3) {
  console.log('[PASS] renderTiketPage rendered 3 October tickets for Admin');
} else {
  console.error('[FAIL] Expected 3 rows for October, got:', rowsInOct.length);
  process.exit(1);
}

// Check content of row 0
const row0Html = rowsInOct[0].innerHTML;
if (row0Html.includes('Sugeng Riyadi') && row0Html.includes('promptEditTiket') && row0Html.includes('promptDeleteTiket')) {
  console.log('[PASS] Admin mode contains full edit and delete action buttons');
} else {
  console.error('[FAIL] Admin mode row missing buttons or content:', row0Html);
  process.exit(1);
}

// 4. Test User Mode (Regular User: Sugeng Riyadi)
state.currentUser = state.users[1]; // Sugeng Riyadi
global.window.renderTiketPage();

const rowsForSugeng = UI.tiketTableBody.children;
if (rowsForSugeng.length === 2) {
  console.log('[PASS] Regular user Sugeng only sees his 2 tickets in October');
} else {
  console.error('[FAIL] Expected 2 rows for Sugeng, got:', rowsForSugeng.length);
  process.exit(1);
}

const sugengRowHtml = rowsForSugeng[0].innerHTML;
if (sugengRowHtml.includes('Hanya Lihat') && !sugengRowHtml.includes('promptDeleteTiket')) {
  console.log('[PASS] Regular user sees "Hanya Lihat" badge instead of admin delete actions');
} else {
  console.error('[FAIL] Regular user should have "Hanya Lihat":', sugengRowHtml);
  process.exit(1);
}

// 5. Test Filter by Grade: 'Di Bawah Target' for Admin
state.currentUser = state.users[0]; // back to admin
UI.filterTiketGrade.value = 'Di Bawah Target';
global.window.renderTiketPage();

if (UI.tiketTableBody.children.length === 1 && UI.tiketTableBody.children[0].innerHTML.includes('Andika Pratama')) {
  console.log('[PASS] Filter Grade "Di Bawah Target" correctly filtered to 1 ticket (Andika Pratama)');
} else {
  console.error('[FAIL] Expected 1 under-target row, got:', UI.tiketTableBody.children.length);
  process.exit(1);
}
UI.filterTiketGrade.value = 'ALL';

// 6. Test handleSaveTiket flow & month auto-switch
// Set up modal elements
UI.modalTiketForm = getEl('modalTiketForm', 'div');
UI.formTiket = getEl('formTiket', 'form');
UI.formTiketId = getEl('formTiketId', 'input');
UI.formTiketDate = getEl('formTiketDate', 'input');
UI.formTiketUserSelect = getEl('formTiketUserSelect', 'select');
UI.formTiketDept = getEl('formTiketDept', 'select');
UI.formTiketCount = getEl('formTiketCount', 'input');
UI.formTiketNotes = getEl('formTiketNotes', 'textarea');
UI.modalTiketTitle = getEl('modalTiketTitle', 'h3');

// Simulate saving a new ticket for November 2026: 2026-11-05
UI.formTiketId.value = '';
UI.formTiketDate.value = '2026-11-05';
UI.formTiketUserSelect.value = 'Sugeng Riyadi';
UI.formTiketDept.value = 'CSO DIGILIVE CHAT - WA';
UI.formTiketCount.value = '95';
UI.formTiketNotes.value = 'Testing November Ticket';

// Call handleSaveTiket (mock event)
const mockEvt = { preventDefault: () => {} };
global.window.handleSaveTiket(mockEvt);

// Check if ticket was added
const allAfterSave = state.getTikets();
const newTicket = allAfterSave.find(t => t.date === '2026-11-05');
if (newTicket && newTicket.ticketCount === 95 && (newTicket.username === 'sugeng.riyadi' || newTicket.userId)) {
  console.log('[PASS] handleSaveTiket successfully created ticket with userId and count');
} else {
  console.error('[FAIL] Saved ticket not found or wrong data:', newTicket);
  process.exit(1);
}

// Check if filterTiketMonth was set to 2026-11
if (UI.filterTiketMonth.value === '2026-11') {
  console.log('[PASS] filterTiketMonth automatically switched to entry month 2026-11');
} else {
  console.error('[FAIL] filterTiketMonth is not 2026-11, got:', UI.filterTiketMonth.value);
  process.exit(1);
}

// Check saved user control
const savedControl = global.window.getUserControlValue('filterTiketMonth');
if (savedControl === '2026-11') {
  console.log('[PASS] saveUserControl correctly persisted 2026-11');
} else {
  console.error('[FAIL] saveUserControl for filterTiketMonth is:', savedControl);
  process.exit(1);
}

// Check if rendered table shows the new ticket immediately
const novRows = UI.tiketTableBody.children;
if (novRows.length === 1 && novRows[0].innerHTML.includes('Testing November Ticket')) {
  console.log('[PASS] Newly saved ticket immediately rendered in tableTiketLogs');
} else {
  console.error('[FAIL] Table did not immediately render November ticket:', novRows.length);
  process.exit(1);
}

console.log('\n========================================');
console.log('🎉 ALL COMPREHENSIVE TIKET TESTS PASSED 100%!');
console.log('========================================');
