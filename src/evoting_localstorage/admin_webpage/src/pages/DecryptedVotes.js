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
    const downloadCSV = (votesData) => {
        let csvContent = '\uFEFF';
        csvContent += "Election ID,Election Name,Type,Details\r\n\r\n";
        Object.entries(votesData).forEach(([electionId, election], index) => {
            csvContent += `"Election ID:","${electionId.replace(/"/g, '""')}"\r\n`;
            csvContent += `"Election Name:","${(election.election_name || 'Untitled').replace(/"/g, '""')}"\r\n`;
            csvContent += `"Election Type:","${(election.election_type || '').replace(/"/g, '""')}"\r\n\r\n`;
            if (election.is_preferential) {
                if (election.error) {
                    csvContent += `"Error:","${election.error}"\r\n`;
                } else {
                    csvContent += `"Winner:","${election.winner}"\r\n`;
                    csvContent += `"Total Voters:","${election.total_voters}"\r\n`;
                    csvContent += `"Total Rounds:","${election.total_rounds}"\r\n\r\n`;

                    election.rounds.forEach(round => {
                        csvContent += `"Round ${round.round}"\r\n`;
                        csvContent += `"Candidate","Votes"\r\n`;
                        Object.entries(round.vote_counts).forEach(([name, votes]) => {
                            csvContent += `"${name}","${votes}"\r\n`;
                        });
                        csvContent += `"Eliminated:","${round.eliminated || 'None (Final Round)'}"\r\n\r\n`;
                    });
                }
            }
            else if (election.is_block) {
                csvContent += `"Winners (${election.number_of_seats} seats):","${(election.winners || []).join(', ')}"\r\n`;
                csvContent += `"Total Voters:","${election.total_voters}"\r\n\r\n`;
                csvContent += "Candidate Name,Votes,Result\r\n";
                (election.candidates || []).forEach(candidate => {
                    const name = `"${(candidate.name || '').replace(/"/g, '""')}"`;
                    const votes = `"${(candidate.votes || 0).toString()}"`;
                    const result = candidate.is_winner ? '"Winner"' : '""';
                    csvContent += `${name},${votes},${result}\r\n`;
                });
            }
            else {
                csvContent += "Entry Number,Candidate Name,Votes\r\n";
                (election.candidates || []).forEach(candidate => {
                    const entry = `"${(candidate.entry_number || '').toString().replace(/"/g, '""')}"`;
                    const name = `"${(candidate.name || '').replace(/"/g, '""')}"`;
                    const votes = `"${(candidate.votes || 0).toString()}"`;
                    csvContent += `${entry},${name},${votes}\r\n`;
                });
            }
            if (index < Object.entries(votesData).length - 1) {
                csvContent += "\r\n\r\n";
            }
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'election_results.csv');

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
                'https://5000-01kk9e5t37w5v48yspx6hdpj3s.cloudspaces.litng.ai/mix',
                {},
                { headers: { authorization: `Bearer ${token}` } }
            );
            alert('Votes decrypted successfully.');
            await handleGetDcrpVotes();
        } catch (err) {
            alert(`Failed to decrypt votes: ${err.message}`);
            setLoading(false);
        }
    };
    const handleGetDcrpVotes = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('access_token');
            const response = await axios.get(
                'https://5000-01kk9e5t37w5v48yspx6hdpj3s.cloudspaces.litng.ai/getVotes',
                { headers: { authorization: `Bearer ${token}` } }
            );
            const votesData = response.data || {};
    
            // For block elections, aggregate combo votes into individual candidate counts
            const processedVotes = {};
            Object.entries(votesData).forEach(([electionId, election]) => {
                if (election.election_type === 'block' && Array.isArray(election.candidates)) {
                    const number_of_seats = election.candidates[0]?.number_of_preferences ||
                        (election.candidates[0]?.name?.split(',').filter(n => n !== 'NOTA' && n !== 'NAFS').length) || 1;
                    const individualCounts = {};
                    election.candidates.forEach(combo => {
                        const names = (combo.name || '').split(',');
                        names.forEach(name => {
                            if (name && name !== 'NOTA' && name !== 'NAFS') {
                                individualCounts[name] = (individualCounts[name] || 0) + (combo.votes || 0);
                            }
                        });
                    });
                    const sorted = Object.entries(individualCounts).sort((a, b) => b[1] - a[1]);
                    // number_of_seats from first combo that has the field, or from election
                    const seats = election.candidates[0]?.number_of_preferences || 3;
                    const winners = sorted.slice(0, seats).map(([name]) => name);
                    const totalVoters = Math.max(...election.candidates.map(c => c.votes || 0)) > 0
                        ? election.candidates.reduce((sum, c) => sum + (c.votes || 0), 0) / seats
                        : 0;
                    processedVotes[electionId] = {
                        ...election,
                        is_block: true,
                        number_of_seats: seats,
                        total_voters: Math.round(totalVoters),
                        winners,
                        candidates: sorted.map(([name, votes]) => ({
                            name,
                            votes,
                            is_winner: winners.includes(name)
                        }))
                    };
                } else {
                    processedVotes[electionId] = election;
                }
            });
            setDecryptedVotes(processedVotes);
            setElectionIds(Object.entries(processedVotes).map(([id, data]) => ({
                id: id.toString(),
                name: data.election_name || `Election ${id}`
            })));
            setSelectedElection(Object.keys(processedVotes)[0] || '');
            localStorage.setItem("decryptedVotes", JSON.stringify(processedVotes));
            setTimeout(() => {
                downloadCSV(processedVotes);
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
            {selectedElection && selectedElectionData && !selectedElectionData.is_preferential &&
                Array.isArray(selectedElectionData.candidates) && (
                    <div className="votes-table-wrapper">
                        <h3 className="table-header">
                            {selectedElectionData.election_name || `Election ${selectedElection}`} Results
                            {selectedElectionData.is_block ? ` (Block Voting — ${selectedElectionData.number_of_seats} seats)` : ''}
                        </h3>
                        {selectedElectionData.is_block && (
                            <p><strong>🏆 Winners:</strong> {(selectedElectionData.winners || []).join(', ')} &nbsp;|&nbsp; <strong>Total Voters:</strong> {selectedElectionData.total_voters}</p>
                        )}
                        <table className="votes-table">
                            <thead>
                                <tr>
                                    <th>Candidate Name</th>
                                    <th>Vote Count</th>
                                    {selectedElectionData.is_block && <th>Result</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedElectionData.candidates.map((vote, index) => (
                                    <tr key={`${selectedElection}-${index}`} style={vote.is_winner ? { backgroundColor: '#d4edda', fontWeight: 'bold' } : {}}>
                                        <td>{vote.name}</td>
                                        <td>{vote.votes}</td>
                                        {selectedElectionData.is_block && <td>{vote.is_winner ? '🏆 Winner' : ''}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            {selectedElection && selectedElectionData && selectedElectionData.is_preferential && (
                <div className="votes-table-wrapper">
                    <h3 className="table-header">
                        {selectedElectionData.election_name || `Election ${selectedElection}`} Results (Preferential)
                    </h3>
                    {selectedElectionData.error ? (
                        <p style={{ color: 'red' }}>{selectedElectionData.error}</p>
                    ) : (
                        <>
                            <p><strong>Winner:</strong> {selectedElectionData.winner}</p>
                            <p><strong>Total Voters:</strong> {selectedElectionData.total_voters}</p>
                            <p><strong>Total Rounds:</strong> {selectedElectionData.total_rounds}</p>

                            {selectedElectionData.rounds.map((round) => (
                                <div key={round.round} style={{ marginTop: '1rem' }}>
                                    <h4>Round {round.round}</h4>
                                    <table className="votes-table">
                                        <thead>
                                            <tr>
                                                <th>Candidate</th>
                                                <th>Votes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(round.vote_counts).map(([name, votes]) => (
                                                <tr key={name}>
                                                    <td>{name}</td>
                                                    <td>{votes}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p><strong>Eliminated:</strong> {round.eliminated || 'None (Final Round)'}</p>
                                </div>
                            ))}
                        </>
                    )}
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


