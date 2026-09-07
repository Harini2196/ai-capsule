// Small fetch wrapper. Same-origin deployment, so relative URLs + credentials
// are all that's needed (the httpOnly "token" cookie rides along automatically).

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  me: () => request('/api/me'),
  listCapsules: () => request('/api/capsules'),
  createCapsule: (body) => request('/api/capsules', { method: 'POST', body: JSON.stringify(body) }),
  updateCapsule: (id, body) => request(`/api/capsules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: 'DELETE' }),
  logout: () => request('/logout', { method: 'POST' }),
};
