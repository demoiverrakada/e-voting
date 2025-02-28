import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GenerateBallot.css';
import Navigation from '../Navigation';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';

function GenerateBallot() {
  const [n, setN] = useState("");
  const [electionId, setElectionId] = useState(""); // New state for election ID
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleGenerate = async () => {
    if (!electionId) {
      alert('Please enter an Election ID');
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/generate',
        { n, electionId }, // Include electionId in the request
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
      link.download = `election_id_${electionId}_ballots.zip`; // Use electionId in filename
      link.click();

      alert('Ballots generated successfully!');
    } catch (err) {
      alert(`Failed to generate ballots: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generate-container">
      <h2>Generate Ballots</h2>

      {loading ? (
        <Loading message="Generating ballots, please wait..." />
      ) : (
        <form className="generate-form">
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
            Number of Ballots:
            <input
              type="number"
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              required
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

