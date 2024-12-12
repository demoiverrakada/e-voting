// File: src/pages/VerifySetMembership.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FormPage.css";

const VerifySetMembership = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      setError(null); // Clear previous errors
      setResult(null); // Clear previous results

      // Make a POST request to the server
      const response = await axios.post("http://localhost:7000/pf_zksm_verf", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setResult(response.data); // Display the response data
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred"); // Handle errors
    }
  };

  return (
    <div className="form-page">
      <h2>Set Membership Verification</h2>
      <form onSubmit={handleSubmit}>
        {/* Input fields for required data */}
        <div className="form-group">
          <label>Verifier Public Key</label>
          <input type="text" name="verfpk" required className="input" />
        </div>
        <div className="form-group">
          <label>Signatures</label>
          <input type="text" name="sigs" required className="input" />
        </div>
        <div className="form-group">
          <label>Encrypted Signatures</label>
          <input type="text" name="enc_sigs" required className="input" />
        </div>
        <div className="form-group">
          <label>Encrypted Signatures Randoms</label>
          <input type="text" name="enc_sigs_rands" required className="input" />
        </div>
        <div className="form-group">
          <label>DPK BBSP Signature Proofs</label>
          <input type="text" name="dpk_bbsig_pfs" required className="input" />
        </div>
        <div className="form-group">
          <label>BL Signatures</label>
          <input type="text" name="blsigs" required className="input" />
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn">
          Verify
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="btn btn-secondary"
        >
          Back to Home
        </button>
      </form>

      {/* Display the results */}
      {result && (
        <div className="result-table">
          <h3>Verification Result:</h3>
          <div className="result-row">
            <span className="label">Result:</span>
            <span className="value">{result.message || JSON.stringify(result)}</span>
          </div>
        </div>
      )}

      {/* Display errors */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VerifySetMembership;
