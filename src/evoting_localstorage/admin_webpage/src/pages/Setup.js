import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Setup.css';
import Navigation from '../Navigation';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';

function Setup() {
  const [alpha, setAlpha] = useState('');
  const [electionId, setElectionId] = useState(''); // New state for election ID
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleSetup = async () => {
    if (!electionId) {
      alert('Please enter an Election ID');
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/setup',
        { alpha, election_id: electionId }, // Include both alpha and election_id
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Setup successful:', response.data);
      alert(`Setup was successful for Election ID: ${electionId}`);
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <h2>Setup Parameters</h2>

      {loading ? (
        <Loading message="Setting up, please wait..." />
      ) : (
        <form className="setup-form">
          <label>
            Election ID:
            <input
              type="number"
              value={electionId}
              onChange={(e) => setElectionId(e.target.value)}
              required
            />
          </label>
          <label>
            Number of decryption servers:
            <input
              type="number"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              required
            />
          </label>
          <button type="button" onClick={handleSetup}>
            Submit
          </button>
        </form>
      )}

      <Navigation />
    </div>
  );
}

export default Setup;

