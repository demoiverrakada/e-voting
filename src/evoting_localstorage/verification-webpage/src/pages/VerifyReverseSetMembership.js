import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FormPage.css";
import Loading from './Loading';  // Import the Loading component

const VerifyReverseSetMembership = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);  // Track loading state

  const handleVerify = async () => {
    setIsLoading(true); // Set loading to true when the request starts
    setError(null); // Clear previous errors
    setResult(null); // Clear previous results

    try {
      // Make a POST request to the server
      const response = await axios.post("http://localhost:7000/pf_zkrsm_verf", {}, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setResult(response.data); // Display the response data
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred"); // Handle errors
    } finally {
      setIsLoading(false); // Set loading to false when the request completes
    }
  };

  return (
    <div className="form-page">
      <h2>Verification of Individual Decrypted Votes</h2>

      {/* Verify Button */}
      <button onClick={handleVerify} className="btn">
        Verify
      </button>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="btn btn-secondary"
      >
        Back to Home
      </button>

      {/* Display Loading spinner if isLoading is true */}
      {isLoading && <Loading message="Verifying votes..." />}

      {/* Display the results */}
      {result && (
        <div className="result-table">
          <h3>Overall Status: {result.status_reverse_set_membership ? "True" : "False"}</h3>
          
          <table className="table">
            <thead>
              <tr>
                <th>Decrypted Vote</th>
                <th>Verification Result</th>
              </tr>
            </thead>
            <tbody>
              {result.decrypted_votes.map((vote, index) => (
                <tr key={index}>
                  <td>{vote}</td>
                  <td>{result.results[index] ? "True" : "False"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Display errors */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VerifyReverseSetMembership;

