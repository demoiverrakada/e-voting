import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './GenerateBallot.css';
import Navigation from '../Navigation'
import { useNavigate } from 'react-router-dom';
function GenerateBallot() {
  const [n, setN] = useState(5);
  const navigate = useNavigate();
  
    // Check for authentication when the page loads
    useEffect(() => {
      if (!sessionStorage.getItem('access_token')) {
        navigate('/'); // Redirect to login page if no token
      }
    }, [navigate]);
  const handleGenerate = async () => {
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

      const zipBlob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ballots.zip';
      link.click();
      alert('Ballots generated successfully!');
    } catch (err) {
      alert(`Failed to generate ballots: ${err.message}`);
    }
  };

  return (
    <div className="generate-container">
      <h2>Generate Ballots</h2>
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
      <Navigation />
    </div>
  );
}

export default GenerateBallot;
