import React, { useEffect, useState } from "react";

function FinalVotes() {
    const [votesData, setVotesData] = useState({});
    const [selectedElection, setSelectedElection] = useState('');
    useEffect(() => {
        const storedVotes = localStorage.getItem("decryptedVotes");
        if (storedVotes) {
            const parsedVotes = JSON.parse(storedVotes);
            setVotesData(parsedVotes);
            setSelectedElection(Object.keys(parsedVotes)[0]);
        }
    }, []);
    const handleElectionChange = (event) => {
        setSelectedElection(event.target.value);
    };
    const selectedElectionData = votesData[selectedElection] || {};
    return (
        <div className="final-votes-container" style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        }}>
            <div className="final-votes-card" style={{
                background: "#ffffff",
                padding: "2rem",
                borderRadius: "15px",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
                width: "80%",
                maxWidth: "1200px",
                textAlign: "center",
            }}>
                <h1 style={{
                    marginBottom: "1.5rem",
                    fontSize: "2.5rem",
                    fontFamily: "'Poppins', sans-serif",
                    color: "#333",
                    textTransform: "uppercase",
                }}>Final Votes</h1>

                {Object.keys(votesData).length > 0 ? (
                    <>
                        {/* Election Selector */}
                        <div style={{ marginBottom: "1rem" }}>
                            <label htmlFor="election-select" style={{ marginRight: "1rem", fontSize: "1.2rem" }}>
                                Select Election:
                            </label>
                            <select
                                id="election-select"
                                value={selectedElection}
                                onChange={handleElectionChange}
                                style={{ padding: "0.5rem", fontSize: "1.2rem", borderRadius: "5px" }}
                            >
                                {Object.keys(votesData).map((id) => (
                                    <option key={id} value={id}>
                                        {votesData[id].election_name || `Election ${id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {!selectedElectionData.is_preferential && Array.isArray(selectedElectionData.candidates) && (
                            <div style={{ overflowX: "auto" }}>
                                {selectedElectionData.is_block && (
                                    <div style={{
                                        margin: "1rem auto",
                                        padding: "1rem 2rem",
                                        background: "linear-gradient(135deg, #4facfe, #00f2fe)",
                                        borderRadius: "10px",
                                        display: "inline-block",
                                        marginBottom: "1.5rem"
                                    }}>
                                        <h2 style={{ color: "#fff", margin: 0 }}>
                                            🏆 Winners ({selectedElectionData.number_of_seats} seats): {selectedElectionData.winners?.join(", ")}
                                        </h2>
                                        <p style={{ color: "#fff", margin: "0.5rem 0 0" }}>
                                            Total Voters: {selectedElectionData.total_voters}
                                        </p>
                                    </div>
                                )}
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.5rem" }}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>Candidate Name</th>
                                            {!selectedElectionData.is_block && <th style={thStyle}>Entry Number</th>}
                                            <th style={thStyle}>Votes</th>
                                            {selectedElectionData.is_block && <th style={thStyle}>Result</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedElectionData.candidates.map((candidate, index) => (
                                            <tr key={index} style={{
                                                backgroundColor: candidate.is_winner ? "#e0ffe0" : index % 2 === 0 ? "#f9f9f9" : "#ffffff"
                                            }}>
                                                <td style={tdStyle}>{candidate.name}</td>
                                                {!selectedElectionData.is_block && <td style={tdStyle}>{candidate.entry_number}</td>}
                                                <td style={tdStyle}>{candidate.votes}</td>
                                                {selectedElectionData.is_block && (
                                                    <td style={tdStyle}>{candidate.is_winner ? "🏆 Winner" : ""}</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {selectedElectionData.is_preferential && (
                            <div>
                                {selectedElectionData.error ? (
                                    <p style={{ color: 'red' }}>{selectedElectionData.error}</p>
                                ) : (
                                    <>
                                        <div style={{
                                            margin: "1rem auto",
                                            padding: "1rem 2rem",
                                            background: "linear-gradient(135deg, #4facfe, #00f2fe)",
                                            borderRadius: "10px",
                                            display: "inline-block"
                                        }}>
                                            <h2 style={{ color: "#fff", margin: 0 }}>
                                                🏆 Winner: {selectedElectionData.winner}
                                            </h2>
                                        </div>

                                        <p style={{ fontSize: "1.2rem" }}>
                                            <strong>Total Voters:</strong> {selectedElectionData.total_voters} &nbsp;|&nbsp;
                                            <strong>Total Rounds:</strong> {selectedElectionData.total_rounds}
                                        </p>
                                        {selectedElectionData.rounds.map((round) => (
                                            <div key={round.round} style={{ marginTop: "1.5rem" }}>
                                                <h3 style={{
                                                    background: "#333",
                                                    color: "#fff",
                                                    padding: "0.5rem 1rem",
                                                    borderRadius: "5px"
                                                }}>
                                                    Round {round.round}
                                                    {round.eliminated
                                                        ? ` — Eliminated: ${round.eliminated}`
                                                        : " — Final Round"}
                                                </h3>
                                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.2rem" }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={thStyle}>Candidate</th>
                                                            <th style={thStyle}>Votes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(round.vote_counts).map(([name, votes], index) => (
                                                            <tr key={name} style={{
                                                                backgroundColor: name === round.eliminated
                                                                    ? "#ffe0e0"  // highlight eliminated candidate in red
                                                                    : name === selectedElectionData.winner && !round.eliminated
                                                                        ? "#e0ffe0"  // highlight winner in green in final round
                                                                        : index % 2 === 0 ? "#f9f9f9" : "#ffffff"
                                                            }}>
                                                                <td style={tdStyle}>{name}</td>
                                                                <td style={tdStyle}>{votes}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div>
                        <h2 style={{ color: "#666" }}>No vote data available</h2>
                    </div>
                )}
            </div>
        </div>
    );
}

// Shared table styles
const thStyle = {
    padding: "1rem",
    backgroundColor: "#333",
    color: "#fff",
    fontWeight: "bold",
    textTransform: "uppercase",
};
const tdStyle = {
    padding: "1.2rem",
    border: "1px solid #ddd",
    textAlign: "center",
    fontWeight: "bold",
    color: "#555",
};
export default FinalVotes;
