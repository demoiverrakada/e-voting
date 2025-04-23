import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import './DecryptedVotes.css';
import Navigation from '../Navigation';
import FinalVotes from './FinalVotes';
import { Routes, Route } from "react-router-dom";

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

  // Helper: Download CSV
  const downloadCSV = (votesData) => {
    let csvContent = "Election Name,Candidate Name,Votes\r\n";
    Object.values(votesData).forEach(election => {
      (election.candidates || []).forEach(candidate => {
        // Escape commas in names if needed
        const electionName = `"${(election.election_name || '').replace(/"/g, '""')}"`;
        const candidateName = `"${(candidate.name || '').replace(/"/g, '""')}"`;
        csvContent += `${electionName},${candidateName},${candidate.votes}\r\n`;
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'election_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDecryptVotes = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      await axios.post(
        '/api/mix',
        {},
        { headers: { authorization: `Bearer ${token}` } }
      );
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
      const response = await axios.get('/api/getVotes');
      const votesData = response.data || {};
      setDecryptedVotes(votesData);

      // Build array of {id, name}
      const elections = Object.entries(votesData).map(([id, data]) => ({
        id: id.toString(),
        name: data.election_name || `Election ${id}`
      }));
      setElectionIds(elections);

      if (elections.length > 0) {
        setSelectedElection(elections[0].id);
      } else {
        setSelectedElection('');
      }
      localStorage.setItem("decryptedVotes", JSON.stringify(votesData));
      // Download CSV
      downloadCSV(votesData);
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

  // Get the currently selected election's data safely
  const selectedElectionData = decryptedVotes[selectedElection] || {};

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
            <button onClick={handleGetDcrpVotes}>Fetch Decrypted Votes (Download CSV)</button>
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
            {electionIds.map((election) => (
              <option key={election.id} value={election.id}>{election.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedElection && selectedElectionData && Array.isArray(selectedElectionData.candidates) && (
        <div className="votes-table-wrapper">
          <h3 className="table-header">
            {selectedElectionData.election_name || `Election ${selectedElection}`} Results
          </h3>
          <table className="votes-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Vote Count</th>
              </tr>
            </thead>
            <tbody>
              {selectedElectionData.candidates.map((vote, index) => (
                <tr key={`${selectedElection}-${index}`}>
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


