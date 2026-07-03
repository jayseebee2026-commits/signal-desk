import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import Compose from './components/Compose.jsx';
import Connections from './components/Connections.jsx';
import History from './components/History.jsx';

export default function App() {
  const [page, setPage] = useState('compose');
  const [connections, setConnections] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, kind = 'info') => {
    setToast({ text, kind, key: Date.now() });
  }, []);

  const refreshConnections = useCallback(async () => {
    try {
      setConnections(await api.connections());
    } catch {
      setConnections(null);
      showToast('Backend unreachable — is the server running on port 3000?', 'error');
    }
  }, [showToast]);

  // On load: pick up OAuth redirect results (?connection=meta&status=connected) and clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connection = params.get('connection');
    if (connection) {
      const status = params.get('status');
      const demo = params.get('demo') === '1';
      const reason = params.get('reason');
      if (status === 'connected') {
        showToast(demo
          ? `${connection} connected in demo mode (no credentials configured yet)`
          : `${connection} connected`, 'success');
      } else {
        showToast(`${connection} connection failed${reason ? `: ${reason}` : ''}`, 'error');
      }
      setPage('connections');
      window.history.replaceState({}, '', window.location.pathname);
    }
    refreshConnections();
  }, [refreshConnections, showToast]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="app">
      <Sidebar page={page} onNavigate={setPage} connections={connections} />
      <main className="main">
        {page === 'compose' && (
          <Compose connections={connections} showToast={showToast} onNavigate={setPage} />
        )}
        {page === 'connections' && (
          <Connections connections={connections} refresh={refreshConnections} showToast={showToast} />
        )}
        {page === 'history' && <History />}
      </main>
      {toast && (
        <div key={toast.key} className={`toast toast-${toast.kind}`}>{toast.text}</div>
      )}
    </div>
  );
}
