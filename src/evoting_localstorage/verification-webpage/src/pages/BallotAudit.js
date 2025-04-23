import React, { useState } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading';  // Import the Loading component
import "./FormPage.css";

function BallotAudit() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const handleBallotAudit = async () => {
    setIsLoading(true);  // Set loading to true when the request starts
    setError(null);      // Clear any previous errors

    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        '/verif/api/runBuild2',
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
      link.download = 'BallotAudit.apk'; // Specify the file name
      link.style.display = 'none'; // Hide the link element
      document.body.appendChild(link);
      link.click(); // Simulate click to trigger download
      document.body.removeChild(link); // Clean up the DOM

      alert('Ballot Audit app setup completed. APK file is downloading.');
    } catch (err) {
      console.error('Error while generating the Ballot Audit app:', err);
      alert(`Failed to generate the Ballot Audit app: ${err.message}`);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="form-page">
      <h2>Ballot Audit App</h2>
      <button className="btn" onClick={handleBallotAudit}>
        Generate Ballot Audit App
      </button>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="btn btn-secondary"
      >
        Back to Home
      </button>

      {isLoading && <Loading />}  {/* Show loading spinner when the request is in progress */}
      
      {error && <div className="error">{error}</div>} {/* Display any error */}
    </div>
  );
}

export default BallotAudit;
