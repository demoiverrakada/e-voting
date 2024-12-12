
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FormPage.css";

const GetPublicKeys = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchPublicKeys = async () => {
    try {
      setError(null); // Clear previous errors
      setResult(null); // Clear previous results

      // Make an API request to the /pk endpoint
      const response = await axios.get("http://localhost:7000/pk");
      setResult(response.data); // Set the API response data
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred"); // Handle errors
    }
  };

  return (
    <div className="form-page">
      <h2>Get Public Keys</h2>
      <button onClick={fetchPublicKeys} className="btn">
        Fetch Public Keys
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
          <h3>Public Key Details:</h3>
          <div className="result-row">
            <span className="label">PAI Public Key:</span>
            <span className="value">{result.pai_pk}</span>
          </div>
          <div className="result-row">
            <span className="label">PAI Public Key List Single:</span>
            <span className="value">{result.pai_pklist_single}</span>
          </div>
          <div className="result-row">
            <span className="label">ElGamal Public Key:</span>
            <span className="value">{result.elg_pk}</span>
          </div>
        </div>
      )}

      {/* Display errors */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default GetPublicKeys;

