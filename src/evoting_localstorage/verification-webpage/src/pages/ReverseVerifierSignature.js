import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FormPage.css";

const ReverseVerifierSignature = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchReverseSignature = async () => {
    try {
      setError(null); // Clear previous errors
      setResult(null); // Clear previous results

      // Make an API request to the /verfsig endpoint
      const response = await axios.post("http://localhost:7000/verfsig");
      console.log("API Response:", response.data);

      // Set the result with the raw response data
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message); // Handle errors
    }
  };

  const renderNestedArray = (data) => {
    if (!Array.isArray(data)) return JSON.stringify(data, null, 2);

    return (
      <ul>
        {data.map((item, index) => (
          <li key={index}>{
            Array.isArray(item) || typeof item === "object"
              ? renderNestedArray(item) // Recursively render nested arrays/objects
              : JSON.stringify(item)
          }</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="form-page">
      <h2>Get Reverse Set Membership Signature</h2>
      <button onClick={fetchReverseSignature} className="btn">
        Fetch Reverse Set Membership Signature Details
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
          <h3>Reverse Set Membership Signature Details:</h3>

          {/* Display Verifier Public Key */}
          <div className="result-row">
            <span className="label">Verifier Public Key</span>
            <span className="value1">
              {renderNestedArray(result.verfpk)}
            </span>
          </div>

          {/* Display Signatures */}
          {result.sigs && (
            <div className="result-row">
              <span className="label">Signatures Reverse</span>
              <span className="value1">
                {renderNestedArray(result.sigs[1])}
              </span>
            </div>
          )}

          {/* Display Encrypted Signatures */}
          {result.enc_sigs && (
            <div className="result-row">
              <span className="label">Encrypted Signatures Reverse</span>
              <span className="value1">
                {renderNestedArray(result.enc_sigs[1])}
              </span>
            </div>
          )}

          {/* Display Encrypted Signature Random Shares */}
          {result.enc_sigs_rands && (
            <div className="result-row">
              <span className="label">Encrypted Signatures Reverse Randoms</span>
              <span className="value1">
                {renderNestedArray(result.enc_sigs_rands[1])}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Display errors */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ReverseVerifierSignature;