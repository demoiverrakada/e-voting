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
    // Windows-compatible CSV with BOM and CRLF
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csvContent += "Election ID,Election Name,Candidate Entry,Candidate Name,Votes\r\n\r\n";
  
    Object.entries(votesData).forEach(([electionId, election], index) => {
      // Add election header
      csvContent += `"Election ID:","${electionId.replace(/"/g, '""')}"\r\n`;
      csvContent += `"Election Name:","${(election.election_name || 'Untitled').replace(/"/g, '""')}"\r\n\r\n`;
      
      // Add candidate headers
      csvContent += "Entry Number,Candidate Name,Votes\r\n";
  
      // Add candidate data
      (election.candidates || []).forEach(candidate => {
        const entry = `"${(candidate.entry_number || '').toString().replace(/"/g, '""')}"`;
        const name = `"${(candidate.name || '').replace(/"/g, '""')}"`;
        const votes = `"${(candidate.votes || 0).toString().replace(/"/g, '""')}"`;
        csvContent += `${entry},${name},${votes}\r\n`;
      });
  
      // Add spacing between elections (2 empty lines)
      if (index < Object.entries(votesData).length - 1) {
        csvContent += "\r\n\r\n";
      }
    });
  
    // Create Blob with explicit MIME type
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'election_results.csv');
    
    // For MS Edge
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, 'election_results.csv');
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    URL.revokeObjectURL(url);
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
      
      // Process data first
      const elections = Object.entries(votesData).map(([id, data]) => ({
        id: id.toString(),
        name: data.election_name || `Election ${id}`
      }));
  
      // Update state together
      setDecryptedVotes(votesData);
      setElectionIds(elections);
      setSelectedElection(elections[0]?.id || '');
      
      // Save to localStorage
      localStorage.setItem("decryptedVotes", JSON.stringify(votesData));
      
      // Delay download until state updates complete
      setTimeout(() => {
        downloadCSV(votesData);
      }, 50);
  
    } catch (err) {
      console.error("Fetch failed:", err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
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


