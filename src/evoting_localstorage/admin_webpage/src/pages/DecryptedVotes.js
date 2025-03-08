import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import './DecryptedVotes.css';
import Navigation from '../Navigation';
import FinalVotes from './FinalVotes';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function DecryptedVotes() {
  const navigate = useNavigate();
  const [decryptedVotes, setDecryptedVotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedElection, setSelectedElection] = useState('');
  const [electionIds, setElectionIds] = useState([]);

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleDecryptVotes = async () => {
    setLoading(true);
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
      // Automatically fetch the updated votes
      await handleGetDcrpVotes();
    } catch (err) {
      alert(`Failed to decrypt votes: ${err.message}`);
      setLoading(false);
    }
  };

  const handleGetDcrpVotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/getVotes');
      const votesData = response.data;
      setDecryptedVotes(votesData);
      setElectionIds(Object.keys(votesData));
      if (Object.keys(votesData).length > 0) {
        setSelectedElection(Object.keys(votesData)[0]);
      }
      localStorage.setItem("decryptedVotes", JSON.stringify(votesData));
      console.log("Decrypted votes fetched:", votesData);
    } catch (err) {
      console.error("Failed to fetch decrypted votes:", err);
      alert(`Failed to fetch decrypted votes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleElectionChange = (event) => {
    setSelectedElection(event.target.value);
  };

  return (
    <div className="decrypted-container">
      <h2>Decrypted Votes</h2>

      <div className="action-buttons">
        {loading ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Processing...</p>
          </div>
        ) : (
          <>
            <button onClick={handleDecryptVotes}>Decrypt Votes</button>
            <button onClick={handleGetDcrpVotes}>Fetch Decrypted Votes</button>
          </>
        )}
      </div>

      {electionIds.length > 0 && (
        <div className="election-selector">
          <label htmlFor="election-select">Select Election: </label>
          <select 
            id="election-select" 
            value={selectedElection} 
            onChange={handleElectionChange}
          >
            {electionIds.map((id) => (
              <option key={id} value={id}>Election {id}</option>
            ))}
          </select>
        </div>
      )}

{selectedElection && decryptedVotes[selectedElection] && (
  <div className="votes-table-wrapper">
    <h3 className="table-header">Election Results</h3>
    <table className="votes-table">
      <thead>
        <tr>
          <th>Candidate Name</th>
          <th>Vote Count</th>
        </tr>
      </thead>
      <tbody>
        {decryptedVotes[selectedElection].map((vote, index) => (
          <tr key={index}>
            <td>{vote.name}</td>
            <td>{vote.votes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      <Routes>
        <Route path="/final_votes" element={<FinalVotes />} />
      </Routes>

      <Navigation />
    </div>
  );
}

export default DecryptedVotes;
