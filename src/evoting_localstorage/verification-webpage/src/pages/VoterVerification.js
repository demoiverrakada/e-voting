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
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:7000/runBuild3',
        {},
        {
          headers: { authorization: `Bearer ${token}` },
          responseType: 'blob', // Receive binary data
        }
      );

      // Create a blob and trigger the download
      const blob = new Blob([response.data], { type: 'application/vnd.android.package-archive' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'VoterVerification.apk'; // Specify the file name
      link.style.display = 'none'; // Hide the link element
      document.body.appendChild(link);
      link.click(); // Simulate click to trigger download
      document.body.removeChild(link); // Clean up the DOM

      alert('Evoting app setup completed. APK file is downloading.');
    } catch (err) {
      console.error('Error while generating the Evoting app:', err);
      alert(`Failed to generate the Evoting app: ${err.message}`);
    } finally {
      setLoading(false); // Stop loading
    }

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
