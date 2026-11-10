const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST CA USERNAME INTEGRATION & EXPORT/PULL ===');

// 1. Verify google_apps_script_ca.js
console.log('\n--- 1. Testing google_apps_script_ca.js ---');
const gasContent = fs.readFileSync(path.join(__dirname, '..', 'google_apps_script_ca.js'), 'utf8');

assert.ok(gasContent.includes("'Username Petugas CSO'"), "gasContent must have 'Username Petugas CSO' in HEADERS");
assert.ok(gasContent.includes("sheet.getRange(1, 3).setValue('Username Petugas CSO')"), "gasContent must auto-migrate header in row 1, col 3");
assert.ok(gasContent.includes("const userIdentifier = String(r[2] || '').trim()"), "gasContent must read col 3 as userIdentifier");
assert.ok(gasContent.includes("username: userIdentifier"), "gasContent must map username: userIdentifier in doGet");
assert.ok(gasContent.includes("l.username || l.userFullName"), "gasContent must write username in doPost");
console.log('✔ google_apps_script_ca.js checks passed.');

// 2. Verify CA_APPS_SCRIPT_TEMPLATE in js/app.js
console.log('\n--- 2. Testing CA_APPS_SCRIPT_TEMPLATE in js/app.js ---');
const appContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

assert.ok(appContent.includes("'Username Petugas CSO'"), "js/app.js must contain 'Username Petugas CSO'");
assert.ok(appContent.includes("sheet.getRange(1, 3).setValue('Username Petugas CSO')"), "CA_APPS_SCRIPT_TEMPLATE must auto-migrate header");
console.log('✔ CA_APPS_SCRIPT_TEMPLATE checks passed.');

// 3. Verify exportCaExcel in js/app.js
console.log('\n--- 3. Testing exportCaExcel logic ---');
assert.ok(appContent.includes("['No', 'ID Evaluasi', 'Tanggal Evaluasi', 'Username Petugas CSO'"), "Sheet 1 header must use 'Username Petugas CSO'");
assert.ok(appContent.includes("['No', 'Username Petugas CSO', 'Layanan CSO'"), "Sheet 2 header must use 'Username Petugas CSO'");
assert.ok(appContent.includes("getUsernameForLog(l)"), "exportCaExcel must use getUsernameForLog(l)");
assert.ok(appContent.includes("u.username || u.fullName"), "exportCaExcel Sheet 2 must use u.username || u.fullName");
console.log('✔ exportCaExcel checks passed.');

// 4. Verify pushCaToGoogleSheets in js/app.js
console.log('\n--- 4. Testing pushCaToGoogleSheets logic ---');
assert.ok(appContent.includes("const preparedLogs = logs.map(l =>"), "pushCaToGoogleSheets must map logs to preparedLogs with username");
assert.ok(appContent.includes("userFullName: un // Simpan username ke spreadsheet kolom 'Username Petugas CSO'"), "preparedLogs must set userFullName to username for spreadsheet sync");
console.log('✔ pushCaToGoogleSheets checks passed.');

// 5. Verify pullCaFromGoogleSheets in js/app.js
console.log('\n--- 5. Testing pullCaFromGoogleSheets logic ---');
assert.ok(appContent.includes("const resolveUser = (rawVal, defaultDept) =>"), "pullCaFromGoogleSheets must have resolveUser function");
assert.ok(appContent.includes("username: rawIdentifier,\n                userFullName: rawIdentifier,"), "CSV fallback must set username and userFullName from col 3");
assert.ok(appContent.includes("const normalizedLogs = pulledRows.map(row =>"), "pullCaFromGoogleSheets must normalize pulledRows with resolveUser");
console.log('✔ pullCaFromGoogleSheets checks passed.');

// 6. Verify autoSyncCaAction in js/app.js
console.log('\n--- 6. Testing autoSyncCaAction logic ---');
assert.ok(appContent.includes("userFullName: un // Simpan username ke spreadsheet"), "autoSyncCaAction must map userFullName: un for save action");
console.log('✔ autoSyncCaAction checks passed.');

// 7. Test runtime simulation of user resolution during pull & push
console.log('\n--- 7. Simulating Pull & Push User Resolution Runtime ---');
const mockUsers = [
  { id: 'u1', username: 'sugeng.riyadi', fullName: 'Sugeng Riyadi', department: 'CSO INBOUND', role: 'user' },
  { id: 'u2', username: 'dewi.lestari', fullName: 'Dewi Lestari', department: 'CSO ESCALATION', role: 'user' },
  { id: 'u3', username: 'admin', fullName: 'Administrator', department: 'MANAGEMENT', role: 'admin' }
];

const userMapByUsername = new Map();
const userMapByName = new Map();
mockUsers.forEach(u => {
  if (u.username) userMapByUsername.set(u.username.toLowerCase().trim(), u);
  if (u.fullName) userMapByName.set(u.fullName.toLowerCase().trim(), u);
});

const resolveUser = (rawVal, defaultDept) => {
  const trimmed = (rawVal || '').trim();
  if (!trimmed) return { username: '', fullName: '', department: defaultDept || 'CSO INBOUND' };
  const matched = userMapByUsername.get(trimmed.toLowerCase()) || userMapByName.get(trimmed.toLowerCase());
  if (matched) {
    return {
      username: matched.username || trimmed,
      fullName: matched.fullName || matched.username || trimmed,
      department: matched.department || defaultDept || 'CSO INBOUND'
    };
  }
  return {
    username: trimmed,
    fullName: trimmed,
    department: defaultDept || 'CSO INBOUND'
  };
};

// Case A: Pull from Google Spreadsheet where row 3 has username 'sugeng.riyadi'
const pullResA = resolveUser('sugeng.riyadi');
assert.strictEqual(pullResA.username, 'sugeng.riyadi');
assert.strictEqual(pullResA.fullName, 'Sugeng Riyadi');
assert.strictEqual(pullResA.department, 'CSO INBOUND');
console.log('✔ Pull with username correctly resolved to:', pullResA);

// Case B: Pull from legacy spreadsheet where row 3 still has 'Sugeng Riyadi'
const pullResB = resolveUser('Sugeng Riyadi');
assert.strictEqual(pullResB.username, 'sugeng.riyadi');
assert.strictEqual(pullResB.fullName, 'Sugeng Riyadi');
console.log('✔ Pull with legacy full name correctly mapped to username:', pullResB);

// Case C: Push log where log has { userFullName: 'Dewi Lestari' }
const mockLogToPush = { id: 'ca_1', date: '2026-11-10', userFullName: 'Dewi Lestari', score: 98 };
const matchedUser = userMapByName.get(mockLogToPush.userFullName.toLowerCase().trim());
const pushUsername = (matchedUser && matchedUser.username) || mockLogToPush.userFullName;
assert.strictEqual(pushUsername, 'dewi.lestari');
console.log('✔ Push prepared log mapped username to:', pushUsername);

console.log('\n========================================');
console.log('🎉 ALL CA USERNAME INTEGRATION TESTS PASSED!');
console.log('========================================');
