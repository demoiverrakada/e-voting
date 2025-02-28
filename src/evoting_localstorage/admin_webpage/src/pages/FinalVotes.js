import React, { useEffect, useState } from "react";

function FinalVotes() {
  const [votesData, setVotesData] = useState({});
  const [selectedElection, setSelectedElection] = useState('');

  useEffect(() => {
    const storedVotes = localStorage.getItem("decryptedVotes");
    if (storedVotes) {
      const parsedVotes = JSON.parse(storedVotes);
      setVotesData(parsedVotes);
      setSelectedElection(Object.keys(parsedVotes)[0]); // Select the first election by default
    }
  }, []);

  const handleElectionChange = (event) => {
    setSelectedElection(event.target.value);
  };

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
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="election-select" style={{ marginRight: "1rem", fontSize: "1.2rem" }}>Select Election: </label>
              <select 
                id="election-select" 
                value={selectedElection} 
                onChange={handleElectionChange}
                style={{ padding: "0.5rem", fontSize: "1.2rem", borderRadius: "5px" }}
              >
                {Object.keys(votesData).map((id) => (
                  <option key={id} value={id}>Election {id}</option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.5rem" }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: "1rem",
                      backgroundColor: "#333",
                      color: "#fff",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}>Candidate Index</th>
                    <th style={{
                      padding: "1rem",
                      backgroundColor: "#333",
                      color: "#fff",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}>Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {votesData[selectedElection].msgs_out_dec.map((vote, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                      <td style={{
                        padding: "1.2rem",
                        border: "1px solid #ddd",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#555",
                      }}>{vote[0]}</td>
                      <td style={{
                        padding: "1.2rem",
                        border: "1px solid #ddd",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#555",
                      }}>{vote[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

export default FinalVotes;
