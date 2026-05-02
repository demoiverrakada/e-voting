import React, { useEffect, useState, useCallback } from 'react';
import { officerFetch, getBoothSession, setBoothSession, clearBoothSession } from './api';

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'system-ui,sans-serif' },
  header: { backgroundColor: '#28a745', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: '20px', fontWeight: 'bold', margin: 0 },
  headerSub: { fontSize: '13px', opacity: 0.85, marginTop: 4 },
  headerRight: { display: 'flex', gap: 12, alignItems: 'center' },
  deactivateBtn: { padding: '8px 18px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  body: { padding: '32px', maxWidth: '900px', margin: '0 auto' },
  activateCard: { backgroundColor: 'white', padding: '48px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '480px', margin: '80px auto' },
  activateTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#212529' },
  activateSub: { color: '#6c757d', marginBottom: '32px' },
  codeInput: { width: '100%', padding: '16px', border: '2px solid #ced4da', borderRadius: '8px', fontSize: '22px', fontWeight: 'bold', letterSpacing: '6px', textAlign: 'center', boxSizing: 'border-box', marginBottom: '20px', textTransform: 'uppercase' },
  activateBtn: { width: '100%', padding: '14px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  searchBar: { width: '100%', padding: '12px 16px', border: '1px solid #ced4da', borderRadius: '8px', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box' },
  statsRow: { display: 'flex', gap: 16, marginBottom: '24px' },
  statCard: (color) => ({ flex: 1, backgroundColor: color, borderRadius: '10px', padding: '16px', color: 'white', textAlign: 'center' }),
  statNum: { fontSize: '28px', fontWeight: 'bold' },
  statLabel: { fontSize: '12px', opacity: 0.9, marginTop: 4 },
  table: { width: '100%', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', borderCollapse: 'collapse' },
  th: { padding: '14px 20px', textAlign: 'left', backgroundColor: '#f8f9fa', fontSize: '13px', fontWeight: '700', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #dee2e6' },
  td: { padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontSize: '15px', color: '#212529' },
  statusBadge: (status) => ({
    padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
    backgroundColor: status === 'voted' ? '#d4edda' : status === 'token_issued' ? '#fff3cd' : '#e9ecef',
    color: status === 'voted' ? '#155724' : status === 'token_issued' ? '#856404' : '#6c757d',
  }),
  issueBtn: { padding: '7px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  issuedText: { color: '#28a745', fontWeight: 'bold', fontSize: '13px' },
  error: { color: '#dc3545', padding: '10px 16px', backgroundColor: '#fff5f5', borderRadius: '6px', marginBottom: '16px', border: '1px solid #f5c6cb' },
  tokenOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  tokenCard: { backgroundColor: 'white', padding: '48px', borderRadius: '16px', textAlign: 'center', maxWidth: '480px', width: '90%' },
  tokenTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#212529' },
  tokenVoter: { color: '#6c757d', marginBottom: '24px', fontSize: '14px' },
  tokenCode: { fontSize: '32px', fontWeight: '900', letterSpacing: '8px', color: '#007bff', backgroundColor: '#f0f7ff', padding: '24px', borderRadius: '10px', marginBottom: '24px', wordBreak: 'break-all' },
  tokenInstruction: { color: '#6c757d', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 },
  tokenDoneBtn: { padding: '12px 40px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
};

const getVoterStatus = (voter) => {
  if (voter.vote) return 'voted';
  if (voter.verified_at) return 'token_issued';
  return 'pending';
};

export default function OfficerBooth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [voters, setVoters] = useState([]);
  const [search, setSearch] = useState('');
  const [issuingFor, setIssuingFor] = useState(null);
  const [issuedToken, setIssuedToken] = useState(null);

  const loadSession = useCallback(async () => {
    const { data } = await officerFetch('/officer/booth/session');
    setSession(data);
    setLoading(false);
    if (data?.active && data.session_token) {
      setBoothSession(data.session_token);
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  const loadVoters = useCallback(async () => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const { data } = await officerFetch(`/officer/voters${query}`);
    if (data?.voters) setVoters(data.voters);
  }, [search]);

  useEffect(() => {
    if (session?.active) loadVoters();
  }, [session, loadVoters, search]);

  const handleActivate = async (e) => {
    e.preventDefault();
    setError(''); setActivating(true);
    const { data, error: err } = await officerFetch('/officer/booth/activate', {
      method: 'POST',
      body: JSON.stringify({ activation_code: activationCode.trim().toUpperCase() }),
    });
    setActivating(false);
    if (err) return setError(err);
    setBoothSession(data.session_token);
    await loadSession();
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate this booth? Voting will stop.')) return;
    await officerFetch('/officer/booth/deactivate', { method: 'POST' });
    clearBoothSession();
    setSession(null);
    setVoters([]);
    await loadSession();
  };

  const handleIssueToken = async (voter) => {
    setIssuingFor(voter.voter_id); setError('');
    const { data, error: err } = await officerFetch(`/officer/voters/${voter.voter_id}/verify`, { method: 'POST' });
    setIssuingFor(null);
    if (err) return setError(err);
    setIssuedToken({ token: data.token, voter: data.voter });
    await loadVoters();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('officer_token');
    sessionStorage.removeItem('booth_session_token');
    window.location.href = '/officer/login';
  };

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Loading...</div>;

  if (!session?.active) {
    return (
      <div style={s.page}>
        <div style={s.activateCard}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗳️</div>
          <h2 style={s.activateTitle}>Activate Your Booth</h2>
          <p style={s.activateSub}>Enter the activation code provided by your election administrator</p>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleActivate}>
            <input style={s.codeInput} value={activationCode} maxLength={12} placeholder="XXXXXXXXXXXX"
              onChange={e => setActivationCode(e.target.value.toUpperCase())} required />
            <button style={s.activateBtn} disabled={activating}>
              {activating ? 'Activating...' : 'Activate Booth'}
            </button>
          </form>
          <p style={{ marginTop: 20, fontSize: 13, color: '#adb5bd' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
              Sign out
            </button>
          </p>
        </div>
      </div>
    );
  }

  const totalVoters = voters.length;
  const voted = voters.filter(v => v.vote).length;
  const pending = voters.filter(v => !v.vote && !v.verified_at).length;
  const tokenIssued = voters.filter(v => !v.vote && v.verified_at).length;

  return (
    <div style={s.page}>
      {issuedToken && (
        <div style={s.tokenOverlay}>
          <div style={s.tokenCard}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎫</div>
            <p style={s.tokenTitle}>Voting Token Issued</p>
            <p style={s.tokenVoter}>For: <strong>{issuedToken.voter.voter_name}</strong> ({issuedToken.voter.voter_id})</p>
            <div style={s.tokenCode}>{issuedToken.token}</div>
            <p style={s.tokenInstruction}>
              Ask the voter to enter this token on the voting terminal.<br />
              <strong>This token will not be shown again.</strong>
            </p>
            <button style={s.tokenDoneBtn} onClick={() => setIssuedToken(null)}>Done — Next Voter</button>
          </div>
        </div>
      )}

      <div style={s.header}>
        <div>
          <p style={s.headerTitle}>🗳️ {session.booth?.name}</p>
          <p style={s.headerSub}>{session.election?.election_name} · {session.election?.status?.toUpperCase()}</p>
        </div>
        <div style={s.headerRight}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>Booth Active</span>
          <button style={s.deactivateBtn} onClick={handleDeactivate}>Deactivate Booth</button>
        </div>
      </div>

      <div style={s.body}>
        {error && <div style={s.error}>{error}</div>}

        <div style={s.statsRow}>
          <div style={s.statCard('#007bff')}><div style={s.statNum}>{totalVoters}</div><div style={s.statLabel}>Total Voters</div></div>
          <div style={s.statCard('#28a745')}><div style={s.statNum}>{voted}</div><div style={s.statLabel}>Voted</div></div>
          <div style={s.statCard('#ffc107')}><div style={s.statNum}>{tokenIssued}</div><div style={s.statLabel}>Token Issued</div></div>
          <div style={s.statCard('#6c757d')}><div style={s.statNum}>{pending}</div><div style={s.statLabel}>Pending</div></div>
        </div>

        <input style={s.searchBar} placeholder="Search by name or voter ID..."
          value={search} onChange={e => setSearch(e.target.value)} />

        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Voter ID</th>
              <th style={s.th}>Name</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {voters.length === 0 && (
              <tr><td colSpan={4} style={{ ...s.td, textAlign: 'center', color: '#adb5bd', padding: 32 }}>No voters found</td></tr>
            )}
            {voters.map(voter => {
              const status = getVoterStatus(voter);
              return (
                <tr key={voter.voter_id}>
                  <td style={s.td}><code>{voter.voter_id}</code></td>
                  <td style={s.td}>{voter.name}</td>
                  <td style={s.td}>
                    <span style={s.statusBadge(status)}>
                      {status === 'voted' ? '✓ Voted' : status === 'token_issued' ? '⏳ Token Issued' : '○ Pending'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {status === 'pending' && (
                      <button style={s.issueBtn} disabled={issuingFor === voter.voter_id}
                        onClick={() => handleIssueToken(voter)}>
                        {issuingFor === voter.voter_id ? 'Issuing...' : 'Verify & Issue Token'}
                      </button>
                    )}
                    {status === 'token_issued' && <span style={s.issuedText}>Token sent</span>}
                    {status === 'voted' && <span style={{ color: '#28a745', fontSize: 13 }}>✓ Complete</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
