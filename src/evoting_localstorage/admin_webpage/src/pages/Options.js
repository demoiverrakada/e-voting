import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OptionsPage.css';
import Navigation from '../Navigation';

function OptionsPage() {
  const navigate = useNavigate();
  
    // Check for authentication when the page loads
    useEffect(() => {
      if (!sessionStorage.getItem('access_token')) {
        navigate('/'); // Redirect to login page if no token
      }
    }, [navigate]);
  const handleNavigation = (path) => navigate(path);

  return (
    <div className="admin-dashboard-container">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-sections">
        <div className="section pre-poll">
          <h2>Pre-Polling process</h2>
          <div className="buttons">
            <button onClick={() => handleNavigation('/upload_candidate')}>Upload Candidates List</button>
            <button onClick={() => handleNavigation('/upload_po')}>Upload Polling Officer Credentials</button>
            <button onClick={() => handleNavigation('/upload_voters')}>Upload Voter List</button>
            <button onClick={() => handleNavigation('/setup')}>Setup System</button>
            <button onClick={() => handleNavigation('/generate_ballots')}>Generate Ballots</button>
          </div>
        </div>
        <div className="section during-poll">
          <h2>Polling process</h2>
          <div className="buttons">
          <button onClick={() => handleNavigation('/evoting_app')}>Generate Evoting App</button>
          <button onClick={() => handleNavigation('/upload_votes')}>Upload Votes</button>
          </div>
        </div>
        <div className="section post-poll">
          <h2>Post-Polling process</h2>
          <div className="buttons">
            <button onClick={() => handleNavigation('/decrypted_votes')}>Get/Decrypt Votes</button>
            <button onClick={() => handleNavigation('/public_keys')}>Fetch Public Keys</button>
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  );
}

export default OptionsPage;

