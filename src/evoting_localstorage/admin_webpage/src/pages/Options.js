import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OptionsPage.css';
import Navigation from '../Navigation';

function OptionsPage() {
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

    // Check for authentication when the page loads
    useEffect(() => {
      if (!sessionStorage.getItem('access_token')) {
        navigate('/'); // Redirect to login page if no token
      }
    }, [navigate]);
  const handleNavigation = (path) => navigate(path);

  const handleResetElection = async () => {
    const confirmed = window.confirm(
      'WARNING: This will permanently delete all election data (candidates, voters, votes, keys, etc.) and clear output folders.\n\nAdmin credentials will be preserved.\n\nAre you sure you want to reset the entire election?'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const token = sessionStorage.getItem('access_token');
      await axios.post(
        'https://5000-01kk9e5t37w5v48yspx6hdpj3s.cloudspaces.litng.ai//reset-election',
        {},
        { headers: { authorization: `Bearer ${token}` } }
      );
      alert('Election has been reset successfully.');
    } catch (err) {
      alert('Failed to reset election: ' + (err.response?.data?.error || err.message));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-sections">
        <div className="section pre-poll">
          <h2>Pre-Polling process</h2>
          <div className="buttons">
            <button onClick={() => handleNavigation('/change_password')}>Change Password</button>
            <button onClick={() => handleNavigation('/upload_candidate')}>Upload Candidates List</button>
            <button onClick={() => handleNavigation('/upload_voters')}>Upload Voter List</button>
            <button onClick={() => handleNavigation('/upload_bmd_keys')}>Upload BMD Keys</button>
            <button onClick={() => handleNavigation('/setup')}>Setup System</button>
            <button onClick={() => handleNavigation('/generate_ballots')}>Generate Ballots</button>
          </div>
        </div>
        <div className="section during-poll">
          <h2>Polling process</h2>
          <div className="buttons">
          <button onClick={() => handleNavigation('/upload_votes')}>Upload Votes</button>
          </div>
        </div>
        <div className="section post-poll">
          <h2>Post-Polling process</h2>
          <div className="buttons">
            <button onClick={() => handleNavigation('/decrypted_votes')}>Get/Decrypt Votes</button>
          </div>
        </div>
      </div>
      <div className="reset-section">
        <button className="reset-btn" onClick={handleResetElection} disabled={resetting}>
          {resetting ? 'Resetting...' : 'Reset Election'}
        </button>
      </div>
      <Navigation />
    </div>
  );
}

export default OptionsPage;

