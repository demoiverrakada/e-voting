import React, { useEffect, useState } from 'react';
import { orgFetch } from './api';
import OrgLayout from './OrgLayout';

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  btnPrimary: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' },
  card: { padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: (status) => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'white',
    backgroundColor: status === 'open' ? '#28a745' : status === 'closed' ? '#343a40' : '#6c757d'
  }),
  form: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #dee2e6' },
  input: { display: 'block', width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }
};

export default function OrgDashboard() {
  const [org, setOrg] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ election_name: '', election_type: 'fptp', number_of_preferences: 1 });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      orgFetch('/org/me'),
      orgFetch('/api/elections')
    ]).then(([orgRes, electRes]) => {
      if (orgRes.data) setOrg(orgRes.data);
      if (electRes.data) setElections(electRes.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    const { data, error } = await orgFetch('/api/elections', {
      method: 'POST',
      body: JSON.stringify(createForm)
    });
    setCreating(false);
    if (error) {
      setCreateError(error);
    } else {
      setElections([data, ...elections]);
      setShowCreateForm(false);
      setCreateForm({ election_name: '', election_type: 'fptp', number_of_preferences: 1 });
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading dashboard...</div>;

  return (
    <OrgLayout orgName={org?.name}>
      <div style={styles.header}>
        <h1>Elections</h1>
        <button style={styles.btnPrimary} onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'New Election'}
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.form}>
          <h3>Create New Election</h3>
          {createError && <div style={{ color: 'red', marginBottom: '10px' }}>{createError}</div>}
          <form onSubmit={handleCreate}>
            <label style={styles.label}>Election Name</label>
            <input
              style={styles.input}
              value={createForm.election_name}
              onChange={(e) => setCreateForm({ ...createForm, election_name: e.target.value })}
              placeholder="e.g. Student Council 2026"
              required
            />
            
            <label style={styles.label}>Election Type</label>
            <select
              style={styles.input}
              value={createForm.election_type}
              onChange={(e) => setCreateForm({ ...createForm, election_type: e.target.value })}
            >
              <option value="fptp">First Past The Post (FPTP)</option>
              <option value="preferential">Preferential Voting (STV/Ranked)</option>
              <option value="block">Block Voting</option>
            </select>

            {createForm.election_type === 'preferential' && (
              <>
                <label style={styles.label}>Number of Preferences</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={createForm.number_of_preferences}
                  onChange={(e) => setCreateForm({ ...createForm, number_of_preferences: parseInt(e.target.value) })}
                  required
                />
              </>
            )}

            <button style={styles.btnPrimary} type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Election'}
            </button>
            <button style={styles.btnSecondary} type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      {elections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No elections yet. Create your first election.
        </div>
      ) : (
        elections.map((el) => (
          <div key={el.election_id} style={styles.card}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{el.election_name}</span>
                <span style={styles.badge(el.status)}>{el.status}</span>
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {el.election_type.toUpperCase()} • {el.total_voters} Voters • Created {new Date(el.created_at).toLocaleDateString()}
              </div>
            </div>
            <button 
              style={styles.btnSecondary} 
              onClick={() => window.location.href = `/org/elections/${el.election_id}`}
            >
              Manage
            </button>
          </div>
        ))
      )}
    </OrgLayout>
  );
}
