import { useState } from 'react';
import { api } from '../api.js';
import { PLATFORMS, PLATFORM_ICONS } from '../platforms.jsx';

export default function Connections({ connections, refresh, showToast }) {
  const [busy, setBusy] = useState(null);

  const connect = (authKey) => {
    // Full-page navigation: the backend redirects to the platform's consent screen
    // (or straight back in demo mode when no credentials are configured).
    window.location.href = `/auth/${authKey}`;
  };

  const disconnect = async (authKey, name) => {
    setBusy(authKey);
    try {
      await api.disconnect(authKey);
      showToast(`${name} disconnected`, 'info');
      await refresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Connections</h1>
        <p>Link the accounts Signal broadcasts to. Platforms without API credentials run in demo mode.</p>
      </header>

      <div className="conn-grid">
        {PLATFORMS.map((p) => {
          const state = connections?.[p.id];
          const connected = state?.connected;
          const demo = state?.demo;
          const configured = state?.configured;
          return (
            <div key={p.id} className="card conn-card">
              <div className="conn-head">
                <span className="conn-icon" style={{ color: p.color }}>{PLATFORM_ICONS[p.id]}</span>
                <div>
                  <div className="conn-name">{p.name}</div>
                  <div className={`conn-status ${connected ? (demo ? 'demo' : 'live') : ''}`}>
                    {connected ? (demo ? 'Connected · demo mode' : 'Connected') : 'Not connected'}
                  </div>
                </div>
              </div>
              <p className="conn-note">{p.note}</p>
              {!configured && (
                <p className="conn-note dim">
                  No API credentials in <code>.env</code> — connecting simulates the account.
                </p>
              )}
              {connected ? (
                <button
                  className="btn-secondary"
                  disabled={busy === p.authKey}
                  onClick={() => disconnect(p.authKey, p.name)}
                >
                  {busy === p.authKey ? 'Disconnecting…' : 'Disconnect'}
                </button>
              ) : (
                <button className="btn-primary" onClick={() => connect(p.authKey)}>
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="card-title">Going live</h2>
        <p className="conn-note">
          To post to real accounts, register a developer app with each platform, put the
          credentials in <code>backend/.env</code>, and restart the backend — the same Connect
          buttons will then launch the real OAuth consent screens. See <code>backend/.env.example</code> and
          the project README for the per-platform steps (Meta and TikTok require app review;
          Google Business Profile API requires an access request).
        </p>
      </div>
    </div>
  );
}
