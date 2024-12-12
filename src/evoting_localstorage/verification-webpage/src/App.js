
// File: src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import logo from './logo.svg';

// Pages for endpoints
import GetPublicKeys from "./pages/GetPublicKeys.js";
import ReverseVerifierSignature from "./pages/ReverseVerifierSignature.js";
import ForwardVerifierSignature from "./pages/ForwardVerifierSignature.js";
import VerifySetMembership from "./pages/VerifySetMembership.js";
import VerifyReverseSetMembership from "./pages/VerifyReverseSetMembership.js";

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
            <Link to="/pk" className="btn">
              Get Public Keys
            </Link>
            <Link to="/genrsig" className="btn">
              Reverse set membership Verifier Signature
            </Link>
            <Link to="/gensig" className="btn">
              Set membership Verifier Signature
            </Link>
            <Link to="/pf_zksm_verf" className="btn">
              Verify Set Membership
            </Link>
            <Link to="/pf_zkrsm_verf" className="btn">
              Verify Reverse Set Membership
            </Link>
          </div>
        </main>

        <Routes>
          <Route path="/pk" element={<GetPublicKeys />} />
          <Route
            path="/genrsig"
            element={<ReverseVerifierSignature />}
          />
          <Route
            path="/gensig"
            element={<ForwardVerifierSignature />}
          />
          <Route
            path="/pf_zksm_verf"
            element={<VerifySetMembership />}
          />
          <Route
            path="/pf_zkrsm_verf"
            element={<VerifyReverseSetMembership />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

