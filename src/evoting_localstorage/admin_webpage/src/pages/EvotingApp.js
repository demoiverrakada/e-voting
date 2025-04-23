import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './EvotingApp.css';
import Navigation from '../Navigation';
import Loading from './Loading'; // Import the reusable Loading component
import { useNavigate } from 'react-router-dom';

ReactSession.setStoreType('sessionStorage');

function EvotingApp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // State to track loading status

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);

  const handleEvoting = async () => {
    setLoading(true); // Start loading
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        '/api/runBuild1',
        {},
        {
          headers: { authorization: `Bearer ${token}` },
          responseType: 'blob', // Receive binary data
        }
      );

      // Create a blob and trigger the download
      const zipBlob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'evoting.zip';
      link.click();

      alert('Evoting app setup completed. APK file is downloading.');
    } catch (err) {
      console.error('Error while generating the Evoting app:', err);
      alert(`Failed to generate the Evoting app: ${err.message}`);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="evoting-container">
      <h2>Evoting App</h2>

      {/* Show loading spinner if processing */}
      {loading ? (
        <Loading message="Generating the Evoting App, please wait..." />
      ) : (
        <button onClick={handleEvoting}>Generate Evoting App</button>
      )}

      <Navigation />
    </div>
  );
}

export default EvotingApp;

