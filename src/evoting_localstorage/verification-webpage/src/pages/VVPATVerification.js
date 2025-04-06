import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsQR from "jsqr";
import "./FormPage.css";
import Loading from './Loading';
import Scanner from "react-qr-barcode-scanner";

const VerifyVVPAT = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State management
  const [bid, setBid] = useState("");
  const [electionId, setElectionId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Handle QR scan from camera
  const handleScan = (data) => {
    if (data) {
      setBid(data.text);
      setScanComplete(true);
      setScanning(false);
      setError(null);
    }
  };

  // Handle scan errors
  const handleError = (err) => {
    console.error("QR Scan Error:", err);
    setError("QR Scan Failed: " + err.message);
    setScanning(false);
  };

  // Handle image upload and QR decoding
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imageData = await readFileAsImageData(file);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (qrCode) {
        setBid(qrCode.data);
        setScanComplete(true);
        setError(null);
      } else {
        setError("No QR code found in the uploaded image");
      }
    } catch (err) {
      setError("Error processing image: " + err.message);
    }
  };

  // Convert image file to ImageData
  const readFileAsImageData = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle verification submission
  const handleVerify = async () => {
    if (!bid || !electionId) {
      setError("Both Ballot ID and Election ID are required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        "http://localhost:7000/vvpat",
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

      {/* Scan/Upload Options */}
      <div className="scan-options">
        {!scanning && !scanComplete && (
          <div className="option-group">
            
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="btn"
            >
              Upload QR Image
            </button>
          </div>
        )}
      </div>

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
        <button 
          onClick={handleVerify} 
          className="btn" 
          disabled={!bid || !electionId}
        >
          Verify
        </button>
        <button onClick={() => navigate("/")} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      {/* Loading and Results */}
      {isLoading && <Loading message="Verifying VVPAT..." />}
      
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

      {/* Error Messages */}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default VerifyVVPAT;

