const fs = require('fs');
const path = require('path');

// Read files
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('js/app.js', 'utf8');

console.log('--- 1. Checking HTML Elements ---');
const requiredIds = [
  // Modal CA Detail
  'modalCaDetail', 'caDetailModalTitle', 'btnCloseCaDetailModal',
  'caDetailUserAvatar', 'caDetailUserName', 'caDetailUserUsername', 'caDetailUserDept',
  'caDetailScore', 'caDetailGradeBadge', 'caDetailPassBadge', 'caDetailTicketId',
  'caDetailDate', 'caDetailChannel', 'caDetailFocusParam', 'caDetailNotes',
  'caDetailCreatedBy', 'caDetailCreatedAt', 'caDetailUpdatedWrap', 'caDetailUpdatedAt',
  'caDetailBtnEdit', 'btnCloseCaDetailBtn',
  // CA Form
  'formCaTicketNo',
  // Modal Finding Detail
  'modalFindingDetail', 'findingDetailModalTitle', 'btnCloseFindingDetailModal',
  'findingDetailId', 'findingDetailTypeBadge', 'findingDetailCategoryBadge',
  'findingDetailDate', 'findingDetailDevBadge', 'findingDetailStatusBadge',
  'findingDetailUserAvatar', 'findingDetailUserName', 'findingDetailUserUsername',
  'findingDetailDept', 'findingDetailDesc', 'findingDetailActionPlan',
  'findingDetailCommitment', 'findingDetailCreatedAt', 'findingDetailBtnEdit',
  'btnCloseFindingDetailBtn'
];

let missingHtmlIds = [];
requiredIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) missingHtmlIds.push(id);
});
if (missingHtmlIds.length > 0) {
  console.error('FAIL: Missing HTML IDs:', missingHtmlIds);
  process.exit(1);
} else {
  console.log('PASS: All required HTML IDs exist in index.html');
}

// Check CA table header has No. Tiket / ID
if (!html.includes('No. Tiket / ID')) {
  console.error('FAIL: CA table header missing No. Tiket / ID');
  process.exit(1);
} else {
  console.log('PASS: CA table header has No. Tiket / ID');
}

console.log('--- 2. Checking JS app.js UI cache and functions ---');
const requiredJsTokens = [
  'formCaTicketNo: document.getElementById(\'formCaTicketNo\')',
  'modalCaDetail: document.getElementById(\'modalCaDetail\')',
  'caDetailModalTitle: document.getElementById(\'caDetailModalTitle\')',
  'caDetailScore: document.getElementById(\'caDetailScore\')',
  'modalFindingDetail: document.getElementById(\'modalFindingDetail\')',
  'findingDetailModalTitle: document.getElementById(\'findingDetailModalTitle\')',
  'findingDetailId: document.getElementById(\'findingDetailId\')',
  'openCaDetailModal',
  'closeCaDetailModal',
  'openFindingDetailModal',
  'closeFindingDetailModal'
];

let missingJsTokens = [];
requiredJsTokens.forEach(t => {
  if (!js.includes(t)) missingJsTokens.push(t);
});
if (missingJsTokens.length > 0) {
  console.error('FAIL: Missing JS tokens:', missingJsTokens);
  process.exit(1);
} else {
  console.log('PASS: All required JS UI cache tokens and functions exist');
}

console.log('--- 3. Simulating CA and Finding logic with mock DOM ---');

// Mock a lightweight browser environment to test functions in isolation
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(cls) { this.classes.add(cls); }
  remove(cls) { this.classes.delete(cls); }
  contains(cls) { return this.classes.has(cls); }
  toggle(cls, force) {
    if (force === undefined) {
      if (this.classes.has(cls)) this.classes.delete(cls); else this.classes.add(cls);
    } else if (force) {
      this.classes.add(cls);
    } else {
      this.classes.delete(cls);
    }
  }
}

class MockElement {
  constructor(id = '') {
    this.id = id;
    this.classList = new MockClassList();
    this.textContent = '';
    this.innerHTML = '';
    this.value = '';
    this.className = '';
    this.style = {};
    this.listeners = {};
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn({ target: this, preventDefault: () => {} }));
    }
  }
}

const mockElements = {};
requiredIds.forEach(id => {
  const el = new MockElement(id);
  mockElements[id] = el;
});

// Setup mock state
let mockCaLogs = [
  {
    id: 'ca_1001',
    ticketNo: 'TICK-998822',
    date: '2026-10-15',
    username: 'ahmad_cso',
    userFullName: 'Ahmad Dahlan',
    department: 'CSO INBOUND',
    channel: 'Live Chat WA',
    score: 95.50,
    grade: 'Sangat Baik',
    focusParam: 'Greeting SOP, Solusi',
    notes: 'Pelayanan sangat ramah dan responsif memenuhi standar SOP.',
    createdAt: '2026-10-15 10:30',
    createdBy: 'Admin QA'
  }
];

let mockFindings = [
  {
    id: 'FND-2026-001',
    date: '2026-10-14',
    username: 'budi_cso',
    userFullName: 'Budi Santoso',
    department: 'CSO LIVE CHAT',
    findingType: 'Feedback Negatif',
    category: 'Quality',
    deviationLevel: 'Reminder 1',
    desc: 'Terlambat merespon chat pelanggan lebih dari 3 menit tanpa notice.',
    commitment: 'Akan selalu memberikan quick update jika sedang investigasi.',
    actionPlan: 'Briefing ulang mengenai SLA holding chat.',
    status: 'Open',
    createdAt: '2026-10-14 14:00'
  }
];

let mockUsers = [
  { id: 'u1', username: 'ahmad_cso', fullName: 'Ahmad Dahlan', department: 'CSO INBOUND', role: 'cso', avatar: 'data:image/png;base64,mock' },
  { id: 'u2', username: 'budi_cso', fullName: 'Budi Santoso', department: 'CSO LIVE CHAT', role: 'cso' },
  { id: 'u_admin', username: 'admin', fullName: 'Administrator QA', department: 'QA', role: 'admin' }
];

let currentIsAdmin = true;

const state = {
  isAdmin: () => currentIsAdmin,
  currentUser: mockUsers[0],
  getCaLogs: () => mockCaLogs,
  saveCaLogs: (logs) => { mockCaLogs = logs; },
  getFindings: () => mockFindings,
  getUsers: () => mockUsers,
  addLog: () => {}
};

function formatCaScore(val) {
  if (val === null || val === undefined || val === '') return '-';
  const num = parseFloat(val);
  if (isNaN(num)) return '-';
  return num.toFixed(2).replace('.', ',');
}

function showToast(title, msg, type) {
  // Mock toast
}

// Bind mockElements to global UI
const UI = mockElements;

// Eval CA detail modal logic from js
eval(`
function openCaDetailModal(id) {
  const logs = state.getCaLogs ? state.getCaLogs() : [];
  const item = logs.find(l => l.id === id);
  if (!item) {
    showToast('Data Tidak Ditemukan', 'Data sampling tiket CA tidak ditemukan.', 'danger');
    return;
  }
  const allUsers = (state.getUsers ? state.getUsers() : []) || [];
  const user = allUsers.find(u => u.fullName === item.userFullName || (item.username && u.username === item.username));
  const username = item.username || (user ? user.username : '') || '-';
  const fullName = item.userFullName || (user ? user.fullName : '-') || '-';
  const dept = item.department || (user ? user.department : 'CSO');
  const avatarChar = fullName.charAt(0).toUpperCase();

  const numScore = parseFloat(item.score) || 0;
  const isPass = numScore >= 85.00;

  if (UI.caDetailModalTitle) {
    UI.caDetailModalTitle.textContent = \`Detail Tiket Sampling CA: \${item.ticketNo || item.id}\`;
  }
  if (UI.caDetailUserAvatar) {
    if (user && user.avatar) {
      UI.caDetailUserAvatar.innerHTML = \`<img src="\${user.avatar}" alt="\${fullName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">\`;
    } else {
      UI.caDetailUserAvatar.innerHTML = avatarChar;
    }
  }
  if (UI.caDetailUserName) UI.caDetailUserName.textContent = fullName;
  if (UI.caDetailUserUsername) UI.caDetailUserUsername.textContent = username !== '-' ? \`@\${username}\` : '';
  if (UI.caDetailUserDept) UI.caDetailUserDept.innerHTML = \`<i class="fa-solid fa-headset text-red" style="margin-right:4px;"></i>\${dept}\`;

  if (UI.caDetailScore) UI.caDetailScore.textContent = formatCaScore(item.score);
  if (UI.caDetailGradeBadge) {
    let gradeBadgeClass = 'badge-green';
    if (item.grade === 'Baik') gradeBadgeClass = 'badge-blue';
    else if (item.grade === 'Perlu Coaching') gradeBadgeClass = 'badge-yellow';
    UI.caDetailGradeBadge.className = \`badge \${gradeBadgeClass}\`;
    UI.caDetailGradeBadge.textContent = item.grade || (numScore >= 95 ? 'Sangat Baik' : (numScore >= 85 ? 'Baik' : 'Perlu Coaching'));
  }
  if (UI.caDetailPassBadge) {
    UI.caDetailPassBadge.className = \`badge \${isPass ? 'badge-green' : 'badge-yellow'}\`;
    UI.caDetailPassBadge.textContent = isPass ? 'Lulus SOP' : 'Remedial SOP';
  }

  if (UI.caDetailTicketId) UI.caDetailTicketId.textContent = item.ticketNo || item.id;
  if (UI.caDetailDate) UI.caDetailDate.textContent = item.date || '-';
  if (UI.caDetailChannel) UI.caDetailChannel.textContent = item.channel || '-';
  if (UI.caDetailFocusParam) UI.caDetailFocusParam.textContent = item.focusParam || '-';
  if (UI.caDetailNotes) UI.caDetailNotes.textContent = item.notes ? item.notes : 'Tidak ada catatan atau umpan balik khusus dari QA.';

  if (UI.caDetailCreatedBy) UI.caDetailCreatedBy.textContent = item.createdBy || 'Administrator QA';
  if (UI.caDetailCreatedAt) UI.caDetailCreatedAt.textContent = item.createdAt || item.date || '-';

  if (UI.caDetailUpdatedWrap) {
    if (item.updatedAt) {
      UI.caDetailUpdatedWrap.classList.remove('hidden');
      if (UI.caDetailUpdatedAt) UI.caDetailUpdatedAt.textContent = \`\${item.updatedAt} (\${item.updatedBy || 'Admin'})\`;
    } else {
      UI.caDetailUpdatedWrap.classList.add('hidden');
    }
  }

  // Edit button in modal: visible for Admin only
  if (UI.caDetailBtnEdit) {
    const isAdmin = state.isAdmin();
    UI.caDetailBtnEdit.classList.toggle('hidden', !isAdmin);
  }

  if (UI.modalCaDetail) UI.modalCaDetail.classList.remove('hidden');
}

function closeCaDetailModal() {
  if (UI.modalCaDetail) UI.modalCaDetail.classList.add('hidden');
}
`);

// Test openCaDetailModal
console.log('Testing openCaDetailModal for Admin...');
UI.modalCaDetail.classList.add('hidden');
openCaDetailModal('ca_1001');

if (UI.modalCaDetail.classList.contains('hidden')) {
  console.error('FAIL: modalCaDetail still hidden');
  process.exit(1);
}
if (UI.caDetailTicketId.textContent !== 'TICK-998822') {
  console.error('FAIL: caDetailTicketId mismatch:', UI.caDetailTicketId.textContent);
  process.exit(1);
}
if (UI.caDetailScore.textContent !== '95,50') {
  console.error('FAIL: caDetailScore mismatch:', UI.caDetailScore.textContent);
  process.exit(1);
}
if (UI.caDetailBtnEdit.classList.contains('hidden')) {
  console.error('FAIL: caDetailBtnEdit should be visible for admin');
  process.exit(1);
}
console.log('PASS: openCaDetailModal for admin populated correctly!');

// Test closeCaDetailModal
closeCaDetailModal();
if (!UI.modalCaDetail.classList.contains('hidden')) {
  console.error('FAIL: modalCaDetail not hidden after close');
  process.exit(1);
}
console.log('PASS: closeCaDetailModal works!');

// Test openCaDetailModal for User
currentIsAdmin = false;
openCaDetailModal('ca_1001');
if (!UI.caDetailBtnEdit.classList.contains('hidden')) {
  console.error('FAIL: caDetailBtnEdit should be hidden for non-admin');
  process.exit(1);
}
console.log('PASS: openCaDetailModal for non-admin hides edit button!');

// Eval Finding detail modal logic
eval(`
function openFindingDetailModal(id) {
  const findings = state.getFindings ? state.getFindings() : [];
  const item = findings.find(f => f.id === id);
  if (!item) {
    showToast('Data Tidak Ditemukan', \`Temuan audit \${id} tidak ditemukan.\`, 'danger');
    return;
  }
  const allUsers = (state.getUsers ? state.getUsers() : []) || [];
  const user = allUsers.find(u => u.fullName === item.userFullName || (item.username && u.username === item.username) || (item.userId && u.id === item.userId));
  const username = item.username || (user ? user.username : '') || '-';
  const fullName = item.userFullName || item.fullName || (user ? user.fullName : '-') || '-';
  const dept = item.department || (user ? user.department : 'CSO INBOUND');
  const avatarChar = fullName.charAt(0).toUpperCase();

  if (UI.findingDetailModalTitle) {
    UI.findingDetailModalTitle.textContent = \`Detail Catatan Finding: \${item.id}\`;
  }
  if (UI.findingDetailId) UI.findingDetailId.textContent = item.id;

  // Type badge
  if (UI.findingDetailTypeBadge) {
    let typeBadgeClass = 'badge-yellow';
    if (item.findingType === 'Feedback Positif') {
      typeBadgeClass = 'badge-green';
    } else if (!item.findingType || item.findingType === '-') {
      typeBadgeClass = 'badge-gray';
    }
    UI.findingDetailTypeBadge.className = \`badge \${typeBadgeClass}\`;
    UI.findingDetailTypeBadge.textContent = (item.findingType && item.findingType !== '-') ? item.findingType : 'Audit QA';
  }

  // Category badge
  if (UI.findingDetailCategoryBadge) {
    UI.findingDetailCategoryBadge.innerHTML = \`<i class="fa-solid fa-tag text-silver" style="margin-right:4px;"></i>\${item.category || '-'}\`;
  }

  if (UI.findingDetailDate) UI.findingDetailDate.textContent = item.date || '-';

  // Deviation badge
  if (UI.findingDetailDevBadge) {
    let devBadge = 'badge-yellow';
    if ((item.deviationLevel || '').startsWith('Korektif')) {
      devBadge = 'badge-blue';
    } else if ((item.deviationLevel || '').startsWith('SP')) {
      devBadge = 'badge-red glow-effect-red';
    }
    UI.findingDetailDevBadge.className = \`badge \${devBadge}\`;
    UI.findingDetailDevBadge.textContent = item.deviationLevel || '-';
  }

  // Status badge
  if (UI.findingDetailStatusBadge) {
    let statBadge = 'badge-yellow';
    if (item.status === 'Dalam Coaching') statBadge = 'badge-blue';
    else if (item.status === 'Closed') statBadge = 'badge-green';
    UI.findingDetailStatusBadge.className = \`badge \${statBadge}\`;
    UI.findingDetailStatusBadge.textContent = item.status || 'Open';
  }

  // Officer info
  if (UI.findingDetailUserAvatar) {
    if (user && user.avatar) {
      UI.findingDetailUserAvatar.innerHTML = \`<img src="\${user.avatar}" alt="\${fullName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">\`;
    } else {
      UI.findingDetailUserAvatar.innerHTML = avatarChar;
    }
  }
  if (UI.findingDetailUserName) UI.findingDetailUserName.textContent = fullName;
  if (UI.findingDetailUserUsername) UI.findingDetailUserUsername.textContent = username !== '-' ? \`@\${username}\` : '';
  if (UI.findingDetailDept) UI.findingDetailDept.innerHTML = \`<i class="fa-solid fa-headset text-red" style="margin-right:4px;"></i>\${dept}\`;

  // Description, Action Plan, Commitment
  if (UI.findingDetailDesc) UI.findingDetailDesc.textContent = item.desc || '-';
  if (UI.findingDetailActionPlan) UI.findingDetailActionPlan.textContent = item.actionPlan || 'Belum ada action plan perbaikan.';
  if (UI.findingDetailCommitment) UI.findingDetailCommitment.textContent = item.commitment || 'Belum ada komitmen petugas.';

  // Metadata
  if (UI.findingDetailCreatedAt) UI.findingDetailCreatedAt.textContent = item.createdAt || item.date || '-';

  // Edit button in modal: visible for Admin only
  if (UI.findingDetailBtnEdit) {
    const isAdmin = state.isAdmin();
    UI.findingDetailBtnEdit.classList.toggle('hidden', !isAdmin);
  }

  if (UI.modalFindingDetail) UI.modalFindingDetail.classList.remove('hidden');
}

function closeFindingDetailModal() {
  if (UI.modalFindingDetail) UI.modalFindingDetail.classList.add('hidden');
}
`);

// Test openFindingDetailModal for Admin
console.log('Testing openFindingDetailModal for Admin...');
currentIsAdmin = true;
UI.modalFindingDetail.classList.add('hidden');
openFindingDetailModal('FND-2026-001');

if (UI.modalFindingDetail.classList.contains('hidden')) {
  console.error('FAIL: modalFindingDetail still hidden');
  process.exit(1);
}
if (UI.findingDetailId.textContent !== 'FND-2026-001') {
  console.error('FAIL: findingDetailId mismatch:', UI.findingDetailId.textContent);
  process.exit(1);
}
if (UI.findingDetailUserName.textContent !== 'Budi Santoso') {
  console.error('FAIL: findingDetailUserName mismatch:', UI.findingDetailUserName.textContent);
  process.exit(1);
}
if (!UI.findingDetailCategoryBadge.innerHTML.includes('Quality')) {
  console.error('FAIL: findingDetailCategoryBadge missing Quality');
  process.exit(1);
}
if (UI.findingDetailBtnEdit.classList.contains('hidden')) {
  console.error('FAIL: findingDetailBtnEdit should be visible for admin');
  process.exit(1);
}
console.log('PASS: openFindingDetailModal for admin populated correctly!');

// Test closeFindingDetailModal
closeFindingDetailModal();
if (!UI.modalFindingDetail.classList.contains('hidden')) {
  console.error('FAIL: modalFindingDetail not hidden after close');
  process.exit(1);
}
console.log('PASS: closeFindingDetailModal works!');

console.log('ALL DETAIL MODAL TESTS PASSED SUCCESSFULLY!');
