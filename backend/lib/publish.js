// Per-platform publish implementations. Each returns a uniform result object:
//   { platform, ok, demo?, postId?, error? }
// Platforms connected in demo mode simulate a successful post so the full
// broadcast flow can be exercised before real API access is approved.

const axios = require('axios');

const GRAPH = 'https://graph.facebook.com/v19.0';

function demoResult(platform) {
  return {
    platform,
    ok: true,
    demo: true,
    postId: `demo_${platform}_${Date.now().toString(36)}`,
  };
}

function errorResult(platform, err) {
  const apiError = err.response?.data?.error?.message || err.response?.data?.error_description;
  return { platform, ok: false, error: apiError || err.message };
}

// Posting to a Page requires a PAGE access token, not the user token from login.
// List the user's pages once and cache the first one on the session.
async function getFacebookPage(session) {
  if (session.fbPage) return session.fbPage;
  const r = await axios.get(`${GRAPH}/me/accounts`, {
    params: { access_token: session.metaToken },
  });
  const page = r.data.data?.[0];
  if (!page) throw new Error('No Facebook Pages found on this account — posting requires a Page.');
  session.fbPage = { id: page.id, name: page.name, token: page.access_token };
  return session.fbPage;
}

async function postFacebook(session, { message }) {
  if (!session.metaToken) return { platform: 'facebook', ok: false, error: 'Facebook not connected' };
  if (session.metaDemo) return demoResult('facebook');
  try {
    const page = await getFacebookPage(session);
    const r = await axios.post(`${GRAPH}/${page.id}/feed`,
      { message },
      { params: { access_token: page.token } });
    return { platform: 'facebook', ok: true, postId: r.data.id, page: page.name };
  } catch (err) {
    console.error('Facebook post failed:', err.response?.data || err.message);
    return errorResult('facebook', err);
  }
}

// Instagram publishing is a two-step flow (create media container, then publish)
// and requires a Business/Creator IG account linked to a Facebook Page, plus an image.
// https://developers.facebook.com/docs/instagram-api/guides/content-publishing
async function postInstagram(session, { message, imageUrl }) {
  if (!session.metaToken) return { platform: 'instagram', ok: false, error: 'Instagram not connected' };
  if (session.metaDemo) return demoResult('instagram');
  if (!imageUrl) return { platform: 'instagram', ok: false, error: 'Instagram requires an image — add an image URL to this broadcast.' };
  try {
    const page = await getFacebookPage(session);
    const igRes = await axios.get(`${GRAPH}/${page.id}`, {
      params: { fields: 'instagram_business_account', access_token: page.token },
    });
    const igId = igRes.data.instagram_business_account?.id;
    if (!igId) return { platform: 'instagram', ok: false, error: 'No Instagram Business account linked to your Facebook Page.' };

    const container = await axios.post(`${GRAPH}/${igId}/media`, null, {
      params: { image_url: imageUrl, caption: message, access_token: page.token },
    });
    const publish = await axios.post(`${GRAPH}/${igId}/media_publish`, null, {
      params: { creation_id: container.data.id, access_token: page.token },
    });
    return { platform: 'instagram', ok: true, postId: publish.data.id };
  } catch (err) {
    console.error('Instagram post failed:', err.response?.data || err.message);
    return errorResult('instagram', err);
  }
}

// Google Business Profile "Local Posts". Account/location discovery uses the v1 APIs;
// localPosts creation still lives on the legacy v4 surface.
// Requires Business Profile API access approval on your Google Cloud project.
async function postGoogle(session, { message }) {
  if (!session.googleToken) return { platform: 'google', ok: false, error: 'Google not connected' };
  if (session.googleDemo) return demoResult('google');
  try {
    const headers = { Authorization: `Bearer ${session.googleToken}` };

    if (!session.googleLocation) {
      const accounts = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', { headers });
      const account = accounts.data.accounts?.[0];
      if (!account) return { platform: 'google', ok: false, error: 'No Google Business Profile accounts found.' };

      const locations = await axios.get(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
        { headers, params: { readMask: 'name,title' } });
      const location = locations.data.locations?.[0];
      if (!location) return { platform: 'google', ok: false, error: 'No business locations found on this account.' };
      session.googleLocation = { account: account.name, location: location.name, title: location.title };
    }

    const { account, location } = session.googleLocation;
    const r = await axios.post(
      `https://mybusiness.googleapis.com/v4/${account}/${location}/localPosts`,
      { languageCode: 'en', summary: message, topicType: 'STANDARD' },
      { headers });
    return { platform: 'google', ok: true, postId: r.data.name };
  } catch (err) {
    console.error('Google post failed:', err.response?.data || err.message);
    return errorResult('google', err);
  }
}

// TikTok's Content Posting API publishes video (and photo carousel) content only —
// there is no text-post endpoint. Real posting needs a video upload flow plus app review.
// https://developers.tiktok.com/doc/content-posting-api-get-started
async function postTiktok(session) {
  if (!session.tiktokToken) return { platform: 'tiktok', ok: false, error: 'TikTok not connected' };
  if (session.tiktokDemo) return demoResult('tiktok');
  return {
    platform: 'tiktok',
    ok: false,
    error: 'TikTok only accepts video/photo posts via its Content Posting API — text broadcasts are not supported. Video upload is not wired yet.',
  };
}

async function publish(platform, session, content) {
  switch (platform) {
    case 'facebook': return postFacebook(session, content);
    case 'instagram': return postInstagram(session, content);
    case 'google': return postGoogle(session, content);
    case 'tiktok': return postTiktok(session, content);
    default: return { platform, ok: false, error: `Unknown platform: ${platform}` };
  }
}

module.exports = { publish, getFacebookPage };
