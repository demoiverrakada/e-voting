// File: src/pages/VerifyReverseSetMembership.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FormPage.css";

const VerifyReverseSetMembership = () => {
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
      const response = await axios.post("http://localhost:7000/pf_zkrsm_verf", data, {
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
      <h2>Reverse Set Membership Verification</h2>
      <form onSubmit={handleSubmit}>
        {/* Input fields for required data */}
        <div className="form-group">
          <label>Verifier Public Key</label>
          <input type="text" name="verfpk" required className="input" />
        </div>
        <div className="form-group">
          <label>Signatures Reverse</label>
          <input type="text" name="sigs_rev" required className="input" />
        </div>
        <div className="form-group">
          <label>Encrypted Signatures Reverse</label>
          <input type="text" name="enc_sigs_rev" required className="input" />
        </div>
        <div className="form-group">
          <label>Encrypted Signatures Reverse Randoms</label>
          <input type="text" name="enc_sigs_rev_rands" required className="input" />
        </div>
        <div className="form-group">
          <label>DPK BBSP Plus Signature Proofs</label>
          <input type="text" name="dpk_bbsplussig_pfs" required className="input" />
        </div>
        <div className="form-group">
          <label>BL Signatures Reverse</label>
          <input type="text" name="blsigs_rev" required className="input" />
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
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* Display errors */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VerifyReverseSetMembership;
