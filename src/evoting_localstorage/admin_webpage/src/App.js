import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OptionsPage from './pages/Options';
import DecryptedVotes from './pages/DecryptedVotes';
import Setup from './pages/Setup'; 
import GenerateBallot from './pages/GenerateBallot'; 
import UploadDefault from './pages/UploadDefault';
import UploadCandidate from './pages/UploadCandidate';
import UploadPO from './pages/UploadPO';
import UploadVoters from './pages/UploadVoter';
import FinalVotes from './pages/FinalVotes';
import ChangePasswordPage from './pages/ChangePassword';
import UploadBMDKeys from './pages/UploadBMDKeys';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/options" element={<OptionsPage />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/generate_ballots" element={<GenerateBallot />} />
        <Route path = "/decrypted_votes" element = {<DecryptedVotes />}/>
        <Route path="/upload_votes" element={<UploadDefault />} />
        <Route path="/upload_candidate" element={<UploadCandidate />} />
        <Route path="/upload_po" element={<UploadPO />} />
        <Route path="/upload_voters" element={<UploadVoters />} />
        <Route path="/final_votes" element={<FinalVotes />} />
        <Route path="/change_password" element={<ChangePasswordPage />} />
        <Route path="/upload_bmd_keys" element={<UploadBMDKeys />} />
      </Routes>
    </Router>
  );
}

export default App;
