import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './Setup.css';
import Navigation from '../Navigation';
import Loading from './Loading'; // Import the reusable Loading component
import { useNavigate } from 'react-router-dom';

ReactSession.setStoreType('sessionStorage');

function Setup() {
  const [alpha, setAlpha] = useState('');
  const [loading, setLoading] = useState(false); // State to track loading status
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);

  const handleSetup = async () => {
    setLoading(true); // Start loading
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
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="setup-container">
      <h2>Setup Parameters</h2>

      {/* Show loading spinner if processing */}
      {loading ? (
        <Loading message="Setting up, please wait..." />
      ) : (
        <form className="setup-form">
          <label>
            Number of decryption servers:
            <input
              type="number"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
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
