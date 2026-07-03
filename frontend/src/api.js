// Thin fetch wrapper. Same-origin (Vite proxies /api and /auth to the backend),
// so session cookies flow automatically.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  connections: () => request('/api/connections'),
  history: () => request('/api/posts/history'),
  broadcast: (message, platforms, imageUrl) =>
    request('/api/posts/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message, platforms, imageUrl: imageUrl || undefined }),
    }),
  disconnect: (authKey) => request(`/auth/${authKey}/disconnect`, { method: 'POST' }),
};
