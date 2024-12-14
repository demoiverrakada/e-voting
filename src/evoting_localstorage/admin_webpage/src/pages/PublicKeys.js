import React, { useState,useEffect } from 'react';
import axios from 'axios';
import './PublicKeys.css';
import Navigation from '../Navigation'
import { useNavigate } from 'react-router-dom';
function PublicKeys() {
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);
  const handleGetPublicKeys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/pk');
      console.log('Public keys:', response.data);
      alert('Public keys fetched successfully.');
    } catch (err) {
      alert(`Failed to fetch public keys: ${err.message}`);
    }
  };

  return (
    <div className="public-keys-container">
      <h2>Get Public Keys</h2>
      <button onClick={handleGetPublicKeys}>Fetch Public Keys</button>
      <Navigation />
    </div>
  );
}

export default PublicKeys;
