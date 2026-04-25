import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FormPage.css";
import Loading from './Loading';

const VerifyReverseSetMembership = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);  // Changed to plural
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);  // Reset to plural

    try {
      const response = await axios.post("/verif/api/pf_zkrsm_verf", {}, {
        headers: { "Content-Type": "application/json" },
      });

      setResults(response.data);  // Store all elections' results
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h2>Verification of Individual Decrypted Votes</h2>

      <button onClick={handleVerify} className="btn">
        Verify
      </button>
      <button onClick={() => navigate("/")} className="btn btn-secondary">
        Back to Home
      </button>

      {isLoading && <Loading message="Verifying votes..." />}

      {/* Display multiple election results */}
      {results && Object.entries(results).map(([electionId, electionResult]) => (
        <div key={electionId} className="election-result">
          <h3>Election {electionId}</h3>
          
          {/* Status display */}
          <div className="reverse-set-membership">
            <h4>Overall Status: {electionResult.status_reverse_set_membership ? '✅ True' : '❌ False'}</h4>
          </div>

          {/* Votes table */}
          {electionResult.decrypted_votes && electionResult.results && (
            <div className="result-table">
              <h4>Detailed Results:</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Decrypted Vote</th>
                    <th>Verification Result</th>
                  </tr>
                </thead>
                <tbody>
                  {electionResult.decrypted_votes.map((vote, index) => (
                    <tr key={`${electionId}-${index}`}>
                      <td>{vote}</td>
                      <td>{electionResult.results[index] ? "✅ Valid" : "❌ Invalid"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VerifyReverseSetMembership;


