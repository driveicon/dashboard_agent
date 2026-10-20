const fs = require('fs');
const path = require('path');

// Mock localStorage & DOM
let storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { storage = {}; }
};
global.sessionStorage = global.localStorage;

class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList.classes.has(c)) this.classList.classes.delete(c);
          else this.classList.classes.add(c);
        } else if (force) {
          this.classList.classes.add(c);
        } else {
          this.classList.classes.delete(c);
        }
      }
    };
    this.children = [];
    this.style = {};
    this.options = [];
  }
  appendChild(c) { this.children.push(c); }
  querySelectorAll(sel) { return []; }
  querySelector(sel) { return null; }
  addEventListener() {}
  scrollIntoView() {}
}

const elements = {};
function getEl(id, tag = 'div') {
  if (!elements[id]) elements[id] = new MockElement(id, tag);
  return elements[id];
}

global.document = {
  getElementById: (id) => getEl(id),
  querySelector: (sel) => {
    const clean = sel.replace(/^[#.]/, '').split(' ')[0];
    return getEl(clean);
  },
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement('', tag)
};
global.window = {
  document: global.document,
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage
};

// Now load app.js
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// We can extract functions or run parts of it
console.log('Read app.js successfully. Length:', appCode.length);
