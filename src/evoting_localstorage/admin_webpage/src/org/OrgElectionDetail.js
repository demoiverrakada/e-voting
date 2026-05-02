import React, { useEffect, useState, useCallback } from 'react';
import { orgFetch } from './api';
import OrgLayout from './OrgLayout';

const styles = {
  tabBar: { display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #dee2e6', paddingBottom: '10px' },
  tab: (active) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: active ? '#007bff' : 'transparent',
    color: active ? 'white' : '#333',
    borderRadius: '4px',
    fontWeight: 'bold'
  }),
  section: { backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  formGroup: { marginBottom: '15px' },
  input: { display: 'block', width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' },
  btnPrimary: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  btnDanger: { padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #dee2e6' },
  td: { padding: '12px', borderBottom: '1px solid #f0f0f0' },
  actionBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: '15px 40px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusBadge: (status) => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: status === 'open' ? '#28a745' : status === 'closed' ? '#343a40' : '#6c757d'
  })
};

export default function OrgElectionDetail() {
  const election_id = window.location.pathname.split('/').pop();
  const [org, setOrg] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('candidates');
  
  // Booths & Officers
  const [booths, setBooths] = useState([]);
  const [newBoothName, setNewBoothName] = useState('');
  const [officers, setOfficers] = useState([]);
  const [newOfficer, setNewOfficer] = useState({ name: '', email: '', password: '' });

  // Forms
  const [candForm, setCandForm] = useState({ name: '', entry_number: '', cand_id: '' });
  const [voterCsv, setVoterCsv] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [orgRes, summaryRes] = await Promise.all([
      orgFetch('/org/me'),
      orgFetch(`/api/elections/${election_id}/summary`)
    ]);
    if (orgRes.data) setOrg(orgRes.data);
    if (summaryRes.data) setData(summaryRes.data);
    setLoading(false);
  }, [election_id]);

  const loadBooths = useCallback(async () => {
    const { data: bData } = await orgFetch(`/api/elections/${election_id}/booths`);
    if (bData) setBooths(bData.booths);
  }, [election_id]);

  const loadOfficers = useCallback(async () => {
    const { data: oData } = await orgFetch('/api/officers');
    if (oData) setOfficers(oData.officers);
  }, []);

  useEffect(() => { 
    loadData();
    if (activeTab === 'booths') {
      loadBooths();
      loadOfficers();
    }
  }, [loadData, activeTab, loadBooths, loadOfficers]);

  const addCandidate = async (e) => {
    e.preventDefault();
    const { error } = await orgFetch(`/api/elections/${election_id}/candidates`, {
      method: 'POST',
      body: JSON.stringify([candForm])
    });
    if (!error) {
      setCandForm({ name: '', entry_number: '', cand_id: '' });
      loadData();
    } else { alert(error); }
  };

  const deleteCandidate = async (cand_id) => {
    if (!window.confirm('Delete candidate?')) return;
    const { error } = await orgFetch(`/api/elections/${election_id}/candidates/${cand_id}`, {
      method: 'DELETE'
    });
    if (!error) loadData();
  };

  const uploadVoters = async (e) => {
    e.preventDefault();
    const voters = voterCsv.split('\n').filter(l => l.trim()).map(line => {
      const [name, voter_id, email] = line.split(',').map(s => s.trim());
      return { name, voter_id, email };
    });
    const { error } = await orgFetch(`/api/elections/${election_id}/voters`, {
      method: 'POST',
      body: JSON.stringify(voters)
    });
    if (!error) {
      setVoterCsv('');
      loadData();
      setActiveTab('voters');
    } else { alert(error); }
  };

  const createBooth = async (e) => {
    e.preventDefault();
    const { error } = await orgFetch(`/api/elections/${election_id}/booths`, {
      method: 'POST',
      body: JSON.stringify({ name: newBoothName })
    });
    if (!error) {
      setNewBoothName('');
      loadBooths();
    } else alert(error);
  };

  const deactivateBooth = async (booth_id) => {
    if (!window.confirm('Force deactivate booth?')) return;
    const { error } = await orgFetch(`/api/elections/${election_id}/booths/${booth_id}/deactivate`, {
      method: 'POST'
    });
    if (!error) loadBooths(); else alert(error);
  };

  const addOfficer = async (e) => {
    e.preventDefault();
    const { error } = await orgFetch('/api/officers', {
      method: 'POST',
      body: JSON.stringify(newOfficer)
    });
    if (!error) {
      setNewOfficer({ name: '', email: '', password: '' });
      loadOfficers();
    } else alert(error);
  };

  const deleteOfficer = async (id) => {
    if (!window.confirm('Delete officer?')) return;
    const { error } = await orgFetch(`/api/officers/${id}`, { method: 'DELETE' });
    if (!error) loadOfficers(); else alert(error);
  };

  const openElection = async () => {
    if (!window.confirm('Open election? This will enable voting.')) return;
    setActionLoading(true);
    const { error } = await orgFetch(`/api/elections/${election_id}/open`, { method: 'POST' });
    setActionLoading(false);
    if (!error) loadData(); else alert(error);
  };

  const closeElection = async () => {
    if (!window.confirm('Are you sure you want to close this election? This cannot be undone.')) return;
    setActionLoading(true);
    const { error } = await orgFetch(`/api/elections/${election_id}/close`, { method: 'POST' });
    setActionLoading(false);
    if (!error) loadData(); else alert(error);
  };

  if (loading) return <div style={{ padding: 40 }}>Loading election details...</div>;
  if (!data) return <div style={{ padding: 40 }}>Election not found.</div>;

  const { election, candidates, turnout } = data;

  return (
    <OrgLayout orgName={org?.name}>
      <div style={{ marginBottom: '20px' }}>
        <a href="/org/dashboard" style={{ color: '#007bff', textDecoration: 'none' }}>← All Elections</a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{election.election_name}</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            {election.mode.toUpperCase()} · {election.election_type.toUpperCase()} Election #{election.election_id}
          </p>
        </div>
        <div style={styles.statusBadge(election.status)}>{election.status}</div>
      </div>

      <div style={styles.tabBar}>
        <button style={styles.tab(activeTab === 'candidates')} onClick={() => setActiveTab('candidates')}>Candidates</button>
        <button style={styles.tab(activeTab === 'voters')} onClick={() => setActiveTab('voters')}>Voters</button>
        {election.mode === 'booth' && (
          <button style={styles.tab(activeTab === 'booths')} onClick={() => setActiveTab('booths')}>🗳️ Booths</button>
        )}
        <button style={styles.tab(activeTab === 'results')} onClick={() => setActiveTab('results')}>Results</button>
      </div>

      <div style={styles.section}>
        {activeTab === 'candidates' && (
          <div>
            <h3>Manage Candidates</h3>
            {election.status === 'draft' && (
              <form onSubmit={addCandidate} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <input style={styles.input} placeholder="Name" value={candForm.name} onChange={e => setCandForm({...candForm, name: e.target.value})} required />
                <input style={styles.input} placeholder="Entry #" value={candForm.entry_number} onChange={e => setCandForm({...candForm, entry_number: e.target.value})} required />
                <input style={styles.input} placeholder="ID" value={candForm.cand_id} onChange={e => setCandForm({...candForm, cand_id: e.target.value})} required />
                <button style={styles.btnPrimary} type="submit">Add</button>
              </form>
            )}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Entry #</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Candidate ID</th>
                  {election.status === 'draft' && <th style={styles.th}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.cand_id}>
                    <td style={styles.td}>{c.entry_number}</td>
                    <td style={styles.td}>{c.name}</td>
                    <td style={styles.td}>{c.cand_id}</td>
                    {election.status === 'draft' && (
                      <td style={styles.td}>
                        <button style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => deleteCandidate(c.cand_id)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'voters' && (
          <div>
            <h3>Voters List</h3>
            {election.status === 'draft' && (
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Paste voter list (one per line: name, voter_id, email)</label>
                <textarea 
                  style={{...styles.input, height: '100px', fontFamily: 'monospace'}} 
                  placeholder="Alice,alice@iitd.ac.in,alice@iitd.ac.in"
                  value={voterCsv}
                  onChange={e => setVoterCsv(e.target.value)}
                />
                <button style={{...styles.btnPrimary, marginTop: '10px'}} onClick={uploadVoters}>Upload Voters</button>
              </div>
            )}
            <div style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', marginBottom: '10px' }}>
              <strong>Total Voters:</strong> {election.total_voters}
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>Voter details can be managed by polling officers during the election.</p>
          </div>
        )}

        {activeTab === 'booths' && (
          <div>
            <div style={{ marginBottom: '40px' }}>
              <h3>Polling Booths</h3>
              <form onSubmit={createBooth} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input style={styles.input} placeholder="Booth Name (e.g. Block 1)" value={newBoothName} onChange={e => setNewBoothName(e.target.value)} required />
                <button style={styles.btnPrimary} type="submit">Create Booth</button>
              </form>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Activation Code</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Votes</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {booths.map(b => (
                    <tr key={b.id}>
                      <td style={styles.td}>{b.name}</td>
                      <td style={styles.td}><code style={{ backgroundColor: '#eee', padding: '2px 6px' }}>{b.activation_code}</code></td>
                      <td style={styles.td}>{b.is_active ? <span style={{ color: 'green', fontWeight: 'bold' }}>ACTIVE</span> : 'Inactive'}</td>
                      <td style={styles.td}>{b.votes_cast}</td>
                      <td style={styles.td}>
                        {b.is_active && <button style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => deactivateBooth(b.id)}>Force Deactivate</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3>Polling Officers</h3>
              <form onSubmit={addOfficer} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input style={styles.input} placeholder="Name" value={newOfficer.name} onChange={e => setNewOfficer({...newOfficer, name: e.target.value})} required />
                <input style={styles.input} placeholder="Email" type="email" value={newOfficer.email} onChange={e => setNewOfficer({...newOfficer, email: e.target.value})} required />
                <input style={styles.input} placeholder="Password" type="password" value={newOfficer.password} onChange={e => setNewOfficer({...newOfficer, password: e.target.value})} required />
                <button style={styles.btnPrimary} type="submit">Add Officer</button>
              </form>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map(o => (
                    <tr key={o._id}>
                      <td style={styles.td}>{o.name}</td>
                      <td style={styles.td}>{o.email}</td>
                      <td style={styles.td}>
                        <button style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => deleteOfficer(o._id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '40px' }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{turnout.votes_cast}</div>
                <div style={{ color: '#666' }}>Votes Cast</div>
              </div>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#28a745' }}>{turnout.turnout_percent}%</div>
                <div style={{ color: '#666' }}>Turnout</div>
              </div>
            </div>
            <div style={{ textAlign: 'left', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <p><strong>Created:</strong> {new Date(election.created_at).toLocaleString()}</p>
              {election.opened_at && <p><strong>Opened:</strong> {new Date(election.opened_at).toLocaleString()}</p>}
              {election.closed_at && <p><strong>Closed:</strong> {new Date(election.closed_at).toLocaleString()}</p>}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: '100px' }} /> {/* Spacer for action bar */}

      <div style={styles.actionBar}>
        <div style={{ fontWeight: 'bold' }}>
          Status: <span style={{ color: election.status === 'open' ? '#28a745' : '#333' }}>{election.status.toUpperCase()}</span>
        </div>
        <div>
          {election.status === 'draft' && (
            <button style={styles.btnPrimary} onClick={openElection} disabled={actionLoading}>
              {actionLoading ? 'Opening...' : 'Open Election'}
            </button>
          )}
          {election.status === 'open' && (
            <button style={styles.btnDanger} onClick={closeElection} disabled={actionLoading}>
              {actionLoading ? 'Closing...' : 'Close Election'}
            </button>
          )}
          {election.status === 'closed' && (
            <button style={{...styles.btnSecondary, cursor: 'not-allowed'}} disabled>Election Closed</button>
          )}
        </div>
      </div>
    </OrgLayout>
  );
}
