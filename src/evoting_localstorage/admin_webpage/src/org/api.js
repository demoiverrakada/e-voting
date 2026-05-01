export const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export function getOrgToken() {
  return sessionStorage.getItem('org_token');
}

export function setOrgToken(token) {
  sessionStorage.setItem('org_token', token);
}

export function clearOrgToken() {
  sessionStorage.removeItem('org_token');
}

export async function orgFetch(path, options = {}) {
  const token = getOrgToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) return { data: null, error: data.error || 'Request failed' };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
