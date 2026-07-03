const express = require('express');
const axios = require('axios');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Scopes below are the minimum needed to post to a Facebook Page and a linked Instagram
// Business account. Meta requires App Review + Business Verification before these scopes
// work for anyone other than accounts added as "testers" on your app.
const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
].join(',');

router.get('/', (req, res) => {
  const { META_APP_ID, META_REDIRECT_URI } = process.env;
  // No credentials configured yet → connect in demo mode so the app stays usable.
  if (!META_APP_ID) {
    req.session.metaToken = 'demo';
    req.session.metaDemo = true;
    return res.redirect(`${FRONTEND_URL}?connection=meta&status=connected&demo=1`);
  }
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code`;
  res.redirect(authUrl);
});

// Meta redirects back here with a one-time code. Exchange it for a real access token.
router.get('/callback', async (req, res) => {
  const { META_APP_ID, META_APP_SECRET, META_REDIRECT_URI } = process.env;
  const { code, error, error_description } = req.query;
  if (error) {
    return res.redirect(`${FRONTEND_URL}?connection=meta&status=error&reason=${encodeURIComponent(error_description || error)}`);
  }
  try {
    const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code,
      },
    });
    // Store the token server-side only. Never send this to the browser.
    req.session.metaToken = tokenRes.data.access_token;
    req.session.metaDemo = false;
    res.redirect(`${FRONTEND_URL}?connection=meta&status=connected`);
  } catch (err) {
    console.error('Meta token exchange failed:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}?connection=meta&status=error`);
  }
});

router.post('/disconnect', (req, res) => {
  delete req.session.metaToken;
  delete req.session.metaDemo;
  delete req.session.fbPage;
  res.json({ disconnected: true });
});

module.exports = router;
