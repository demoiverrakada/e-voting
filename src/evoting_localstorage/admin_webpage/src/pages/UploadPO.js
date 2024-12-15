import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './Upload.css';
import Navigation from '../Navigation'
import { useNavigate } from 'react-router-dom';
function UploadPO() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/json') {
      setFile(uploadedFile);
      setMessage('File selected: ' + uploadedFile.name);
    } else {
      setMessage('Please upload a valid JSON file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const token = sessionStorage.getItem('access_token');

        const response = await axios.post('http://localhost:5000/upload_PO', jsonData, {
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        setMessage(`Upload successful: ${response.data.message || 'Success'}`);
      } catch (error) {
        setMessage(
          `Upload failed: ${
            error.response?.data?.message || error.message || 'Invalid JSON format or unknown error.'
          }`
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="upload-container">
      <h1>Upload JSON File (PO)</h1>
      <input type="file" accept=".json" onChange={handleFileChange} />
      {message && <p>{message}</p>}
      <button onClick={handleUpload}>Upload</button>
      <Navigation />
    </div>
  );
}

export default UploadPO;
