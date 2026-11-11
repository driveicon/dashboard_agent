const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST 1: Inspecting index.html ---');
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Check modal title
assert(htmlContent.includes('id="modalFindingTitle">Tambah Catatan<'), 'modalFindingTitle should be "Tambah Catatan" in index.html');

// Check formFindingType label has no asterisk and select is not required
const typeBlock = htmlContent.match(/<label for="formFindingType"[^>]*>([\s\S]*?)<\/label>\s*<select id="formFindingType"([^>]*)>([\s\S]*?)<\/select>/);
assert(typeBlock, 'formFindingType block not found in index.html');
const labelContent = typeBlock[1];
const selectAttrs = typeBlock[2];
const optionsContent = typeBlock[3];

assert(!labelContent.includes('*'), 'Label for Jenis must NOT contain *');
assert(!selectAttrs.includes('required'), 'select id="formFindingType" must NOT have required attribute');
assert(optionsContent.includes('value=""') && optionsContent.includes('Opsional'), 'Options must contain optional empty value');

// Check formFindingCategoryVal options
const expectedCategories = [
  'Quality',
  'PND',
  'Triwulan PND',
  'Activity AUX',
  'Activity Late Login',
  'Activity FART',
  'Activity',
  'Attitude'
];

const catBlock = htmlContent.match(/<select id="formFindingCategoryVal"[^>]*>([\s\S]*?)<\/select>/);
assert(catBlock, 'formFindingCategoryVal select not found');
expectedCategories.forEach(cat => {
  assert(catBlock[1].includes(`value="${cat}"`), `Category ${cat} must be in formFindingCategoryVal`);
});

console.log('✓ index.html structure verified successfully');

console.log('--- TEST 2: Inspecting js/app.js logic ---');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// Check openAddFindingModal
assert(appJs.includes("if (UI.modalFindingTitle) UI.modalFindingTitle.textContent = 'Tambah Catatan';"), 'openAddFindingModal should set title to Tambah Catatan');
assert(appJs.includes("if (UI.formFindingType) UI.formFindingType.value = '';"), 'openAddFindingModal should reset formFindingType to empty');
assert(appJs.includes("if (UI.formFindingCategoryVal) UI.formFindingCategoryVal.value = 'Quality';"), 'openAddFindingModal should set category to Quality');

// Check openEditFindingModal
assert(appJs.includes("if (UI.modalFindingTitle) UI.modalFindingTitle.textContent = 'Edit Catatan';"), 'openEditFindingModal should set title to Edit Catatan');

// Check handleSaveFinding
assert(appJs.includes("const findingType = (UI.formFindingType ? UI.formFindingType.value.trim() : '') || '-';"), 'handleSaveFinding should allow empty findingType as -');
assert(appJs.includes("const category = (UI.formFindingCategoryVal ? UI.formFindingCategoryVal.value : 'Quality');"), 'handleSaveFinding should default category to Quality');

// Check getFindings
assert(appJs.includes("findingType: (item.findingType !== undefined && item.findingType !== null && item.findingType !== '') ? item.findingType : '-'"), 'getFindings should not override empty or "-" findingType with Feedback Negatif');

console.log('✓ js/app.js logic verified successfully');

console.log('ALL TESTS PASSED!');
