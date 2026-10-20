const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: VERIFY HIDDEN "USER PEROLEHAN TERBANYAK" & "SESI KERJA AGEN" ===\n');

const baseDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(baseDir, 'css', 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(baseDir, 'js', 'app.js'), 'utf8');

// 1. Verify tiketCardTopUser in index.html has class 'hidden'
assert(html.includes('id="tiketCardTopUser"'), 'tiketCardTopUser element must exist');
const tiketCardRegex = /<div[^>]*class="[^"]*metric-card[^"]*hidden[^"]*"[^>]*id="tiketCardTopUser"/;
assert(tiketCardRegex.test(html), 'tiketCardTopUser must have "hidden" class in index.html');
console.log('[PASS] index.html: tiketCardTopUser has "hidden" class.');

// 2. Verify clock-session-card in index.html has class 'hidden'
const clockSessionRegex = /<div[^>]*class="[^"]*clock-session-card[^"]*hidden[^"]*"/;
assert(clockSessionRegex.test(html), 'clock-session-card must have "hidden" class in index.html');
console.log('[PASS] index.html: clock-session-card has "hidden" class.');

// 3. Verify CSS rules in style.css
assert(css.includes('#tiketCardTopUser'), 'CSS must specify #tiketCardTopUser rule');
assert(css.includes('.clock-session-card'), 'CSS must specify .clock-session-card rule');
assert(/#tiketCardTopUser[\s\S]*?display:\s*none\s*!important/i.test(css), 'CSS must have display: none !important for #tiketCardTopUser');
assert(/\.clock-session-card[\s\S]*?display:\s*none\s*!important/i.test(css), 'CSS must have display: none !important for .clock-session-card');
console.log('[PASS] css/style.css: Display none !important rules verified for both targets.');

// 4. Verify JS enforcement in app.js
assert(js.includes('document.getElementById(\'tiketCardTopUser\')'), 'app.js should query tiketCardTopUser');
assert(js.includes('tiketCardTopUser.classList.add(\'hidden\')'), 'app.js should enforce hidden class on tiketCardTopUser');
console.log('[PASS] js/app.js: Dynamic hidden class enforcement verified.');

console.log('\n=== ALL ASSERTIONS PASSED (100%) ===');
