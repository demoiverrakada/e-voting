import React, { useState, useEffect } from 'react';
import './App.css'; // Import your CSS file
import QRCode from 'react-qr-code';

const App = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load count from JSON file
    fetch('/count.json')
      .then(response => response.json())
      .then(data => {
        setCount(data.count);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading count:', error);
        setLoading(false);
      });
  }, []);

  const handleOptionChange = (value) => {
    setSelectedOption(value); // Keep the value as a number
  };

  const generateQRCodeValue = () => {
    return selectedOption !== null ? selectedOption.toString() : ''; // Convert to string for QRCode
  };

  const handlePrint = () => {
    window.print();
    setSelectedOption(null); // Reset selected option after printing
  };

  return (
    <div className="app">
      <h1>Select the number corresponding to your preferred candidate</h1>
      {loading ? (
        <p>Loading...</p>
      ) : count !== null ? (
        <form>
          {Array.from({ length: count }, (_, index) => (
            <button
              className={`option ${selectedOption === index ? 'selectedOption' : ''}`}
              key={index}
              type="button"
              onClick={() => handleOptionChange(index)}
            >
              {index}
            </button>
          ))}
        </form>
      ) : (
        <p>Error loading count.</p>
      )}
      {selectedOption !== null && (
        <div className="qrCodeContainer">
          <div>
            <QRCode value={generateQRCodeValue()} size={120} />
          </div>
          <p>Candidate Number:{selectedOption}</p>
          <button onClick={handlePrint}>Print</button>
        </div>
      )}
      {selectedOption !== null && (
        <div className="qrCodeContainerPrint">
          <p>Candidate Number:{selectedOption}</p>
          <QRCode value={generateQRCodeValue()} size={120} />
        </div>
      )}
    </div>
  );
};

export default App;

