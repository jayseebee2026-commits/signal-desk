import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PLATFORMS, PLATFORM_ICONS } from '../platforms.jsx';

export default function History() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.history().then(setEntries).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <h1>History</h1>
        <p>Every broadcast sent from this desk.</p>
      </header>

      {error && <div className="hint warn">{error}</div>}
      {entries && entries.length === 0 && (
        <div className="card empty">Nothing broadcast yet — your sent posts will show up here.</div>
      )}

      {entries?.map((entry) => (
        <div key={entry.id} className="card history-card">
          <div className="history-head">
            <time>{new Date(entry.createdAt).toLocaleString()}</time>
            <div className="history-badges">
              {entry.results.map((r) => {
                const meta = PLATFORMS.find((p) => p.id === r.platform);
                return (
                  <span
                    key={r.platform}
                    className={`badge ${r.ok ? 'ok' : 'fail'}`}
                    title={r.ok ? (r.demo ? 'Simulated (demo mode)' : `Posted — ${r.postId}`) : r.error}
                  >
                    <span className="chip-icon">{PLATFORM_ICONS[r.platform]}</span>
                    {meta?.name || r.platform}{r.demo ? ' · demo' : ''}{!r.ok && ' ✕'}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="history-message">{entry.message}</p>
          {entry.imageUrl && <div className="history-image">🖼 {entry.imageUrl}</div>}
        </div>
      ))}
    </div>
  );
}
