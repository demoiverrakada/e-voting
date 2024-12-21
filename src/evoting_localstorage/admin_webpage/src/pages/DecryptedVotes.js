import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './DecryptedVotes.css';
import Navigation from '../Navigation';
import FinalVotes from './FinalVotes';
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";


function DecryptedVotes() {
  const navigate = useNavigate();
  const [decryptedVotes, setDecryptedVotes] = useState([]); // State to store decrypted votes

  // Check for authentication when the page loads
  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/'); // Redirect to login page if no token
    }
  }, [navigate]);

  // Decrypt votes on button click
  const handleDecryptVotes = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:5000/mix',
        {},
        {
          headers: { authorization: `Bearer ${token}` }
        },
      );
      console.log('Decrypted votes:', response.data);
      alert('Votes decrypted successfully.');
    } catch (err) {
      alert(`Failed to decrypt votes: ${err.message}`);
    }
  };

  // Fetch decrypted votes from backend and render them as a table
  const handleGetDcrpVotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/getVotes');
      const votesData = response.data;
      localStorage.setItem("decryptedVotes", JSON.stringify(votesData));
      alert("Decrypted votes fetched successfully.");
      navigate("/final_votes");
    } catch (err) {
      alert(`Failed to fetch decrypted votes: ${err.message}`);
    }
  };

  return (
    <div className="decrypted-container">
      <h2>Decrypted Votes</h2>
      <button onClick={handleDecryptVotes}>Decrypt Votes</button>
      <button onClick={handleGetDcrpVotes}>Fetch Decrypted Votes</button>
      <Routes>
        <Route path="/final_votes" element={<FinalVotes />} />
      </Routes>

      {/* Render table if decrypted votes are available */}
      {decryptedVotes.length > 0 && (
        <table className="votes-table">
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
            {decryptedVotes.map((vote, index) => (
              <tr key={index}>
                <td>{vote.name}</td>
                <td>{vote.votes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Navigation />
    </div>
  );
}

export default DecryptedVotes;

