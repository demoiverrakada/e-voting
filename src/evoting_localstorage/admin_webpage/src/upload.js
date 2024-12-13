import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ReactSession } from 'react-client-session';
import './App.css';

function Upload() {

    const navigate = useNavigate();

    // check if access token exists
    useEffect(() => {
        const token = ReactSession.get('access_token');
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [navigate]);
    
    

    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    // const navigate = useNavigate();

    const handleFileChange = (event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile && uploadedFile.type === 'application/json') {
        setFile(uploadedFile);
        setMessage('File selected: ' + uploadedFile.name);
        } else {
        setMessage('Please upload a valid JSON file.');
        setFile(null);
        }
    };


    const uploadFile = async (endpoint) => {
        if (!file) {
            setMessage('No file selected.');
            return;
        }
    
        const reader = new FileReader();
    
        reader.onload = async (e) => {
            try {
                // Parse the JSON file content
                const jsonData = JSON.parse(e.target.result);
    
                // Retrieve the access token from session storage
                const token = ReactSession.get('access_token');
    
                // Send the parsed JSON data to the server
                const response = await axios.post(endpoint, jsonData, {
                    headers: {
                        authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
    
                setMessage(`Upload successful: ${response.data.message || 'Success'}`);
            } catch (error) {
                setMessage(
                    `Upload failed: ${
                        error.response?.data?.message || error.message || 'Invalid JSON format or unknown error.'
                    }`
                );
            }
        };
    
        // Read the file content as text
        reader.readAsText(file);
    };

    const handleUpload = () => uploadFile('https://2a61-223-229-214-187.ngrok-free.app/upload'); // Default upload
    const handleUploadCandidate = () => uploadFile('https://2a61-223-229-214-187.ngrok-free.app/upload_candidate');
    const handleUploadPO = () => uploadFile('https://2a61-223-229-214-187.ngrok-free.app/upload_PO');
    const handleUploadVoters = () => uploadFile('https://2a61-223-229-214-187.ngrok-free.app/upload_voters');

    const GoBack = async () => {
        navigate('/opts', { replace: true });
    };

    return (
        
        <div className='App'>
            <br/>
            <h1>Upload JSON File</h1>
            <br/>
            <input type="file" accept=".json" onChange={handleFileChange} />
            {message && <p>{message}</p>}
            <button type="submit" onClick={handleUpload}>Upload</button>
            <button type="submit" onClick={handleUploadCandidate}>Upload Candidate</button>
            <button type="submit" onClick={handleUploadPO}>Upload PO</button>
            <button type="submit" onClick={handleUploadVoters}>Upload Voters</button>
           
            <br/>
            <br/>
            <br/>

            <button onClick={GoBack} >Back</button>
            
        </div>
    );
}

export default Upload;
