import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/getVotes")
      .then((response) => setUsers(response.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="w-100 vh-100 d-flex justify-content-center align-items-center">
      <div className="w-50">
        {users ? (
          <table className="table">
            <thead>
              <tr>
                <th>Voter id</th>
                <th>Booth Number</th>
                <th>Encrypted Vote</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.voter_id}</td>
                  <td>{user.booth_num}</td>
                  <td>{user.commitment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center">
            <h2>Under Construction</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
