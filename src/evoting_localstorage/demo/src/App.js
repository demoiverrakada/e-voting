import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

// Import icons
import BallotGeneration from './icons/ballot-generator.png';
import BallotPickup from './icons/ballots.png';
import VoteCasting from './icons/ballotbox.png';
import ReceiptScanning from './icons/receipt.png';
import VoteProcessing from './icons/bb.png';
import BallotAudit from './icons/auditors-phone.png';
import ReceiptVerf from './icons/voter-phone.png';
import DercyptVerf from './icons/univauditors-phone.png';
import VVPATVerf from './icons/vvpatauditors.png';
import PO from './icons/po.png';
import Voter from './icons/voter.png';
import VVPAT from './icons/vvpats.png';
import Ballots from './icons/ballots.png'
import Adversary from './icons/adversary.jpeg'
const Dashboard = () => {
  const [status5000, setStatus5000] = useState({
    generate: 'Pending',
    upload: 'Pending',
    decryption: 'Pending',
  });

  const [status7000, setStatus7000] = useState({
    audit: 'Pending',
    voterverf: 'Pending',
    decryption_sm: 'Pending',
    vvpatverf: 'Pending',
  });

  const [selectedStep, setSelectedStep] = useState(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [res5000, res7000] = await Promise.all([
          axios.get('/api/status'),
          axios.get('/verif/api/status'),
        ]);

        setStatus5000(res5000.data);
        setStatus7000(res7000.data);
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleStepClick = (step) => {
    setSelectedStep(step);
  
    // Define a mapping for user-friendly names
    const stepNames = {
      generate: 'Ballot Generation',
      upload: 'Vote Upload',
      decryption: 'Decryption of Encrypted Votes',
      audit: 'Ballot Audit',
      voterverf: 'Voter Verification',
      decryption_sm: 'Decryption Verification',
      decryption_rsm: 'Decryption Verification',
      vvpatverf: 'VVPAT Verification',
    };
  
    // Determine which server the step belongs to
    const serverStatus =
      step === 'audit' ||
      step === 'voterverf' ||
      step === 'decryption_sm' ||
      step==='decryption_rsm'||
      step === 'vvpatverf'
        ? status7000
        : status5000;
  
    // Special handling for "decryption_sm" (Decryption Verification)
    if (step === 'decryption_sm') {
      const decryptionSmStatus = serverStatus.decryption_sm;
      const decryptionRsmStatus = serverStatus.decryption_rsm;
  
      // If either is pending, set the response as pending
      if (decryptionSmStatus === 'pending' || decryptionRsmStatus === 'pending') {
        setResponse(`${stepNames[step]}: pending`);
        return;
      }
  
      // Otherwise, display both statuses as success or failed
      setResponse(
        `${stepNames[step]}: 
        Decryption SM - ${decryptionSmStatus}, 
        Decryption RSM - ${decryptionRsmStatus}`
      );
      return;
    }
  
    // Display the relevant result using the friendly name for other steps
    setResponse(`${stepNames[step]}: ${serverStatus[step]}`);
  };
  

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Election Dashboard</h1>
      </div>
    
      <div className="content-area">
        <div className="main-sections">
          {/* Untrusted Section */}
          <div className="section untrusted-section">
            <div className="section-header">Untrusted Election Components</div>
            <img src={Adversary} className='adv-image-lg'/>
            <div className="steps-grid">
              {/* Ballot Generation */}
              <div
                className="step-card"
                onClick={() => handleStepClick('generate')}
              >
                <div className="images">
                  <img src={Ballots} alt="Ballots" className="image-lg" />
                  <img src={BallotGeneration} alt="Ballot Generation" className="image-lg" />
                </div>
                <div className="step-title">Ballot Generation</div>
                <button className="step-button">Check Status</button>
              </div>

              {/* Vote Upload */}
              <div
                className="step-card"
                onClick={() => handleStepClick('upload')}
              >
                <div className="images">
                  <img src ={VVPAT} alt="VVPAT" className='image-lg'/>
                  <img src={VoteCasting} alt="Vote Upload" className="image-lg" />
                  <img src ={ReceiptScanning} alt="Receipt Scan" className='image-lg'/>
                </div>
                <div className="step-title">Vote Upload</div>
                <button className="step-button">Check Status</button>
              </div>

              {/* Mix & Decrypt */}
              <div
                className="step-card"
                onClick={() => handleStepClick('decryption')}
              >
                <div className="images">
                  <img src={VoteProcessing} alt="Mix & Decrypt" className="image-lg" />
                </div>
                <div className="step-title">Decryption of Encrypted Votes</div>
                <button className="step-button">Check Status</button>
              </div>
            </div>
          </div>

          {/* Trusted Section */}
          <div className="section trusted-section">
            <div className="section-header">Trusted Verification Components</div>
            <div className="steps-grid">
              {/* Audit */}
              <div
                className="step-card"
                onClick={() => handleStepClick('audit')}
              >
                <div className="images">
                  <img src ={Ballots} alt ="ballots" className="image-lg"/>
                  <img src={BallotAudit} alt="Audit" className="image-lg" />
                </div>
                <div className="step-title">Ballot Audit</div>
                <button className="step-button">Check Status</button>
              </div>

              {/* Voter Verification */}
              <div
                className="step-card"
                onClick={() => handleStepClick('voterverf')}
              >
                <div className="images">
                  <img src={ReceiptScanning} alt="receipt" className='image-lg'/>
                  <img src={ReceiptVerf} alt="Voter Verification" className="image-lg" />
                </div>
                <div className="step-title">Voter Verification</div>
                <button className="step-button">Check Status</button>
              </div>

              {/* Decryption Verification */}
              <div
                className="step-card"
                onClick={() => handleStepClick('decryption_sm')}
              >
                <div className="images">
                <img src={VoteProcessing} alt="Mix & Decrypt" className="image-lg" />
                  <img src={DercyptVerf} alt="Decryption Verification" className="image-lg" />
                </div>
                <div className="step-title">Decryption Verification</div>
                <button className="step-button">Check Status</button>
              </div>

              {/* VVPAT Verification */}
              <div
                className="step-card"
                onClick={() => handleStepClick('vvpatverf')}
              >
                <div className="images">
                <img src={VVPAT} alt="VVPAT" className="image-lg" />
                  <img src={VVPATVerf} alt="VVPAT Verification" className="image-lg" />
                </div>
                <div className="step-title">VVPAT Verification</div>
                <button className="step-button">Check Status</button>
              </div>
            </div>
          </div>
        </div>

        {/* Response Area */}
        {selectedStep && (
          <div className="response-area">
            <h3>Selected Step Result:</h3>
            {response}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
