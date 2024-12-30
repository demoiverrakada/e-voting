import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FormPage.css';
import Loading from './Loading'; // Import the Loading component

function VVPATVerificationApp() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const handleVVPATVerification = async () => {
    setIsLoading(true); // Set loading to true when the request starts
    setError(null); // Clear previous errors
    setResult(null); // Clear previous results

    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:7000/runBuild4',
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
      link.download = 'VVPATVerification.apk'; // Specify the file name
      link.style.display = 'none'; // Hide the link element
      document.body.appendChild(link);
      link.click(); // Simulate click to trigger download
      document.body.removeChild(link); // Clean up the DOM

      alert('VVPAT Verification app setup completed. APK file is downloading.');
    } catch (err) {
      console.error('Error while generating the VVPAT Verification app:', err);
      alert(`Failed to generate the VVPAT Verification app: ${err.message}`);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Render the UI
  return (
    <div className="form-page">
      <h2>VVPAT Verification App</h2>
      <button className="btn" onClick={handleVVPATVerification} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate VVPAT Verification App'}
      </button>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="btn btn-secondary"
      >
        Back to Home
      </button>

      {isLoading && <Loading message="Setting up VVPAT Verification app..." />} {/* Show loading spinner when the request is in progress */}

      {error && <div className="error">{error}</div>} {/* Display any error */}
    </div>
  );
}

export default VVPATVerificationApp;