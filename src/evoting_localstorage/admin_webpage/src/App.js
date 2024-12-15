import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OptionsPage from './pages/Options';
import DecryptedVotes from './pages/DecryptedVotes';
import PublicKeys from './pages/PublicKeys';
import EvotingApp from './pages/EvotingApp';
import Setup from './pages/Setup'; 
import GenerateBallot from './pages/GenerateBallot'; 
import UploadDefault from './pages/UploadDefault';
import UploadCandidate from './pages/UploadCandidate';
import UploadPO from './pages/UploadPO';
import UploadVoters from './pages/UploadVoter';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/options" element={<OptionsPage />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/generate_ballots" element={<GenerateBallot />} />
        <Route path = "/decrypted_votes" element = {<DecryptedVotes />}/>
        <Route path = "/public_keys" element = {<PublicKeys />}/>
        <Route path = "/evoting_app" element = {<EvotingApp />}/>
        <Route path="/upload_votes" element={<UploadDefault />} />
        <Route path="/upload_candidate" element={<UploadCandidate />} />
        <Route path="/upload_po" element={<UploadPO />} />
        <Route path="/upload_voters" element={<UploadVoters />} />
      </Routes>
    </Router>
  );
}

export default App;
