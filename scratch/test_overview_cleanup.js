const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST OVERVIEW (RINGKASAN) CLEANUP OF LABELS AND KINERJA COLUMN ===');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// 1. Verify title in index.html & js/app.js
console.log('\n--- 1. Testing Page Title ---');
assert.ok(!htmlContent.includes('id="overviewPageTitle">Ringkasan Perolehan Kinerja User</h2>'), 'overviewPageTitle in index.html should not contain "Kinerja"');
assert.ok(htmlContent.includes('id="overviewPageTitle">Ringkasan Perolehan User</h2>'), 'overviewPageTitle in index.html should be "Ringkasan Perolehan User"');
assert.ok(!appContent.includes("titleEl.textContent = 'Ringkasan Perolehan Kinerja User'"), 'titleEl in app.js should not contain "Kinerja"');
console.log('✔ Title verified: "Ringkasan Perolehan User"');

// 2. Verify ALL view thead in js/app.js
console.log('\n--- 2. Testing thead in ALL view ---');
const allTheadMatch = appContent.match(/\/\/ ALL: Kombinasi CA, Tiket, ART, dan AHT[\s\S]*?thead\.innerHTML = `([\s\S]*?)`;/);
assert.ok(allTheadMatch, 'ALL view thead must be found');
const theadHtml = allTheadMatch[1];
assert.ok(!theadHtml.includes('>Kinerja<'), 'ALL view thead must NOT contain "Kinerja" column');
console.log('✔ thead in ALL view does not contain "Kinerja" column');

// 3. Verify ALL view tbody in js/app.js
console.log('\n--- 3. Testing tbody in ALL view ---');
const allTbodyMatch = appContent.match(/\/\/ ALL VIEW: Menampilkan metrik CA, Tiket, ART, dan AHT secara harmonis[\s\S]*?tr\.innerHTML = `([\s\S]*?)`;/);
assert.ok(allTbodyMatch, 'ALL view tbody must be found');
const tbodyHtml = allTbodyMatch[1];

assert.ok(!tbodyHtml.includes('caColor.passStatus'), 'CA cell must NOT contain caColor.passStatus badge');
assert.ok(!tbodyHtml.includes('artColor.grade'), 'ART cell must NOT contain artColor.grade badge');
assert.ok(!tbodyHtml.includes('ahtColor.grade'), 'AHT cell must NOT contain ahtColor.grade badge');
assert.ok(!tbodyHtml.includes('Prima'), 'tbody must NOT contain Kinerja "Prima" evaluation badge');
assert.ok(!tbodyHtml.includes('Evaluasi'), 'tbody must NOT contain Kinerja "Evaluasi" badge');
console.log('✔ Status label badges and Kinerja column successfully removed from ALL view row');

// 4. Verify getCaDynamicColor doesn't have (≥85.00)
console.log('\n--- 4. Testing getCaDynamicColor text ---');
const getCaFunc = appContent.match(/function getCaDynamicColor[\s\S]*?return \{ color, bgColor, borderColor/);
assert.ok(getCaFunc, 'getCaDynamicColor found');
assert.ok(!getCaFunc[0].includes('(≥85.00)'), 'getCaDynamicColor must not output "(≥85.00)"');
console.log('✔ getCaDynamicColor does not output "(≥85.00)"');

console.log('\n========================================');
console.log('🎉 ALL OVERVIEW CLEANUP TESTS PASSED!');
console.log('========================================');

