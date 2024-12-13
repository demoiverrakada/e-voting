import React, { useState, useEffect } from 'react';
import {useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './App.css';
ReactSession.setStoreType('sessionStorage');
function Options() {
  const navigate = useNavigate();
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [alpha, setAlpha] = useState(2);
  const [n, setN] = useState(5);

  useEffect(() => {
    const token = ReactSession.get('access_token');
    //alert(token);
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleUpload = async () => {
    navigate('/upload', { replace: true });
  };
  const handleSetup = async () => {
    try {
      //const alpha = 2;
      //const n = 5;
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'http://localhost:5000/setup',
        { alpha: alpha, n: n }, // Replace with actual values if needed
        {
          headers: {
            authorization: `Bearer ${token}`
          },
        }
      );
      console.log('Protected data:', response.data);
      alert('Setup was successful');
      setShowSetupForm(false); // Hide the form after successful setup
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
    }
  };

  const handleEvoting_fron = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'http://localhost:5000/p/runBuild1',
        { alpha: alpha, n: n }, // Replace with actual values if needed
        {
          headers: {
            authorization: `Bearer ${token}`
          },
          responseType: 'blob', // Important to handle file as a blob
        }
      );
  
      // Create a link element to trigger the download
      const blob = new Blob([response.data], { type: 'application/octet-stream' }); // You can specify the MIME type depending on the file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'app_file'; // Specify the file name to download
      link.click();
  
      alert('Setup was successful');
      setShowSetupForm(false); // Hide the form after successful setup
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
    }
  };

  // Declare state variables for loading and time
  const [loadingBallotAudit, setLoadingBallotAudit] = useState(false);
  const [timeElapsedBallotAudit, setTimeElapsedBallotAudit] = useState(0);

  // Timer function to keep counting time
  const startTimer = (setTimeElapsed) => {
    return setInterval(() => {
      setTimeElapsed((prevTime) => prevTime + 1);
    }, 1000);
  };

  const handleBallot_audit = async () => {
    // Start the timer immediately when the button is pressed
    setLoadingBallotAudit(true);
    setTimeElapsedBallotAudit(0);
    const timerInterval = startTimer(setTimeElapsedBallotAudit);

    // Show alert that the process has started
    alert('Ballot Audit has started. Please wait...');

    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'http://localhost:5000/runBuild2',
        { alpha: 'alpha_value', n: 'n_value' }, // Replace with actual values if needed
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
          responseType: 'blob', // Ensure the response is treated as a file (binary data)
        }
      );

      // Check if the response contains a file (APK)
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'BallotAudit.apk'; // Fallback name if not provided

      // Create a Blob URL to download the APK file
      const blob = new Blob([response.data], { type: 'application/vnd.android.package-archive' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName; // Set the downloaded file name
      link.click(); // Simulate the click to trigger download

      // Stop the timer once the process is complete
      clearInterval(timerInterval);
      alert('Build completed and APK is ready for download!');

      setLoadingBallotAudit(false); // End loading state
    } catch (err) {
      clearInterval(timerInterval); // Ensure the timer is cleared on error
      alert(`Ballot Audit setup failed: ${err.message}`);
      setLoadingBallotAudit(false);
    }
  };
  
  



  const handleGenerate = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'http://localhost:5000/generate',
        { n: n },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
          timeout: 100000, // Increase timeout to 100 seconds
          responseType: 'blob', // Correctly handle binary data
        }
      );
  
      // Check if the response status is 200
      if (response.status === 200) {
        alert('ballots.zip is being downloaded!');
  
        // Create a Blob from the response data
        const zipBlob = new Blob([response.data], { type: 'application/zip' });
        const url = URL.createObjectURL(zipBlob);
  
        // Create a temporary anchor element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ballots.zip'; // Name of the downloaded file
        document.body.appendChild(link);
        link.click();
  
        // Cleanup
        link.remove();
        URL.revokeObjectURL(url);
  
        alert('Ballot generation was successful and the file has been downloaded');
        setShowSetupForm(false); // Hide the form after successful setup
      } else {
        alert('Failed to generate ballots. Please try again.');
      }
    } catch (err) {
      console.error('Error during ballot generation:', err);
      alert(`Ballot generation failed: ${err.message}`);
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

      // Convert JSON response to Blob and download it
      const jsonBlob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'encrypted_votes.json'; // The name of the downloaded file
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      URL.revokeObjectURL(url);

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
      
      // Convert JSON response to Blob and download it
      const jsonBlob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Decrypted_votes.json'; // The name of the downloaded file
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      URL.revokeObjectURL(url);

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
          <button type="button" id="setup" onClick={() => setShowSetupForm(!showSetupForm)}>
          {showSetupForm ? 'Cancel Setup' : 'Setup'}</button>

          {showSetupForm && (
          <div className="setup-form">
            <h3>Setup Parameters</h3>
            <label>
              Alpha:
              <input
                type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*"
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
              />
            </label>
            <label>
              N:
              <input
                type="number"
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
              />
            </label>
            <button type="button" onClick={handleSetup}>Submit Setup</button>
          </div>
          )}

          <button type="button" id="evoting_fron" onClick={handleEvoting_fron}>Evoting App</button>
          <button type="button" id="BallotAudit" onClick={handleBallot_audit}>Ballot Audit</button>
          <button 
            type="button" 
            id="generate" 
            onClick={() => setShowGenerateForm(!showGenerateForm)}
          >
            {showGenerateForm ? 'Cancel Generate' : 'Generate Ballot'}
          </button>

          {showGenerateForm && (
            <div className="generate-form">
              <h3>Generate Ballots</h3>
              <label>
                N (Number of Ballots):
                <input
                  type="number"
                  value={n}
                  onChange={(e) => setN(Number(e.target.value))}
                />
              </label>
              <button type="button" onClick={handleGenerate}>
                Submit Generate
              </button>
            </div>
          )}

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
