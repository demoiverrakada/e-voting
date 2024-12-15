import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PublicKeys.css';
import Navigation from '../Navigation';
import { useNavigate } from 'react-router-dom';

function PublicKeys() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState(null); // State to store public keys
  const [error, setError] = useState(null); // State to store error messages

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);

  // Fetch public keys from the backend
  const handleGetPublicKeys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/pk');
      setKeys(response.data); // Set the response data to the keys state
      setError(null); // Clear any previous errors
      alert('Public keys fetched successfully.');
    } catch (err) {
      // Display error messages based on status code
      if (err.response?.status === 422) {
        setError("Setup has not been done yet. No keys available.");
      } else {
        setError("Failed to fetch public keys. Please try again later.");
      }
      setKeys(null); // Clear any previously fetched keys
    }
  };

  return (
    <div className="public-keys-container">
      <h2>Get Public Keys</h2>
      <button onClick={handleGetPublicKeys}>Fetch Public Keys</button>

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Display Public Keys */}
      {keys && (
        <div className="keys-display">
          <table className="keys-table">
            <thead>
              <tr>
                <th>Key Type</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Paillier Public Key</td>
                <td>{keys.pai_pk}</td>
              </tr>
              <tr>
                <td>Paillier Public Key List (Single)</td>
                <td>{JSON.stringify(keys.pai_pklist_single)}</td>
              </tr>
              <tr>
                <td>ElGamal Public Key</td>
                <td>{keys.elg_pk}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Navigation />
    </div>
  );
}

export default PublicKeys;

