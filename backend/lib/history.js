// Broadcast history persisted to a JSON file so it survives server restarts.
// Fine for a single-instance desk app; move to a real database for multi-user production.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'history.json');
const MAX_ENTRIES = 200;

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(entries) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(entries, null, 2));
}

function all() {
  return load();
}

function add({ message, imageUrl, results }) {
  const entries = load();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    message,
    imageUrl: imageUrl || null,
    results,
  };
  entries.unshift(entry);
  save(entries.slice(0, MAX_ENTRIES));
  return entry;
}

module.exports = { all, add };
