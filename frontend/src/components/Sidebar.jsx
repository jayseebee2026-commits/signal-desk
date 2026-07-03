const NAV = [
  { id: 'compose', label: 'Compose', icon: '✏️' },
  { id: 'connections', label: 'Connections', icon: '🔗' },
  { id: 'history', label: 'History', icon: '🕘' },
];

export default function Sidebar({ page, onNavigate, connections }) {
  const connectedCount = connections
    ? Object.values(connections).filter((c) => c.connected).length
    : 0;

  return (
    <aside className="sidebar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="5" fill="currentColor" />
          <path d="M16 4a12 12 0 0 1 12 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M16 9a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".6" />
        </svg>
        <div>
          <div className="brand-name">Signal</div>
          <div className="brand-sub">Broadcast Desk</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.id === 'connections' && connections && (
              <span className="nav-badge">{connectedCount}/4</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className={`status-dot ${connections ? 'ok' : 'down'}`} />
        {connections ? 'Backend online' : 'Backend offline'}
      </div>
    </aside>
  );
}
