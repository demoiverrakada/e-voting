import React, { useState } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import { useNavigate } from 'react-router-dom';
import './FormPage.css';
import Loading from './Loading'; // Import the Loading component

function VoterVerificationApp() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const handleVoterVerification = async () => {
    setIsLoading(true); // Set loading to true when the request starts
    setError(null); // Clear previous errors
    setResult(null); // Clear previous results

    try {
      // Make a POST request to the server
      const response = await axios.post(
        'http://localhost:7000/runBuild3',
        {},
        {
          responseType: 'blob',
        }
      );

      // Handle the downloaded blob and trigger file download
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'app_file';
      link.click();

      alert('Voter Verification app setup completed and file downloaded.');
    } catch (err) {
      setError(`Failed to set up Voter Verification app: ${err.message}`);
    } finally {
      setIsLoading(false); // Set loading to false after the request completes
    }
  };

  return (
    <div className="form-page">
      <h2>Voter Verification App</h2>
      {/* Verify Button */}
      <button className="btn" onClick={handleVoterVerification} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Voter Verification App'}
      </button>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="btn btn-secondary"
      >
        Back to Home
      </button>

      {/* Display Loading spinner if isLoading is true */}
      {isLoading && <Loading message="Setting up Voter Verification app..." />}

      {/* Display errors */}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default VoterVerificationApp;
