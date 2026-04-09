import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Upload.css';
import Navigation from '../Navigation';
import { useNavigate } from 'react-router-dom';

function UploadDefault() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.name.endsWith('.enc.json')) {
      setFile(uploadedFile);
      setMessage('File selected: ' + uploadedFile.name);
    } else {
      setMessage('Please upload a valid .enc.json file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('No file selected.');
      return;
    }

    try {
      const token = sessionStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://10.208.20.91:5002/upload', formData, {
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(`Upload successful: ${response.data.message || 'Success'}`);
    } catch (error) {
      setMessage(
        `Upload failed: ${
          error.response?.data?.message || error.message || 'Unknown error.'
        }`
      );
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Final Votes File</h1>
      <input type="file" accept=".enc.json" onChange={handleFileChange} />
      {message && <p>{message}</p>}
      <button onClick={handleUpload}>Upload</button>
      <Navigation />
    </div>
  );
}

export default UploadDefault;
