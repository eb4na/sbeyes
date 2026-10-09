const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
// A revision snapshot is kept at most this often per note while someone types.
const REVISION_INTERVAL_MS = 30 * 1000;

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'notes.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS writers (
    id         TEXT PRIMARY KEY,
    token      TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY,
    writer_id  TEXT NOT NULL REFERENCES writers(id),
    title      TEXT NOT NULL DEFAULT '',
    body       TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS revisions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id    TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    saved_at   INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notes_writer ON notes(writer_id);
  CREATE INDEX IF NOT EXISTS idx_revisions_note ON revisions(note_id, saved_at);
`);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const id = () => crypto.randomUUID();
const now = () => Date.now();

// ---- Writer auth: each browser gets a secret token, stored in localStorage ----

function requireWriter(req, res, next) {
  const token = req.get('x-writer-token');
  const writer = token && db.prepare('SELECT * FROM writers WHERE token = ?').get(token);
  if (!writer) return res.status(401).json({ error: 'Unknown writer' });
  req.writer = writer;
  next();
}

function requireAdmin(req, res, next) {
  const given = Buffer.from(req.get('x-admin-password') || '');
  const expected = Buffer.from(ADMIN_PASSWORD);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return res.status(401).json({ error: 'Wrong admin password' });
  }
  next();
}

function ownNote(req, res) {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND writer_id = ?')
    .get(req.params.id, req.writer.id);
  if (!note) res.status(404).json({ error: 'Note not found' });
  return note;
}

app.post('/api/writers', (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const writer = { id: id(), token: crypto.randomBytes(24).toString('hex'), name, created_at: now() };
  db.prepare('INSERT INTO writers (id, token, name, created_at) VALUES (?, ?, ?, ?)')
    .run(writer.id, writer.token, writer.name, writer.created_at);
  res.status(201).json(writer);
});

app.get('/api/me', requireWriter, (req, res) => {
  const { id, name } = req.writer;
  res.json({ id, name });
});

// ---- Writer notes ----

app.get('/api/notes', requireWriter, (req, res) => {
  res.json(db.prepare(
    'SELECT id, title, body, created_at, updated_at FROM notes WHERE writer_id = ? ORDER BY updated_at DESC'
  ).all(req.writer.id));
});

app.post('/api/notes', requireWriter, (req, res) => {
  const t = now();
  const note = { id: id(), title: '', body: '', created_at: t, updated_at: t };
  db.prepare('INSERT INTO notes (id, writer_id, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(note.id, req.writer.id, note.title, note.body, t, t);
  res.status(201).json(note);
});

// Autosave target. Updates the note and records a revision snapshot if the
// last one is older than REVISION_INTERVAL_MS, so history shows progress.
app.put('/api/notes/:id', requireWriter, (req, res) => {
  const note = ownNote(req, res);
  if (!note) return;
  const title = String(req.body.title ?? note.title).slice(0, 200);
  const body = String(req.body.body ?? note.body);
  const t = now();
  db.prepare('UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?')
    .run(title, body, t, note.id);

  const last = db.prepare('SELECT * FROM revisions WHERE note_id = ? ORDER BY saved_at DESC LIMIT 1').get(note.id);
  const changed = !last || last.title !== title || last.body !== body;
  if (changed && (!last || t - last.saved_at >= REVISION_INTERVAL_MS || req.body.checkpoint)) {
    db.prepare('INSERT INTO revisions (note_id, title, body, saved_at) VALUES (?, ?, ?, ?)')
      .run(note.id, title, body, t);
  }
  res.json({ id: note.id, title, body, updated_at: t });
});

app.delete('/api/notes/:id', requireWriter, (req, res) => {
  const note = ownNote(req, res);
  if (!note) return;
  db.prepare('DELETE FROM revisions WHERE note_id = ?').run(note.id);
  db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
  res.status(204).end();
});

// ---- Admin: see everything ----

app.get('/api/admin/notes', requireAdmin, (req, res) => {
  res.json(db.prepare(`
    SELECT n.id, n.title, n.body, n.created_at, n.updated_at,
           w.id AS writer_id, w.name AS writer_name,
           (SELECT COUNT(*) FROM revisions r WHERE r.note_id = n.id) AS revision_count
    FROM notes n JOIN writers w ON w.id = n.writer_id
    ORDER BY n.updated_at DESC
  `).all());
});

app.get('/api/admin/notes/:id/revisions', requireAdmin, (req, res) => {
  res.json(db.prepare(
    'SELECT id, title, body, saved_at FROM revisions WHERE note_id = ? ORDER BY saved_at DESC'
  ).all(req.params.id));
});

app.listen(PORT, () => {
  console.log(`Notes app on http://localhost:${PORT}  (admin: /admin)`);
  if (!process.env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD not set; using "changeme".');
});
