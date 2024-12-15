import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import "./FormPage.css";
import { useNavigate } from 'react-router-dom';

function VoterVerificationApp() {
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
  const handleVoterVerification = async () => {
    try {
      const response = await axios.post(
        'http://localhost:7000/runBuild3',
        {},
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'app_file';
      link.click();

      alert('Voter Verification app setup completed and file downloaded.');
    } catch (err) {
      alert(`Failed to set up Voter Verification app: ${err.message}`);
    }
  };

  return (
    <div className="form-page">
      <h2>Voter Verification App</h2>
      <button className ="btn" onClick={handleVoterVerification}>Generate Voter Verification App</button>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="btn btn-secondary"
      >
        Back to Home
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default VoterVerificationApp;