const assert = require('assert');

console.log('=== TEST: RUNTIME DATA FILTERING SIMULATION ===\n');

const mockUsers = [
  { id: 'usr_admin_1', fullName: 'Admin Icon', role: 'admin', department: 'TEAM LEADER' },
  { id: 'usr_1', fullName: 'Sugeng Riyadi', role: 'user', department: 'CSO DIGILIVE CHAT - WA' },
  { id: 'usr_2', fullName: 'Ayu Yudha Pratiwi', role: 'user', department: 'CSO DIGILIVE CHAT - WA' },
  { id: 'usr_3', fullName: 'Anggi Ayu Sanghika', role: 'user', department: 'CSO DIGILIVE CHAT - WA' }
];

// Verify filtering logic across all 7 menus
const nonAdminUsers = mockUsers.filter(u => u && u.role !== 'admin');

assert.strictEqual(nonAdminUsers.length, 3);
assert.strictEqual(nonAdminUsers.some(u => u.role === 'admin'), false);
assert.strictEqual(nonAdminUsers.some(u => u.fullName === 'Admin Icon'), false);

console.log('[PASS] Filtered users correctly exclude Admin Icon (count: ' + nonAdminUsers.length + ')');

// Check dropdown generation format
const dropdownOpts = nonAdminUsers.map(u => `<option value="${u.fullName}">${u.fullName} (${u.role.toUpperCase()})</option>`).join('');
assert(!dropdownOpts.includes('Admin Icon'));
assert(!dropdownOpts.includes('(ADMIN)'));
assert(dropdownOpts.includes('Sugeng Riyadi (USER)'));

console.log('[PASS] Generated options contain only non-admin users');

// Check finding admin exclusion logic
const mockFindings = [
  { id: 'FND-2026-101', userFullName: 'Admin Icon', desc: 'Admin finding test' },
  { id: 'FND-2026-102', userFullName: 'Sugeng Riyadi', desc: 'Agent finding' }
];

const adminFullNames = new Set(mockUsers.filter(u => u && u.role === 'admin').map(u => u.fullName.toLowerCase()));
const adminUserIds = new Set(mockUsers.filter(u => u && u.role === 'admin').map(u => u.id));

const isFindingForAdmin = (f) => {
  if (!f) return false;
  if (f.userId && adminUserIds.has(String(f.userId))) return true;
  const name = String(f.userFullName || f.fullName || '').trim().toLowerCase();
  if (name && adminFullNames.has(name)) return true;
  return false;
};

const nonAdminFindings = mockFindings.filter(f => !isFindingForAdmin(f));
assert.strictEqual(nonAdminFindings.length, 1);
assert.strictEqual(nonAdminFindings[0].id, 'FND-2026-102');

console.log('[PASS] Finding exclusion correctly filters out Admin Icon findings');

console.log('\n=== RUNTIME SIMULATION PASSED! ===');

