import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/bulletin")
      .then((response) => setUsers(response.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div
      className="w-100 vh-100 d-flex justify-content-center align-items-center"
      style={{ background: "linear-gradient(to right, #4facfe, #00f2fe)" }}
    >
      <div className="card w-75 p-4" style={{ boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)" }}>
        <h1 className="text-center mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
          PUBLIC BULLETIN BOARD
        </h1>
        {users ? (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Voter ID</th>
                <th>Booth Number</th>
                <th>Encrypted Vote</th>
                <th>Preference Number Selected</th>
                <th>Hash Value</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={{ cursor: "pointer" }}>
                  <td>{user.voter_id}</td>
                  <td>{user.booth_num}</td>
                  <td>{user.commitment}</td>
                  <td>{user.pref_id}</td>
                  <td>{user.hash_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center">
            <h2 style={{ color: "#ffffff" }}>Under Construction</h2>
            <div
              className="spinner-border text-light mt-3"
              role="status"
              style={{ width: "3rem", height: "3rem" }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

