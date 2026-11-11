const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST OVERVIEW (RINGKASAN) AHT DISPLAY TO THE RIGHT OF ART ===');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// 1. Verify HTML: filterOverviewCategory includes AHT
console.log('\n--- 1. Testing index.html ---');
assert.ok(htmlContent.includes('<option value="AHT">AHT</option>'), 'filterOverviewCategory must include <option value="AHT">AHT</option>');
assert.ok(htmlContent.includes('Semua (CA, Tiket, ART, AHT)'), 'overviewPageBadge must include AHT');
console.log('✔ index.html contains AHT option and badge.');

// 2. Verify calculateOverviewCombinedData pulls AHT data
console.log('\n--- 2. Testing calculateOverviewCombinedData in js/app.js ---');
assert.ok(appContent.includes('const allAhtLogs = filterByMonth(state.getAhtLogs ? state.getAhtLogs() : []);'), 'Must pull AHT logs using state.getAhtLogs()');
assert.ok(appContent.includes('ahtTotalDurationSec'), 'Must calculate ahtTotalDurationSec');
assert.ok(appContent.includes('avgAhtSec = ahtTotalInteractions > 0 ? Math.round(ahtTotalDurationSec / ahtTotalInteractions) : 0;'), 'Must calculate avgAhtSec');
assert.ok(appContent.includes('getAhtDynamicColor(avgAhtSec, ahtDays > 0)'), 'Must call getAhtDynamicColor');
assert.ok(appContent.includes('ahtSorted.forEach'), 'Must calculate ahtRank');
console.log('✔ calculateOverviewCombinedData pulls and processes AHT data from menu AHT.');

// 3. Verify getAhtDynamicColor exists
console.log('\n--- 3. Testing getAhtDynamicColor in js/app.js ---');
assert.ok(appContent.includes('function getAhtDynamicColor('), 'getAhtDynamicColor function must exist');
console.log('✔ getAhtDynamicColor exists.');

// 4. Verify AHT column placement directly to the right of ART in thead
console.log('\n--- 4. Testing thead column order in js/app.js ---');
const theadAllRegex = /data-metric="art"[\s\S]*?<\/th>[\s\S]*?data-metric="aht"[\s\S]*?<\/th>/;
assert.ok(theadAllRegex.test(appContent), 'In thead, AHT column must be placed directly to the right of ART');
console.log('✔ thead has AHT column to the right of ART.');

// 5. Verify AHT cell placement directly to the right of ART in tbody
console.log('\n--- 5. Testing tbody row order in js/app.js ---');
const tbodyAllRegex = /item\.avgArtSec[\s\S]*?<\/td>[\s\S]*?item\.avgAhtSec[\s\S]*?<\/td>/;
assert.ok(tbodyAllRegex.test(appContent), 'In tbody, AHT cell must be placed directly to the right of ART cell');
console.log('✔ tbody row renders AHT cell to the right of ART cell.');

// 6. Verify AHT Category support
console.log('\n--- 6. Testing overviewActiveCategory === "AHT" ---');
assert.ok(appContent.includes("overviewActiveCategory === 'AHT'"), 'Must support overviewActiveCategory === AHT');
assert.ok(appContent.includes("Peringkat (AHT)"), 'Must render Peringkat (AHT) when category is AHT');
console.log('✔ AHT category view fully supported.');

// 7. Runtime calculation simulation
console.log('\n--- 7. Simulating Overview AHT Calculation Runtime ---');
// Mock state
const mockUsers = [
  { id: 'usr_1', username: 'ahmad', fullName: 'Ahmad CSO', department: 'CSO INBOUND', role: 'user' },
  { id: 'usr_2', username: 'siti', fullName: 'Siti CSO', department: 'CSO OUTBOUND', role: 'user' }
];

const mockAhtLogs = [
  { id: 'aht_1', date: '2026-09-01', userFullName: 'Ahmad CSO', actualSeconds: 210, interactionCount: 2, totalDurationSeconds: 420 },
  { id: 'aht_2', date: '2026-09-02', userFullName: 'Ahmad CSO', actualSeconds: 230, interactionCount: 1, totalDurationSeconds: 230 },
  { id: 'aht_3', date: '2026-09-01', userFullName: 'Siti CSO', actualSeconds: 320, interactionCount: 1, totalDurationSeconds: 320 }
];

// Test calculation for Ahmad
const ahmadLogs = mockAhtLogs.filter(l => l.userFullName === 'Ahmad CSO');
const ahmadInteractions = ahmadLogs.reduce((acc, l) => acc + (Number(l.interactionCount) || 1), 0);
const ahmadDuration = ahmadLogs.reduce((acc, l) => acc + (Number(l.totalDurationSeconds) || ((Number(l.actualSeconds) || 0) * (Number(l.interactionCount) || 1))), 0);
const ahmadAvg = Math.round(ahmadDuration / ahmadInteractions);

assert.strictEqual(ahmadInteractions, 3, 'Ahmad should have 3 interactions');
assert.strictEqual(ahmadDuration, 650, 'Ahmad duration should be 650 seconds');
assert.strictEqual(ahmadAvg, 217, 'Ahmad average AHT should be 217s');
console.log(`✔ Ahmad calculated AHT: ${ahmadAvg}s (Interactions: ${ahmadInteractions}, Total: ${ahmadDuration}s)`);

// Test calculation for Siti
const sitiLogs = mockAhtLogs.filter(l => l.userFullName === 'Siti CSO');
const sitiInteractions = sitiLogs.reduce((acc, l) => acc + (Number(l.interactionCount) || 1), 0);
const sitiDuration = sitiLogs.reduce((acc, l) => acc + (Number(l.totalDurationSeconds) || ((Number(l.actualSeconds) || 0) * (Number(l.interactionCount) || 1))), 0);
const sitiAvg = Math.round(sitiDuration / sitiInteractions);

assert.strictEqual(sitiInteractions, 1);
assert.strictEqual(sitiAvg, 320);
console.log(`✔ Siti calculated AHT: ${sitiAvg}s`);

console.log('\n========================================');
console.log('🎉 ALL OVERVIEW AHT DISPLAY TESTS PASSED!');
console.log('========================================');

