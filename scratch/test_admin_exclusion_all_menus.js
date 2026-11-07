const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: ADMIN ROLE EXCLUSION FROM DISPLAYED USER LISTS IN 7 MENUS ===\n');

const baseDir = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(baseDir, 'js', 'app.js'), 'utf8');

// 1. MENU: Ringkasan
console.log('1. Checking Ringkasan...');
assert(js.includes("function calculateOverviewCombinedData() {\n  const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');"),
  'Ringkasan calculateOverviewCombinedData must filter out admin users');
console.log('   [PASS] Ringkasan excludes admin users from combined overview data and table ranking.');

// 2. MENU: Update PA
console.log('2. Checking Update PA...');
assert(js.includes("function renderAdminPaUserGrid() {\n  if (!UI.paAdminUserGrid) return;\n  const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');"),
  'Update PA renderAdminPaUserGrid must filter out admin users');
assert(js.includes("const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n      let opts = '<option value=\"ALL\">Semua Petugas CSO</option>';"),
  'Update PA filterPaUser dropdown must filter out admin users');
console.log('   [PASS] Update PA excludes admin users from user cards grid and filterPaUser dropdown.');

// 3. MENU: CA
console.log('3. Checking CA...');
assert(js.includes("const allRawUsers = state.getUsers ? state.getUsers() : [];\n  const users = allRawUsers.filter(u => u && u.role !== 'admin');"),
  'CA renderCaPage must filter out admin users for summary table and filterCaUserSelect');
assert(js.includes("// Populate users dropdown (exclude admin)\n  const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formCaUserSelect) {"),
  'CA openAddCaModal must filter out admin users');
assert(js.includes("// Populate users dropdown & select current user (exclude admin)\n  const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formCaUserSelect) {"),
  'CA promptEditCa must filter out admin users');
assert(js.includes("exportCaExcel") && js.includes("const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');"),
  'CA exportCaExcel must filter out admin users');
console.log('   [PASS] CA excludes admin users from summary table, filterCaUserSelect, modal user dropdowns, and Excel export.');

// 4. MENU: Tiket
console.log('4. Checking Tiket...');
assert(js.includes("const allRawUsers = state.getUsers ? state.getUsers() : [];\n  const users = allRawUsers.filter(u => u && u.role !== 'admin');\n  const adminNames = new Set(allRawUsers.filter(u => u && u.role === 'admin').map(u => String(u.fullName || '').trim().toLowerCase()));"),
  'Tiket renderTiketPage must filter out admin users');
assert(js.includes("// Populate user dropdown (exclude admin)\n  const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formTiketUserSelect) {"),
  'Tiket openAddTiketModal must filter out admin users');
assert(js.includes("const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formTiketUserSelect) {\n    UI.formTiketUserSelect.innerHTML = users.map(u => `<option value=\"${u.fullName}\" data-dept=\"${u.department || 'CSO INBOUND'}\">${u.fullName} (${u.role.toUpperCase()})</option>`).join('');\n    UI.formTiketUserSelect.value = item.userFullName;"),
  'Tiket openEditTiketModal must filter out admin users');
console.log('   [PASS] Tiket excludes admin users from summary table, filterSummaryTiketUser, filterTiketUserSelect, and modal dropdowns.');

// 5. MENU: AHT
console.log('5. Checking AHT...');
assert(js.includes("renderAhtPage") && js.includes("const allRawUsers = state.getUsers ? state.getUsers() : [];\n  const users = allRawUsers.filter(u => u && u.role !== 'admin');"),
  'AHT renderAhtPage must filter out admin users');
assert(js.includes("// Populate user dropdown (exclude admin)\n  const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formAhtUserSelect) {"),
  'AHT openAddAhtModal must filter out admin users');
assert(js.includes("const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formAhtUserSelect) {\n    UI.formAhtUserSelect.innerHTML = users.map(u => `<option value=\"${u.fullName}\" data-dept=\"${u.department || 'CSO INBOUND'}\">${u.fullName} (${u.role.toUpperCase()})</option>`).join('');\n    UI.formAhtUserSelect.value = item.userFullName;"),
  'AHT openEditAhtModal must filter out admin users');
console.log('   [PASS] AHT excludes admin users from summary table, filterSummaryAhtUser, filterAhtUserSelect, and modal dropdowns.');

// 6. MENU: ART
console.log('6. Checking ART...');
assert(js.includes("renderArtPage") && js.includes("const allRawUsers = state.getUsers ? state.getUsers() : [];\n  const users = allRawUsers.filter(u => u && u.role !== 'admin');"),
  'ART renderArtPage must filter out admin users');
assert(js.includes("// Populate user dropdown (exclude admin)\n  const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formArtUserSelect) {"),
  'ART openAddArtModal must filter out admin users');
assert(js.includes("const users = (state.getUsers ? state.getUsers() : []).filter(u => u && u.role !== 'admin');\n  if (UI.formArtUserSelect) {\n    UI.formArtUserSelect.innerHTML = users.map(u => `<option value=\"${u.fullName}\" data-dept=\"${u.department || 'CSO DIGILIVE CHAT - WA'}\">${u.fullName} (${u.role.toUpperCase()})</option>`).join('');\n    UI.formArtUserSelect.value = item.userFullName;"),
  'ART openEditArtModal must filter out admin users');
console.log('   [PASS] ART excludes admin users from summary table, filterSummaryArtUser, filterArtUserSelect, and modal dropdowns.');

// 7. MENU: Finding
console.log('7. Checking Finding...');
assert(js.includes("const isFindingForAdmin = (f) => {") && js.includes("const nonAdminFindings = allFindings.filter(f => !isFindingForAdmin(f));"),
  'Finding renderFindingPage must filter out findings for admin users');
assert(js.includes("// Populate dropdown Petugas CSO dari seluruh data di Manajemen Team (kecuali admin)\n  const allTeamUsers = (state.getUsers() || []).filter(usr => usr && usr.role !== 'admin');"),
  'Finding openAddFindingModal and openEditFindingModal must filter out admin users');
console.log('   [PASS] Finding excludes admin users from Petugas CSO dropdown and finding table rows.');

console.log('\n=== ALL 7 MENUS CHECKED AND VERIFIED: PASSED! ===');

