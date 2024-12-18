import React, { useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './EvotingApp.css';
import Navigation from '../Navigation';
import { useNavigate } from 'react-router-dom';

ReactSession.setStoreType('sessionStorage');

function EvotingApp() {
  const navigate = useNavigate();

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);

  const handleEvoting = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/runBuild1',
        {},
        {
          headers: { authorization: `Bearer ${token}` },
          responseType: 'blob', // Receive binary data
        }
      );

      // Create a blob and trigger the download
      const blob = new Blob([response.data], { type: 'application/vnd.android.package-archive' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'evoting_app.apk'; // Specify the file name
      link.style.display = 'none'; // Hide the link element
      document.body.appendChild(link);
      link.click(); // Simulate click to trigger download
      document.body.removeChild(link); // Clean up the DOM

      alert('Evoting app setup completed. APK file is downloading.');
    } catch (err) {
      console.error('Error while generating the Evoting app:', err);
      alert(`Failed to generate the Evoting app: ${err.message}`);
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
