// Central view of platform connection state for a session.
// A platform is "demo" when it was connected without real credentials configured —
// the whole app stays usable end-to-end (simulated posting) before API access is approved.

const DEMO_TOKEN = 'demo';

function metaConfigured() { return !!process.env.META_APP_ID; }
function googleConfigured() { return !!process.env.GOOGLE_CLIENT_ID; }
function tiktokConfigured() { return !!process.env.TIKTOK_CLIENT_KEY; }

function platformStatus(session) {
  return {
    facebook: {
      connected: !!session.metaToken,
      demo: session.metaDemo === true,
      configured: metaConfigured(),
    },
    instagram: {
      connected: !!session.metaToken,
      demo: session.metaDemo === true,
      configured: metaConfigured(),
    },
    google: {
      connected: !!session.googleToken,
      demo: session.googleDemo === true,
      configured: googleConfigured(),
    },
    tiktok: {
      connected: !!session.tiktokToken,
      demo: session.tiktokDemo === true,
      configured: tiktokConfigured(),
    },
  };
}

module.exports = { platformStatus, metaConfigured, googleConfigured, tiktokConfigured, DEMO_TOKEN };
