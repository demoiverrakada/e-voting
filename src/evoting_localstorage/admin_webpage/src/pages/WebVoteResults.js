import React, { useState } from 'react';
import Navigation from '../Navigation';
import './WebVoteResults.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function WebVoteResults() {
  const [electionId, setElectionId] = useState('');
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function loadResults(event) {
    event.preventDefault();
    setStatus('loading');
    setError('');
    setResults(null);

    try {
      const token = sessionStorage.getItem('access_token');
      const res = await fetch(
        `${API_BASE_URL}/api/web-votes/results?election_id=${encodeURIComponent(electionId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load web voting turnout.');
      }

      setResults(data);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <div className="web-results-shell">
      <section className="web-results-panel">
        <header>
          <p className="web-results-eyebrow">Web Voting</p>
          <h1>Live Turnout</h1>
        </header>

        <form className="web-results-form" onSubmit={loadResults}>
          <label htmlFor="election-id">Election ID</label>
          <div>
            <input
              id="election-id"
              type="number"
              min="1"
              value={electionId}
              onChange={(event) => setElectionId(event.target.value)}
              required
            />
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </form>

        {error && <div className="web-results-alert">{error}</div>}

        {results && (
          <div className="web-results-grid">
            <div className="web-result-card wide">
              <span>{results.election_name}</span>
              <strong>{results.election_type.toUpperCase()}</strong>
            </div>
            <div className="web-result-card">
              <span>Total voters</span>
              <strong>{results.total_voters}</strong>
            </div>
            <div className="web-result-card">
              <span>Encrypted web votes</span>
              <strong>{results.submitted_web_votes}</strong>
            </div>
            <div className="web-result-card">
              <span>Marked voted</span>
              <strong>{results.marked_voted}</strong>
            </div>
            <div className="web-result-card">
              <span>Turnout</span>
              <strong>{results.turnout_percent}%</strong>
            </div>
          </div>
        )}
      </section>
      <Navigation />
    </div>
  );
}

export default WebVoteResults;
