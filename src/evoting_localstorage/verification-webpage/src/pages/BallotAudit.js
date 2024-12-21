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
      const response = await axios.post(
        'http://localhost:7000/runBuild2',
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

      alert('Ballot Audit app setup completed and file downloaded.');
    } catch (err) {
      alert(`Failed to set up BallotAudit app: ${err.message}`);
      setError(err.message);  // Set error message if the request fails
    } finally {
      setIsLoading(false);  // Set loading to false when the request is complete (either success or failure)
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
