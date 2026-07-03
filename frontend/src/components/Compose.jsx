import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { PLATFORMS, PLATFORM_ICONS } from '../platforms.jsx';

export default function Compose({ connections, showToast, onNavigate }) {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const connectedIds = useMemo(
    () => PLATFORMS.filter((p) => connections?.[p.id]?.connected).map((p) => p.id),
    [connections]
  );

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Character budget is set by the strictest platform selected.
  const limit = useMemo(() => {
    const sel = PLATFORMS.filter((p) => selected.includes(p.id));
    return sel.length ? Math.min(...sel.map((p) => p.maxChars)) : null;
  }, [selected]);

  const overLimit = limit !== null && message.length > limit;
  const needsImage = selected.includes('instagram') && !imageUrl.trim()
    && !connections?.instagram?.demo;

  const canSend = message.trim() && selected.length > 0 && !overLimit && !sending && !needsImage;

  const broadcast = async () => {
    setSending(true);
    setResults(null);
    try {
      const entry = await api.broadcast(message.trim(), selected, imageUrl.trim());
      setResults(entry.results);
      const okCount = entry.results.filter((r) => r.ok).length;
      if (okCount === entry.results.length) {
        showToast(`Broadcast sent to ${okCount} platform${okCount > 1 ? 's' : ''}`, 'success');
        setMessage('');
        setImageUrl('');
      } else {
        showToast(`Broadcast finished: ${okCount}/${entry.results.length} succeeded`, okCount ? 'info' : 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Compose</h1>
        <p>Write once, broadcast everywhere.</p>
      </header>

      <div className="card">
        <textarea
          className="composer"
          placeholder="What do you want to announce?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
        />
        <div className="composer-meta">
          <span className={overLimit ? 'char-count over' : 'char-count'}>
            {message.length}{limit !== null && ` / ${limit.toLocaleString()}`}
          </span>
        </div>

        <input
          className="input"
          type="url"
          placeholder="Image URL (optional — required for Instagram)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div className="chips">
          {PLATFORMS.map((p) => {
            const connected = connectedIds.includes(p.id);
            const active = selected.includes(p.id);
            const demo = connections?.[p.id]?.demo;
            return (
              <button
                key={p.id}
                className={`chip ${active ? 'active' : ''}`}
                style={active ? { borderColor: p.color, color: p.color } : undefined}
                disabled={!connected}
                title={connected ? p.note : 'Not connected — go to Connections'}
                onClick={() => toggle(p.id)}
              >
                <span className="chip-icon">{PLATFORM_ICONS[p.id]}</span>
                {p.name}
                {demo && connected && <span className="mini-badge">demo</span>}
              </button>
            );
          })}
        </div>

        {connectedIds.length === 0 && connections && (
          <div className="hint">
            No platforms connected yet.{' '}
            <button className="link" onClick={() => onNavigate('connections')}>Connect one</button>{' '}
            to start broadcasting.
          </div>
        )}
        {needsImage && (
          <div className="hint warn">Instagram needs an image URL before you can broadcast to it.</div>
        )}

        <button className="btn-primary" disabled={!canSend} onClick={broadcast}>
          {sending ? 'Broadcasting…' : `Broadcast${selected.length ? ` to ${selected.length}` : ''}`}
        </button>
      </div>

      {results && (
        <div className="card">
          <h2 className="card-title">Results</h2>
          <ul className="result-list">
            {results.map((r) => {
              const meta = PLATFORMS.find((p) => p.id === r.platform);
              return (
                <li key={r.platform} className={`result ${r.ok ? 'ok' : 'fail'}`}>
                  <span className="chip-icon" style={{ color: meta?.color }}>{PLATFORM_ICONS[r.platform]}</span>
                  <strong>{meta?.name || r.platform}</strong>
                  {r.ok
                    ? <span>Posted{r.demo ? ' (simulated)' : ''} — id {r.postId}</span>
                    : <span className="err-text">{r.error}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
