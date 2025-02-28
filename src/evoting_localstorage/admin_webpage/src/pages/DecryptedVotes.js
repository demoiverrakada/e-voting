import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import './DecryptedVotes.css';
import Navigation from '../Navigation';
import FinalVotes from './FinalVotes';
import Loading from './Loading'
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
    } catch (err) {
      alert(`Failed to decrypt votes: ${err.message}`);
    } finally {
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
      setSelectedElection(Object.keys(votesData)[0]);
      localStorage.setItem("decryptedVotes", JSON.stringify(votesData));
      alert("Decrypted votes fetched successfully.");
    } catch (err) {
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

      {loading ? (
        <Loading message="Please wait while we process the votes..." />
      ) : (
        <>
          <button onClick={handleDecryptVotes}>Decrypt Votes</button>
          <button onClick={handleGetDcrpVotes}>Fetch Decrypted Votes</button>
        </>
      )}

      {electionIds.length > 0 && (
        <div>
          <label htmlFor="election-select">Select Election: </label>
          <select id="election-select" value={selectedElection} onChange={handleElectionChange}>
            {electionIds.map((id) => (
              <option key={id} value={id}>Election {id}</option>
            ))}
          </select>
        </div>
      )}

      {selectedElection && decryptedVotes[selectedElection] && (
        <table className="votes-table">
          <thead>
            <tr>
              <th>Candidate Index</th>
              <th>Vote Count</th>
            </tr>
          </thead>
          <tbody>
            {decryptedVotes[selectedElection].msgs_out_dec.map((vote, index) => (
              <tr key={index}>
                <td>{vote[0]}</td>
                <td>{vote[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Routes>
        <Route path="/final_votes" element={<FinalVotes />} />
      </Routes>

      <Navigation />
    </div>
  );
}

export default DecryptedVotes;

