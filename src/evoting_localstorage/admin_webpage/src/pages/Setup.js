import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './Setup.css';
import Navigation from '../Navigation'
import { useNavigate } from 'react-router-dom';
ReactSession.setStoreType('sessionStorage');

function Setup() {
  const [alpha, setAlpha] = useState('');
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);
  const handleSetup = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/setup',
        {alpha},
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Setup successful:', response.data);
      alert('Setup was successful!');
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
    }
  };

  return (
    <div className="setup-container">
      <h2>Setup Parameters</h2>
      <form className="setup-form">
        <label>
          Number of decryption servers:
          <input
            type="number"
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
          />
        </label>
        <label>
          Number of ballots to be generated:
          <input
            type="number"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
        <button type="button" onClick={handleSetup}>
          Submit
        </button>
      </form>
      <Navigation />
    </div>
  );
}

export default Setup;