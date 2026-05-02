import React, { useState } from 'react';
import { setOfficerToken, officerFetch } from './api';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', fontFamily: 'system-ui,sans-serif' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px' },
  badge: { display: 'inline-block', backgroundColor: '#28a745', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '20px', letterSpacing: 1 },
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '6px', color: '#212529' },
  sub: { color: '#6c757d', marginBottom: '28px', fontSize: '14px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#495057' },
  input: { width: '100%', padding: '11px 14px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '15px', marginBottom: '18px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '13px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  error: { color: '#dc3545', fontSize: '14px', marginBottom: '14px', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '6px', border: '1px solid #f5c6cb' },
};

export default function OfficerLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error: err } = await officerFetch('/officer/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (err) return setError(err);
    setOfficerToken(data.token);
    window.location.href = '/officer/booth';
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.badge}>POLLING OFFICER</div>
        <h2 style={s.title}>Officer Login</h2>
        <p style={s.sub}>Sign in to access your polling booth</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Email address</label>
          <input style={s.input} type="email" required
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" required
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button style={s.btn} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
