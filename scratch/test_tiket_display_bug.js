const fs = require('fs');
const path = require('path');

const apiKey = 'AIzaSyBcoOc0mBtgNpUkA5k6uAgrKvdxXbtwluU';
const BASE_URL = 'https://firestore.googleapis.com/v1/projects/dashboard-agent-adaro/databases/(default)/documents/drive_dashboard_data/';

function decodeValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in val) {
    const res = {};
    for (const k in val.mapValue.fields) res[k] = decodeValue(val.mapValue.fields[k]);
    return res;
  }
  return null;
}

async function testTiket() {
  const usersRes = await fetch(BASE_URL + 'vortex_users?key=' + apiKey);
  const usersJson = await usersRes.json();
  const users = decodeValue(usersJson.fields && usersJson.fields.payload) || [];

  const tiketRes = await fetch(BASE_URL + 'vortex_tikets?key=' + apiKey);
  const tiketJson = await tiketRes.json();
  const allTikets = decodeValue(tiketJson.fields && tiketJson.fields.payload) || [];

  console.log(`Fetched ${users.length} users and ${allTikets.length} tickets.`);

  // Test 1: What happens with default month = '2026-09'?
  console.log('\n--- Scenario 1: selectedMonth = 2026-09 ---');
  let selectedMonth = '2026-09';
  let monthLogs = (selectedMonth && selectedMonth !== 'ALL') ? allTikets.filter(l => (l.date || '').startsWith(selectedMonth)) : allTikets;
  console.log('monthLogs count for 2026-09:', monthLogs.length);

  // Test 2: What happens with selectedMonth = '2026-10'?
  console.log('\n--- Scenario 2: selectedMonth = 2026-10 ---');
  selectedMonth = '2026-10';
  monthLogs = (selectedMonth && selectedMonth !== 'ALL') ? allTikets.filter(l => (l.date || '').startsWith(selectedMonth)) : allTikets;
  console.log('monthLogs count for 2026-10:', monthLogs.length);

  // Now let's test Section 2 filtering with Admin:
  const currentUserAdmin = users.find(u => u.role === 'admin');
  const isAdmin = true;
  const currentFullName = currentUserAdmin.fullName;

  // Case A: default filters (ALL)
  let filterUser = 'ALL';
  let filterService = 'ALL';
  let filterGrade = 'ALL';
  let searchQ = '';

  let filteredLogs = monthLogs.filter(item => {
    if (!isAdmin) {
      const matchSelf = (item.userFullName === currentFullName) ||
                        (currentUserAdmin && item.userId === currentUserAdmin.id) ||
                        (currentUserAdmin && item.username === currentUserAdmin.username);
      if (!matchSelf) return false;
    }
    const tCount = Number(item.ticketCount) || 0;
    if (searchQ) {
      const match = (item.userFullName || '').toLowerCase().includes(searchQ) ||
                    (item.date || '').toLowerCase().includes(searchQ) ||
                    (item.department || '').toLowerCase().includes(searchQ) ||
                    (item.notes || '').toLowerCase().includes(searchQ) ||
                    String(tCount).includes(searchQ);
      if (!match) return false;
    }
    if (isAdmin && filterUser !== 'ALL' && item.userFullName !== filterUser) return false;
    if (filterService !== 'ALL' && item.department !== filterService) return false;
    if (filterGrade === 'Tercapai' && tCount < 60) return false;
    if (filterGrade === 'Di Bawah Target' && tCount >= 60) return false;
    return true;
  });
  console.log('Admin: filteredLogs count (filters=ALL):', filteredLogs.length);

  // Case B: Regular user logged in: Sugeng Riyadi
  const regularUser = users.find(u => u.username === 'sugeng.riyadi');
  console.log('\n--- Regular user (Sugeng Riyadi) ---');
  const userIsAdmin = false;
  const userFullName = regularUser.fullName;
  let userFilteredLogs = monthLogs.filter(item => {
    if (!userIsAdmin) {
      const matchSelf = (item.userFullName === userFullName) ||
                        (regularUser && item.userId === regularUser.id) ||
                        (regularUser && item.username === regularUser.username);
      if (!matchSelf) return false;
    }
    return true;
  });
  console.log('Sugeng Riyadi: filteredLogs count for 2026-10:', userFilteredLogs.length);

  // Case C: Regular user logged in: Admin Icon
  console.log('\n--- If Admin Icon logs in as regular user ---');
  let adminAsUserLogs = monthLogs.filter(item => {
    const matchSelf = (item.userFullName === currentFullName) ||
                      (currentUserAdmin && item.userId === currentUserAdmin.id) ||
                      (currentUserAdmin && item.username === currentUserAdmin.username);
    return matchSelf;
  });
  console.log('Admin Icon as user: tickets found:', adminAsUserLogs.length);
}

testTiket().catch(console.error);
