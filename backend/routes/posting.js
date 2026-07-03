const express = require('express');
const router = express.Router();

const { publish, getFacebookPage } = require('../lib/publish');
const history = require('../lib/history');

const PLATFORMS = ['facebook', 'instagram', 'google', 'tiktok'];

// The Broadcast button calls this: one message fanned out to the selected platforms.
// Each platform reports its own success/failure so one failure doesn't hide the rest.
router.post('/broadcast', async (req, res) => {
  const { message, platforms = [], imageUrl } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }
  const targets = platforms.filter((p) => PLATFORMS.includes(p));
  if (targets.length === 0) {
    return res.status(400).json({ error: 'Select at least one platform to broadcast to.' });
  }

  const results = [];
  for (const platform of targets) {
    results.push(await publish(platform, req.session, { message: message.trim(), imageUrl }));
  }

  const entry = history.add({ message: message.trim(), imageUrl, results });
  res.json(entry);
});

router.get('/history', (req, res) => {
  res.json(history.all());
});

// Lists the Facebook Pages available to the connected account (real mode only) —
// useful for verifying page access before broadcasting.
router.get('/facebook/pages', async (req, res) => {
  if (!req.session.metaToken) return res.status(401).json({ error: 'Facebook not connected' });
  if (req.session.metaDemo) return res.json({ demo: true, pages: [{ id: 'demo-page', name: 'Demo Page' }] });
  try {
    const page = await getFacebookPage(req.session);
    res.json({ pages: [{ id: page.id, name: page.name }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single-platform routes kept for direct API use / curl testing.
for (const platform of PLATFORMS) {
  router.post(`/${platform}`, async (req, res) => {
    const { message, imageUrl } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' });
    const result = await publish(platform, req.session, { message: message.trim(), imageUrl });
    res.status(result.ok ? 200 : 500).json(result);
  });
}

module.exports = router;
