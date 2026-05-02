export const API = process.env.REACT_APP_API_BASE_URL ?? '';
export const getOfficerToken   = () => sessionStorage.getItem('officer_token');
export const setOfficerToken   = (t) => sessionStorage.setItem('officer_token', t);
export const clearOfficerToken = () => sessionStorage.removeItem('officer_token');
export const getBoothSession   = () => sessionStorage.getItem('booth_session_token');
export const setBoothSession   = (t) => sessionStorage.setItem('booth_session_token', t);
export const clearBoothSession = () => sessionStorage.removeItem('booth_session_token');
export async function officerFetch(path, options = {}) {
  const token = getOfficerToken();
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
