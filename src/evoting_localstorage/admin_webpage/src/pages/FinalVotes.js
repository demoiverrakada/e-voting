import React, { useEffect, useState } from "react";

function FinalVotes() {
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    const storedVotes = localStorage.getItem("decryptedVotes");
    if (storedVotes) {
      setVotes(JSON.parse(storedVotes));
    }
  }, []);

  return (
    <div
      className="final-votes-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      }}
    >
      <div
        className="final-votes-card"
        style={{
          background: "#ffffff",
          padding: "2rem",
          borderRadius: "15px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
          width: "80%",
          maxWidth: "1200px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            marginBottom: "1.5rem",
            fontSize: "2.5rem",
            fontFamily: "'Poppins', sans-serif",
            color: "#333",
            textTransform: "uppercase",
          }}
        >
          Final Votes
        </h1>
        {votes.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "1.5rem",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "1rem",
                      backgroundColor: "#333",
                      color: "#fff",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    Candidates
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      backgroundColor: "#333",
                      color: "#fff",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    Votes
                  </th>
                </tr>
              </thead>
              <tbody>
                {votes.map((vote, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                    }}
                  >
                    <td
                      style={{
                        padding: "1.2rem",
                        border: "1px solid #ddd",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#555",
                      }}
                    >
                      {vote.name}
                    </td>
                    <td
                      style={{
                        padding: "1.2rem",
                        border: "1px solid #ddd",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: "#555",
                      }}
                    >
                      {vote.votes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <h2 style={{ color: "#666" }}>Under Construction</h2>
            <div
              className="spinner-border"
              role="status"
              style={{
                width: "3rem",
                height: "3rem",
                marginTop: "1rem",
                borderWidth: "0.3rem",
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinalVotes;
