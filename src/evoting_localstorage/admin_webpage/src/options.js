import React, { useEffect } from 'react';
import {useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './App.css';

function Options() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = ReactSession.get('access_token');
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleUpload = async () => {
    navigate('/upload', { replace: true });
  };
  const handleSetup = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'http://localhost:5000/setup',
        { alpha: 0.5, n: 1000 }, // Replace with actual values if needed
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Protected data:', response.data);
      alert('Setup was successful');
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
    }
  };

  const handleGetPublicKeys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/pk');
      console.log(response.data);
      alert('Public keys fetched successfully');
    } catch (err) {
      alert(`Failed to get public keys: ${err.message}`);
    }
  };

  const handleGetEncVotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/encvotes');
      console.log(response.data);
      alert('Encrypted votes fetched successfully');
    } catch (err) {
      alert(`Failed to get encrypted votes: ${err.message}`);
    }
  };

  const handleDecryptVotes = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.get('http://localhost:5000/decvotes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      alert('Votes decrypted successfully');
    } catch (err) {
      alert(`Failed to decrypt votes: ${err.message}`);
    }
  };

  const handleGetDcrpVotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/getVotes');
      console.log(response.data);
      alert('Decrypted votes fetched successfully');
    } catch (err) {
      alert(`Failed to get decrypted votes: ${err.message}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Admin Options</h1>
        <br />
        <form>
          <button type="button" id="upload" onClick={handleUpload}>Upload</button>
          <button type="button" id="setup" onClick={handleSetup}>Setup</button>
          <button type="button" id="get_pub_keys" onClick={handleGetPublicKeys}>Get public keys</button>
          <button type="button" id="get_enc_votes" onClick={handleGetEncVotes}>Get encrypted votes</button>
          <button type="button" id="decrypt_votes" onClick={handleDecryptVotes}>Decrypt votes</button>
          <button type="button" id="get_dcrp_votes" onClick={handleGetDcrpVotes}>Get decrypted votes</button>
        </form>
      </header>
    </div>
  );
}

export default Options;
