
// File: src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import logo from './logo.svg';

// Pages for endpoints
import VerifySetMembership from "./pages/VerifySetMembership.js";
import VerifyReverseSetMembership from "./pages/VerifyReverseSetMembership.js";
import BallotAudit from "./pages/BallotAudit.js";
import VoterVerificationApp from "./pages/VoterVerification.js";
import VerifyVVPAT from "./pages/VVPATVerification.js";
const App = () => {
  return (
    <Router>
      <div className="app-container">
        <header className="header">
          <h1>Verification Webpage</h1>
        </header>
        <main className="main-content">
          <h2>Select an Endpoint</h2>
          <div className="button-container">
            <Link to="/pf_zksm_verf" className="btn">
              Verify Encrypted Votes
            </Link>
            <Link to="/pf_zkrsm_verf" className="btn">
              Verify Decrypted Votes
            </Link>
            <Link to ="/ballotaudit" className="btn">
              Generate Ballot Audit app
            </Link>
            {/* <Link to ="/voterverification" className="btn">
              Generate Voter Verification app
            </Link> */}
            <Link to ="/verifyvvpat" className="btn">
              Verify VVPAT
            </Link>
          </div>
        </main>

        <Routes>
          <Route
            path="/pf_zksm_verf"
            element={<VerifySetMembership />}
          />
          <Route
            path="/pf_zkrsm_verf"
            element={<VerifyReverseSetMembership />}
          />
          <Route
            path="/ballotaudit"
            element={<BallotAudit />}
          />
          {/* <Route
            path="/voterverification"
            element={<VoterVerificationApp />}
          /> */}
          <Route
            path="/verifyvvpat"
            element={<VerifyVVPAT />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

