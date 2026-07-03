const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// TikTok requires app review before production posting scope is granted.
// https://developers.tiktok.com/doc/oauth-user-access-token-management
const SCOPES = 'user.info.basic,video.publish';

router.get('/', (req, res) => {
  const { TIKTOK_CLIENT_KEY, TIKTOK_REDIRECT_URI } = process.env;
  if (!TIKTOK_CLIENT_KEY) {
    req.session.tiktokToken = 'demo';
    req.session.tiktokDemo = true;
    return res.redirect(`${FRONTEND_URL}?connection=tiktok&status=connected&demo=1`);
  }
  const state = crypto.randomBytes(16).toString('hex');
  req.session.tiktokState = state;
  const authUrl = 'https://www.tiktok.com/v2/auth/authorize/' +
    `?client_key=${TIKTOK_CLIENT_KEY}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}` +
    `&state=${state}`;
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI } = process.env;
  const { code, error, error_description, state } = req.query;
  if (error) {
    return res.redirect(`${FRONTEND_URL}?connection=tiktok&status=error&reason=${encodeURIComponent(error_description || error)}`);
  }
  if (!state || state !== req.session.tiktokState) {
    return res.redirect(`${FRONTEND_URL}?connection=tiktok&status=error&reason=state_mismatch`);
  }
  try {
    const tokenRes = await axios.post(
      'https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (tokenRes.data.error) throw new Error(tokenRes.data.error_description || tokenRes.data.error);
    req.session.tiktokToken = tokenRes.data.access_token;
    req.session.tiktokRefreshToken = tokenRes.data.refresh_token;
    req.session.tiktokDemo = false;
    res.redirect(`${FRONTEND_URL}?connection=tiktok&status=connected`);
  } catch (err) {
    console.error('TikTok token exchange failed:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}?connection=tiktok&status=error`);
  }
});

router.post('/disconnect', (req, res) => {
  delete req.session.tiktokToken;
  delete req.session.tiktokRefreshToken;
  delete req.session.tiktokDemo;
  res.json({ disconnected: true });
});

module.exports = router;
