import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './EvotingApp.css';
import Navigation from '../Navigation'
import { useNavigate } from 'react-router-dom';
ReactSession.setStoreType('sessionStorage');

function EvotingApp() {
  const [alpha, setAlpha] = useState(2);
  const [n, setN] = useState(5);
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);
  const handleEvoting = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'http://localhost:5000/p/runBuild1',
        { alpha, n },
        {
          headers: { authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'app_file';
      link.click();

      alert('Evoting app setup completed and file downloaded.');
    } catch (err) {
      alert(`Failed to set up Evoting app: ${err.message}`);
    }
  };

  return (
    <div className="evoting-container">
      <h2>Evoting App</h2>
      <button onClick={handleEvoting}>Generate Evoting App</button>
      <Navigation />
    </div>
  );
}

export default EvotingApp;
