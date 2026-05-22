/* ============================================================
   VELVET PAWS — server.js
   Node.js + Express backend
   Routes:
     GET  /api/comments   — fetch all client comments
     POST /api/comments   — save a new comment
     POST /api/contact    — save a contact enquiry
   ============================================================ */

/* ============================================================
   VELVET PAWS — server.js
   Node.js + Express backend
   Routes:
     GET  /api/comments   — fetch all client comments
     POST /api/comments   — save a new comment
     POST /api/contact    — save a contact enquiry

   Vercel-compatible:
     - Exports `app` for serverless invocation
     - Uses /tmp for writable storage when deployed (Vercel fs is read-only)
     - Falls back to bundled data/comments.json as seed data
   ============================================================ */

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---------- Data file paths ----------
   On Vercel the project root is read-only; use /tmp for writes.
   Locally we keep writing to data/ as before.
*/
const IS_VERCEL     = !!process.env.VERCEL;
const WRITABLE_DIR  = IS_VERCEL ? '/tmp' : path.join(__dirname, 'data');
const SEED_DIR      = path.join(__dirname, 'data');   // bundled seed files

const COMMENTS_FILE = path.join(WRITABLE_DIR, 'vp_comments.json');
const CONTACTS_FILE = path.join(WRITABLE_DIR, 'vp_contacts.json');

/* Ensure writable dir exists (local only; /tmp always exists on Vercel) */
if (!IS_VERCEL && !fs.existsSync(WRITABLE_DIR)) fs.mkdirSync(WRITABLE_DIR, { recursive: true });

/* Seed comment store from bundled file if not yet initialised in /tmp */
if (!fs.existsSync(COMMENTS_FILE)) {
  const seed = path.join(SEED_DIR, 'comments.json');
  const initial = fs.existsSync(seed) ? fs.readFileSync(seed, 'utf-8') : '[]';
  fs.writeFileSync(COMMENTS_FILE, initial);
}
if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, '[]');
}

/* ---------- Middleware ---------- */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Serve static files (HTML, CSS, JS, images) */
app.use(express.static(path.join(__dirname)));

/* ============================================================
   HELPERS
   ============================================================ */
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/* ============================================================
   ROUTES — Comments
   ============================================================ */

/**
 * GET /api/comments
 * Returns all comments (most recent first)
 */
app.get('/api/comments', (req, res) => {
  const comments = readJSON(COMMENTS_FILE);
  res.json(comments.reverse()); // newest first
});

/**
 * POST /api/comments
 * Body: { name, pet, rating, comment, date }
 * Saves comment and returns 201
 */
app.post('/api/comments', (req, res) => {
  const { name, pet, rating, comment, date } = req.body;

  if (!name || !comment) {
    return res.status(400).json({ error: 'Name and comment are required.' });
  }

  const comments = readJSON(COMMENTS_FILE);
  const newComment = {
    id:      Date.now(),
    name:    String(name).trim().substring(0, 80),
    pet:     pet ? String(pet).trim().substring(0, 40) : '',
    rating:  Math.min(5, Math.max(1, parseInt(rating) || 5)),
    comment: String(comment).trim().substring(0, 500),
    date:    date || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  };

  comments.push(newComment);
  writeJSON(COMMENTS_FILE, comments);

  console.log(`[Comment] New from: ${newComment.name}`);
  res.status(201).json({ success: true, comment: newComment });
});

/* ============================================================
   ROUTES — Contact / Booking
   ============================================================ */

/**
 * POST /api/contact
 * Body: { name, email, phone, service, petName, message, date }
 * Saves enquiry and returns 201
 */
app.post('/api/contact', (req, res) => {
  const { name, email, phone, service, petName, message, date } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const contacts = readJSON(CONTACTS_FILE);
  const newContact = {
    id:        Date.now(),
    name:      String(name).trim().substring(0, 80),
    email:     String(email).trim().substring(0, 120),
    phone:     phone ? String(phone).trim().substring(0, 30) : '',
    service:   service || 'General Enquiry',
    petName:   petName ? String(petName).trim().substring(0, 80) : '',
    message:   String(message).trim().substring(0, 1000),
    date:      date || new Date().toISOString(),
    status:    'new'
  };

  contacts.push(newContact);
  writeJSON(CONTACTS_FILE, contacts);

  console.log(`[Contact] New enquiry from: ${newContact.name} <${newContact.email}>`);
  res.status(201).json({ success: true, message: 'Enquiry received. We\'ll be in touch shortly!' });
});

/* ============================================================
   CATCH-ALL — Serve index.html for any unmatched routes
   ============================================================ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ============================================================
   START SERVER (local dev only — Vercel invokes app directly)
   ============================================================ */
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  🐾  VELVET PAWS — Server Running');
    console.log('  ─────────────────────────────────────');
    console.log(`  🌐  http://localhost:${PORT}`);
    console.log(`  📋  Sitemap: http://localhost:${PORT}/sitemap.html`);
    console.log(`  📡  API: http://localhost:${PORT}/api/comments`);
    console.log('  ─────────────────────────────────────');
    console.log('  Press Ctrl+C to stop\n');
  });
}

/* Export for Vercel serverless */
module.exports = app;
