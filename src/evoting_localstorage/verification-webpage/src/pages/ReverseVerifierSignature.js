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
      const response = await axios.post('http://localhost:7000/verfsigrev');
      console.log(response.data);
      
      // Convert JSON response to Blob and download it
      const jsonBlob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reverse_verifier_signature.json'; // The name of the downloaded file
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      URL.revokeObjectURL(url);

      alert('reverse_verifier_signature fetched successfully');
      // Set the result with the raw response data
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message); // Handle errors
    }
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
    </div>
    
  );
};

export default ReverseVerifierSignature;