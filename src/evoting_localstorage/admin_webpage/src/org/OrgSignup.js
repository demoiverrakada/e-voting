import React, { useState } from 'react';
import { setOrgToken, orgFetch } from './api';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', fontFamily: 'system-ui,sans-serif' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' },
  logo: { fontSize: '24px', fontWeight: 'bold', color: '#007bff', marginBottom: '8px' },
  title: { fontSize: '22px', fontWeight: '700', marginBottom: '6px', color: '#212529' },
  sub: { color: '#6c757d', marginBottom: '28px', fontSize: '14px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#495057' },
  input: { width: '100%', padding: '11px 14px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '15px', marginBottom: '18px', boxSizing: 'border-box' },
  otpInput: { width: '100%', padding: '16px', border: '2px solid #007bff', borderRadius: '6px', fontSize: '28px', fontWeight: 'bold', letterSpacing: '16px', textAlign: 'center', marginBottom: '18px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '13px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '16px' },
  error: { color: '#dc3545', fontSize: '14px', marginBottom: '14px', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '6px', border: '1px solid #f5c6cb' },
  success: { color: '#28a745', fontSize: '14px', marginBottom: '14px', padding: '10px', backgroundColor: '#f0fff4', borderRadius: '6px', border: '1px solid #c3e6cb' },
  link: { textAlign: 'center', fontSize: '14px', color: '#6c757d' },
  resend: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', padding: 0 },
};

export default function OrgSignup() {
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error: err } = await orgFetch('/org/register', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (err) return setError(err);
    setInfo(data.message);
    setStep('verify');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error: err } = await orgFetch('/org/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: form.email, otp }),
    });
    setLoading(false);
    if (err) return setError(err);
    setOrgToken(data.token);
    window.location.href = '/org/dashboard';
  };

  const handleResend = async () => {
    setError(''); setInfo(''); setLoading(true);
    const { data, error: err } = await orgFetch('/org/register', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (err) return setError(err);
    setInfo('New OTP sent! Check your inbox.');
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>OpenVoting</div>

        {step === 'register' ? (
          <>
            <h2 style={s.title}>Create your account</h2>
            <p style={s.sub}>Free plan · No credit card required</p>
            {error && <div style={s.error}>{error}</div>}
            <form onSubmit={handleRegister}>
              <label style={s.label}>Organisation name</label>
              <input style={s.input} type="text" placeholder="IIT Delhi Student Council" required
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <label style={s.label}>Email address</label>
              <input style={s.input} type="email" placeholder="admin@yourorg.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" placeholder="Min. 8 characters" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <button style={s.btn} disabled={loading}>{loading ? 'Sending OTP...' : 'Continue →'}</button>
            </form>
            <p style={s.link}>Already have an account? <a href="/org/login" style={{ color: '#007bff' }}>Log in</a></p>
          </>
        ) : (
          <>
            <h2 style={s.title}>Check your inbox</h2>
            <p style={s.sub}>We sent a 6-digit code to <strong>{form.email}</strong></p>
            {error && <div style={s.error}>{error}</div>}
            {info && <div style={s.success}>{info}</div>}
            <form onSubmit={handleVerify}>
              <label style={s.label}>Verification code</label>
              <input style={s.otpInput} type="text" inputMode="numeric" maxLength={6}
                placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} />
              <button style={s.btn} disabled={loading || otp.length < 6}>
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </form>
            <p style={s.link}>
              Didn't receive it?{' '}
              <button style={s.resend} onClick={handleResend} disabled={loading}>Resend OTP</button>
              {' · '}
              <button style={s.resend} onClick={() => { setStep('register'); setError(''); setInfo(''); }}>Change email</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
