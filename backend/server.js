require('dotenv').config();

// Hosts like Render inject the service hostname without a protocol; normalize it
// here (before the route modules read it) so redirects and CORS get a full origin.
if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('http')) {
  process.env.FRONTEND_URL = `https://${process.env.FRONTEND_URL}`;
}

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const metaAuth = require('./routes/auth-meta');
const googleAuth = require('./routes/auth-google');
const tiktokAuth = require('./routes/auth-tiktok');
const postingRoutes = require('./routes/posting');
const { platformStatus } = require('./lib/platforms');

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Hosted platforms terminate HTTPS at their proxy; without this, secure session
// cookies are never set in production.
app.set('trust proxy', 1);

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // In production behind HTTPS, secure becomes true automatically
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use('/auth/meta', metaAuth);
app.use('/auth/google', googleAuth);
app.use('/auth/tiktok', tiktokAuth);
app.use('/api/posts', postingRoutes);

// Lets the frontend check which platforms are connected for the current session,
// whether each is running in demo mode, and whether real credentials are configured.
app.get('/api/connections', (req, res) => {
  res.json(platformStatus(req.session));
});

app.get('/health', (req, res) => res.json({ ok: true }));

// If the frontend has been built, serve it from this same server (production mode).
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/health')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Signal backend listening on http://localhost:${PORT}`);
  console.log('Platforms without credentials in .env run in DEMO mode (simulated connect + post).');
});
