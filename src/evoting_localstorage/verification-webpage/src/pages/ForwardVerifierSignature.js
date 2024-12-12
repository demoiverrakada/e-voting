import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FormPage.css";

const ForwardVerifierSignature = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchForwardSignature = async () => {
    try {
      setError(null); // Clear previous errors
      setResult(null); // Clear previous results

      // Make an API request to the /verfsig endpoint
      const response = await axios.post("http://localhost:7000/verfsig");
      
      // Set the result with the raw response data
      setResult(response.data); // Directly use the response data without modification
    } catch (err) {
      setError(err.response?.data?.error || err.message); // Handle errors
    }
  };

  return (
    <div className="form-page">
      <h2>Get Set Membership Signature</h2>
      <button onClick={fetchForwardSignature} className="btn">
        Fetch Set Membership Signature Details
      </button>
      <button
        onClick={() => navigate("/")}
        className="btn btn-secondary"
        style={{ marginTop: "10px" }}
      >
        Back to Home
      </button>
      
      {/* Display the results */}
      {result && (
        <div className="result-table">
          <h3>Set Membership Signature Details:</h3>
          
          {/* Display Verifier Public Key */}
          <div className="result-row">
            <span className="label">Verifier Public Key</span>
            <span className="value1">
              {JSON.stringify(result.verfpk, null, 2)}
            </span>
          </div>

          {/* Display Signatures */}
          <div className="result-row">
            <span className="label">Signatures</span>
            <span className="value">
              {JSON.stringify(result.sigs, null, 2)}
            </span>
          </div>

          {/* Display Encrypted Signatures */}
          <div className="result-row">
            <span className="label">Encrypted Signatures</span>
            <span className="value">
              {JSON.stringify(result.enc_sigs, null, 2)}
            </span>
          </div>

          {/* Display Encrypted Signature Random Shares */}
          <div className="result-row">
            <span className="label">Encrypted Signature Random Shares</span>
            <span className="value">
              {JSON.stringify(result.enc_sigs_rands, null, 2)}
            </span>
          </div>
        </div>
      )}

      {/* Display errors */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ForwardVerifierSignature;

