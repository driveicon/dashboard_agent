const assert = require('assert');

// Test the user merge logic
function testUserMerge() {
  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const isDefaultOrEmptyAvatar = (av) => {
    if (!av || typeof av !== 'string') return true;
    const trimmed = av.trim();
    return !trimmed || trimmed === DEFAULT_AVATAR || trimmed.includes('photo-1534528741775-53994a69daeb');
  };

  function mergeUsers(cleanLocal, cleanRemote) {
    const map = new Map();
    let hasLocalOverrides = false;

    // 1. Masukkan remote users yang valid
    cleanRemote.forEach(r => {
      if (r && (r.id || r.username)) {
        const keyId = r.id || (r.username && ('uname_' + r.username.toLowerCase()));
        map.set(keyId, { ...r });
      }
    });

    // 2. Rekonsiliasi dengan data lokal
    cleanLocal.forEach(l => {
      if (!l || (!l.id && !l.username)) return;
      const keyId = l.id || (l.username && ('uname_' + l.username.toLowerCase()));
      const remoteUser = map.get(keyId) || Array.from(map.values()).find(r => 
        (r.id && l.id && String(r.id) === String(l.id)) ||
        (r.username && l.username && r.username.toLowerCase() === l.username.toLowerCase())
      );

      if (!remoteUser) {
        // User baru yang dibuat di lokal
        map.set(l.id || keyId, { ...l });
        hasLocalOverrides = true;
      } else {
        const lTime = Number(l.updatedAt) || 0;
        const rTime = Number(remoteUser.updatedAt) || 0;

        const localHasCustomAvatar = l.avatar && !isDefaultOrEmptyAvatar(l.avatar);
        const remoteHasDefaultAvatar = isDefaultOrEmptyAvatar(remoteUser.avatar);

        if (lTime > rTime || (lTime === rTime && localHasCustomAvatar && remoteHasDefaultAvatar)) {
          // Versi lokal lebih baru atau memiliki avatar custom saat remote masih default
          map.set(remoteUser.id || keyId, { ...remoteUser, ...l });
          hasLocalOverrides = true;
        } else if (rTime > lTime) {
          const mergedUser = { ...l, ...remoteUser };
          // Lindungi avatar custom lokal jika remote tidak sengaja mengembalikan ke default
          if (localHasCustomAvatar && isDefaultOrEmptyAvatar(remoteUser.avatar)) {
            mergedUser.avatar = l.avatar;
            hasLocalOverrides = true;
          }
          map.set(remoteUser.id || keyId, mergedUser);
        } else {
          // Timestamp sama atau keduanya 0: Cek apakah ada perubahan avatar atau field lain
          const localAvatarChanged = l.avatar && l.avatar !== remoteUser.avatar;
          if (localAvatarChanged && (localHasCustomAvatar || !remoteHasDefaultAvatar)) {
            map.set(remoteUser.id || keyId, { ...remoteUser, ...l, avatar: l.avatar });
            hasLocalOverrides = true;
          } else if (JSON.stringify(l) !== JSON.stringify(remoteUser)) {
            map.set(remoteUser.id || keyId, { ...remoteUser, ...l });
            hasLocalOverrides = true;
          }
        }
      }
    });

    return { merged: Array.from(map.values()), hasLocalOverrides };
  }

  // Case 1: Remote has default avatar, local uploaded a custom avatar with newer updatedAt
  const local1 = [{ id: 'usr_1', username: 'john', avatar: 'data:image/jpeg;base64,abc12345', updatedAt: 1000 }];
  const remote1 = [{ id: 'usr_1', username: 'john', avatar: DEFAULT_AVATAR, updatedAt: 500 }];
  const res1 = mergeUsers(local1, remote1);
  assert.strictEqual(res1.merged[0].avatar, 'data:image/jpeg;base64,abc12345', 'Case 1: Local custom avatar preserved');
  assert.strictEqual(res1.hasLocalOverrides, true, 'Case 1: hasLocalOverrides is true');

  // Case 2: Remote has default avatar, local uploaded a custom avatar without updatedAt (e.g. 0)
  const local2 = [{ id: 'usr_1', username: 'john', avatar: 'data:image/jpeg;base64,abc12345' }];
  const remote2 = [{ id: 'usr_1', username: 'john', avatar: DEFAULT_AVATAR }];
  const res2 = mergeUsers(local2, remote2);
  assert.strictEqual(res2.merged[0].avatar, 'data:image/jpeg;base64,abc12345', 'Case 2: Local custom avatar preserved even without updatedAt');
  assert.strictEqual(res2.hasLocalOverrides, true, 'Case 2: hasLocalOverrides is true');

  // Case 3: Remote has older custom avatar, local updated to another custom avatar
  const local3 = [{ id: 'usr_1', username: 'john', avatar: 'https://example.com/avatar2.jpg', updatedAt: 2000 }];
  const remote3 = [{ id: 'usr_1', username: 'john', avatar: 'https://example.com/avatar1.jpg', updatedAt: 1000 }];
  const res3 = mergeUsers(local3, remote3);
  assert.strictEqual(res3.merged[0].avatar, 'https://example.com/avatar2.jpg', 'Case 3: Newer local avatar preserved');
  assert.strictEqual(res3.hasLocalOverrides, true, 'Case 3: hasLocalOverrides is true');

  // Case 4: Remote updated with newer timestamp, but remote avatar is default while local has custom avatar
  const local4 = [{ id: 'usr_1', username: 'john', avatar: 'data:image/jpeg;base64,custom', updatedAt: 1000, role: 'user' }];
  const remote4 = [{ id: 'usr_1', username: 'john', avatar: DEFAULT_AVATAR, updatedAt: 2000, role: 'admin' }];
  const res4 = mergeUsers(local4, remote4);
  assert.strictEqual(res4.merged[0].role, 'admin', 'Case 4: Remote role updated');
  assert.strictEqual(res4.merged[0].avatar, 'data:image/jpeg;base64,custom', 'Case 4: Custom avatar protected against revert to default');

  // Case 5: Local added brand new user
  const local5 = [
    { id: 'usr_1', username: 'john', avatar: DEFAULT_AVATAR },
    { id: 'usr_2', username: 'alice', avatar: 'https://example.com/alice.jpg' }
  ];
  const remote5 = [{ id: 'usr_1', username: 'john', avatar: DEFAULT_AVATAR }];
  const res5 = mergeUsers(local5, remote5);
  assert.strictEqual(res5.merged.length, 2, 'Case 5: Both users present');
  assert.strictEqual(res5.merged.find(u => u.id === 'usr_2').avatar, 'https://example.com/alice.jpg', 'Case 5: New user avatar intact');
  assert.strictEqual(res5.hasLocalOverrides, true, 'Case 5: hasLocalOverrides is true');

  console.log('✅ ALL AVATAR MERGE TESTS PASSED SUCCESSFULLY!');
}

testUserMerge();

