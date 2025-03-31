import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {QrReader} from "react-qr-reader";
import "./FormPage.css";
import Loading from './Loading';

const VerifyVVPAT = () => {
  const navigate = useNavigate();
  const [bid, setBid] = useState("");
  const [electionId, setElectionId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScan = data => {
    if (data) {
      setBid(data);
      setScanComplete(true);
      setScanning(false);
    }
  };

  const handleError = err => {
    setError("QR Scan Failed: " + err);
    setScanning(false);
  };

  const handleVerify = async () => {
    if (!bid || !electionId) {
      setError("Both Ballot ID and Election ID are required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post("http://localhost:7000/vvpat", 
        { bid, electionId },
        { headers: { "Content-Type": "application/json" } }
      );

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h2>VVPAT Verification</h2>

      {/* QR Scanner Section */}
      {scanning && (
        <div className="qr-scanner-container">
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%", maxWidth: "400px" }}
          />
          <button 
            onClick={() => setScanning(false)}
            className="btn btn-secondary"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {/* Scan Controls */}
      {!scanning && !scanComplete && (
        <button 
          onClick={() => setScanning(true)}
          className="btn"
        >
          Scan Ballot QR Code
        </button>
      )}

      {/* Scanned BID Display */}
      {scanComplete && (
        <div className="scan-result">
          <p>Scanned Ballot ID: <strong>{bid}</strong></p>
          <button 
            onClick={() => {
              setScanComplete(false);
              setBid("");
            }}
            className="btn btn-small"
          >
            Rescan
          </button>
        </div>
      )}

      {/* Election ID Input */}
      <div className="form-group">
        <label htmlFor="electionId">Election ID:</label>
        <input
          type="number"
          id="electionId"
          value={electionId}
          onChange={(e) => setElectionId(e.target.value)}
          className="form-input"
          placeholder="Enter Election ID"
        />
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button onClick={handleVerify} className="btn" disabled={!bid || !electionId}>
          Verify
        </button>
        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      {isLoading && <Loading message="Verifying VVPAT..." />}

      {/* Results Display */}
      {result && (
        <div className="result-container">
          {result.error ? (
            <div className="error">{result.error}</div>
          ) : (
            <>
              <h3>Verification Result:</h3>
              <div className="result-card">
                <p className="result-item">
                  <span className="label">Candidate Name:</span>
                  <span className="value">{result.cand_name}</span>
                </p>
                <p className="result-item">
                  <span className="label">Extended Vote:</span>
                  <span className="value code">{result.extended_vote}</span>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VerifyVVPAT;
