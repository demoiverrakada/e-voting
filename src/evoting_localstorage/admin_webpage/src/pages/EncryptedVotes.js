import React, { useState,useEffect } from 'react';
import axios from 'axios';
import './DecryptedVotes.css';
import Navigation from '../Navigation'
import { useNavigate } from 'react-router-dom';

function EncryptedVotes() {
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);
  const handleGetEncVotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/encvotes');
      const jsonBlob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'encrypted_votes.json';
      link.click();

      alert('Encrypted votes fetched successfully.');
    } catch (err) {
      alert(`Failed to fetch encrypted votes: ${err.message}`);
    }
  };

  return (
    <div className="decrypted-container">
      <h2>Get Encrypted Votes</h2>
      <button onClick={handleGetEncVotes}>Fetch Encrypted Votes</button>
      <Navigation />
    </div>
  );
}

export default EncryptedVotes;
