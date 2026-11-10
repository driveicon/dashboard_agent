const assert = require('assert');

// 1. Mock Browser Environment
const localStorageMock = {};
global.localStorage = {
  getItem: (k) => localStorageMock[k] || null,
  setItem: (k, v) => { localStorageMock[k] = String(v); },
  removeItem: (k) => { delete localStorageMock[k]; }
};

global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.window = {
  DRIVE_FIREBASE_CONFIG: {
    apiKey: "mock-key",
    projectId: "mock-project"
  }
};

global.document = {
  addEventListener: () => {},
  getElementById: (id) => null,
  querySelectorAll: () => []
};

// Load firebase-sync.js
require('../js/firebase-sync.js');
const fs = global.window.FirebaseSync;

console.log('Testing FirebaseSync.mergeCollections for vortex_users...');

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
const NEW_AVATAR = 'data:image/jpeg;base64,mockCompressedImageData';

// TEST 1: User on local has new avatar, remote has default avatar
{
  const localUsers = [
    { id: 'usr_admin_1', username: 'admin', fullName: 'Admin', avatar: NEW_AVATAR, updatedAt: 1700000010 }
  ];
  const remoteUsers = [
    { id: 'usr_admin_1', username: 'admin', fullName: 'Admin', avatar: DEFAULT_AVATAR, updatedAt: 1700000000 }
  ];
  const deletedIds = new Set();

  const { merged, hasLocalOverrides } = fs.mergeCollections('vortex_users', localUsers, remoteUsers, deletedIds);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].avatar, NEW_AVATAR, 'Local avatar should win over remote default');
  assert.strictEqual(hasLocalOverrides, true, 'hasLocalOverrides should be true so changes push back to cloud');
  console.log('✔ Test 1 Passed: Local custom avatar overrides remote default avatar');
}

// TEST 2: Remote snapshot arrives without updatedAt (legacy doc) but local has custom avatar
{
  const localUsers = [
    { id: 'usr_admin_1', username: 'admin', fullName: 'Admin', avatar: NEW_AVATAR }
  ];
  const remoteUsers = [
    { id: 'usr_admin_1', username: 'admin', fullName: 'Admin', avatar: DEFAULT_AVATAR }
  ];
  const deletedIds = new Set();

  const { merged, hasLocalOverrides } = fs.mergeCollections('vortex_users', localUsers, remoteUsers, deletedIds);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].avatar, NEW_AVATAR, 'Local custom avatar preserved even without timestamps');
  assert.strictEqual(hasLocalOverrides, true);
  console.log('✔ Test 2 Passed: Custom avatar preserved when timestamps are absent');
}

// TEST 3: Remote user updated another field with newer timestamp, but remote still has default avatar
{
  const localUsers = [
    { id: 'usr_admin_1', username: 'admin', fullName: 'Admin', avatar: NEW_AVATAR, updatedAt: 1000 }
  ];
  const remoteUsers = [
    { id: 'usr_admin_1', username: 'admin', fullName: 'Admin Updated', avatar: DEFAULT_AVATAR, updatedAt: 2000 }
  ];
  const deletedIds = new Set();

  const { merged, hasLocalOverrides } = fs.mergeCollections('vortex_users', localUsers, remoteUsers, deletedIds);
  assert.strictEqual(merged[0].fullName, 'Admin Updated', 'Remote fullName updated');
  assert.strictEqual(merged[0].avatar, NEW_AVATAR, 'Local custom avatar protected from reverting to default');
  console.log('✔ Test 3 Passed: Custom avatar safeguarded against remote default reversion even if remote timestamp is newer');
}

// TEST 4: Brand new user registered locally with custom avatar
{
  const localUsers = [
    { id: 'usr_admin_1', username: 'admin', avatar: DEFAULT_AVATAR },
    { id: 'usr_new_99', username: 'cso_jane', fullName: 'Jane Doe', avatar: NEW_AVATAR, updatedAt: 3000 }
  ];
  const remoteUsers = [
    { id: 'usr_admin_1', username: 'admin', avatar: DEFAULT_AVATAR }
  ];
  const deletedIds = new Set();

  const { merged, hasLocalOverrides } = fs.mergeCollections('vortex_users', localUsers, remoteUsers, deletedIds);
  assert.strictEqual(merged.length, 2);
  const jane = merged.find(u => u.id === 'usr_new_99');
  assert.ok(jane, 'New user should be in merged list');
  assert.strictEqual(jane.avatar, NEW_AVATAR, 'New user avatar preserved');
  assert.strictEqual(hasLocalOverrides, true);
  console.log('✔ Test 4 Passed: Newly registered user with custom avatar preserved');
}

// TEST 5: Verify immediate notifyDataChanged for vortex_users
{
  let immediateFlag = null;
  fs.notifyDataChanged = (key, data, isImmediate) => {
    immediateFlag = isImmediate;
  };

  const mockDashboard = {
    saveUsers(users) {}
  };
  fs.attachSaveHooks(mockDashboard);
  mockDashboard.saveUsers([{ id: 1, avatar: 'test' }]);
  assert.strictEqual(immediateFlag, true, 'vortex_users should sync immediately without debounce delay');
  console.log('✔ Test 5 Passed: vortex_users triggers immediate cloud push');
}

console.log('\n🎉 ALL AVATAR PERSISTENCE TESTS PASSED SUCCESSFULLY!');

