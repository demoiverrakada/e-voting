import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './GenerateBallot.css';
import Navigation from '../Navigation';
import Loading from './Loading'; // Import the reusable Loading component
import { useNavigate } from 'react-router-dom';

function GenerateBallot() {
  const [n, setN] = useState("");
  const [loading, setLoading] = useState(false); // State to track loading status
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);

  const handleGenerate = async () => {
    setLoading(true); // Start loading
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/generate',
        { n },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      // Generate and download the zip file
      const zipBlob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ballots.zip';
      link.click();

      alert('Ballots generated successfully!');
    } catch (err) {
      alert(`Failed to generate ballots: ${err.message}`);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="generate-container">
      <h2>Generate Ballots</h2>

      {/* Show loading spinner if processing */}
      {loading ? (
        <Loading message="Generating ballots, please wait..." />
      ) : (
        <form className="generate-form">
          <label>
            N (Number of Ballots):
            <input
              type="number"
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
          </label>
          <button type="button" onClick={handleGenerate}>
            Generate
          </button>
        </form>
      )}

      <Navigation />
    </div>
  );
}

export default GenerateBallot;

