import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './DecryptedVotes.css';
import Navigation from '../Navigation'
import { useNavigate } from 'react-router-dom';
ReactSession.setStoreType('sessionStorage');

function DecryptedVotes() {
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);
  const handleDecryptVotes = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.get('http://localhost:5000/decvotes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Decrypted votes:', response.data);
      alert('Votes decrypted successfully.');
    } catch (err) {
      alert(`Failed to decrypt votes: ${err.message}`);
    }
  };

  const handleGetDcrpVotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/getVotes');
      const jsonBlob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'decrypted_votes.json';
      link.click();

      alert('Decrypted votes fetched successfully.');
    } catch (err) {
      alert(`Failed to fetch decrypted votes: ${err.message}`);
    }
  };

  return (
    <div className="decrypted-container">
      <h2 >Decrypted Votes</h2>
      <button onClick={handleDecryptVotes}>Decrypt Votes</button>
      <button onClick={handleGetDcrpVotes}>Fetch Decrypted Votes</button>
      <Navigation />
    </div>
  );
}

export default DecryptedVotes;
