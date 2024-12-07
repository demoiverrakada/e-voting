import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css'; // Import your CSS file

const Print = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [hashedCommitments,setHashedCommitments]=useState(null);
  const [selectedCommitment, setSelectedCommitment] = useState(null);

  useEffect(() => {
    fetch('https://617b-103-27-8-104.ngrok-free.app/receipts/check')
      .then(response => response.json())
      .then(data => {
        setCommitments(data.commitments);
        setHashedCommitments(data.hashedCommitments)
        sendRenderResponse();
      })
      .catch(error => {
        console.error('Fetch error:', error);
      });
  }, []);


  const sendRenderResponse = async () => {
    try {
      await fetch('https://617b-103-27-8-104.ngrok-free.app/receipt/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Site has been rendered' }),
      });
  
      console.log('Render response sent successfully.');
    } catch (error) {
      console.error('Error in fetch:', error);
    }
  };
  useEffect(() => {
    const handleAfterPrint = () => {
      // Actions to perform after printing (close the print dialog)
      setCommitments([]);
      setHashedCommitments(null);
      setSelectedCommitment(null);
      setSelectedOption(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      // Cleanup the event listener when the component is unmounted
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handleOptionChange = (event) => {
    const selectedValue = event.target.value;

    // Find the commitment corresponding to the selected option
    const commitmentForSelectedOption = commitments[selectedValue];

    // Set the selected option and commitment
    setSelectedOption(selectedValue);
    setSelectedCommitment(commitmentForSelectedOption);
  };

  const handlePrint = () => {
    window.print();
  };
  const generateQRCodeValue = () => {
    // Combine hashedCommitments and selectedCommitment into a single array
    const qrCodeData = [hashedCommitments, selectedCommitment];

    // Convert the array to a JSON string
    return JSON.stringify(qrCodeData);
  };
  return (
    <div className="app">
      <h1>Select an Option</h1>

      {selectedOption ? (
        <div className="qrCodeContainer">
          <QRCode value={generateQRCodeValue()} />
          <p>Option: {selectedOption}</p>
          <button onClick={handlePrint}>Print Receipt</button>
        </div>
      ) : (
        <form>
          {commitments.map((commitment, index) => (
            <label key={index}>
              <input
                type="radio"
                name="option"
                value={index}
                onChange={handleOptionChange}
              />
              {index}
            </label>
          ))}
        </form>
      )}
    </div>
  );
};

export default Print;