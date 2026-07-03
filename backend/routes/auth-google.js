const express = require('express');
const axios = require('axios');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Google Business Profile API access is invite/allowlist gated — you'll need to request
// access separately from the standard Cloud Console signup. See README for the link.
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
].join(' ');

router.get('/', (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID) {
    req.session.googleToken = 'demo';
    req.session.googleDemo = true;
    return res.redirect(`${FRONTEND_URL}?connection=google&status=connected&demo=1`);
  }
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&response_type=code&access_type=offline&prompt=consent` +
    `&scope=${encodeURIComponent(SCOPES)}`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  const { code, error } = req.query;
  if (error) {
    return res.redirect(`${FRONTEND_URL}?connection=google&status=error&reason=${encodeURIComponent(error)}`);
  }
  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code,
    });
    req.session.googleToken = tokenRes.data.access_token;
    req.session.googleRefreshToken = tokenRes.data.refresh_token;
    req.session.googleDemo = false;
    res.redirect(`${FRONTEND_URL}?connection=google&status=connected`);
  } catch (err) {
    console.error('Google token exchange failed:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}?connection=google&status=error`);
  }
});

router.post('/disconnect', (req, res) => {
  delete req.session.googleToken;
  delete req.session.googleRefreshToken;
  delete req.session.googleDemo;
  delete req.session.googleLocation;
  res.json({ disconnected: true });
});

module.exports = router;
