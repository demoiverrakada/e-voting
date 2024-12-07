import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ReactSession } from 'react-client-session';
import './App.css';

function Upload() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();

    // check if access token exists
    useEffect(() => {
        const token = ReactSession.get('access_token');
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/json') {
            setFile(selectedFile);
        } else {
            setMessage('Please select a valid JSON file.');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }
    
        //console.log("check 1");
    
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileContent = event.target.result; // File content as text
                const jsonData = JSON.parse(fileContent); // Parse the JSON content
    
                const token = ReactSession.get('access_token');
                const response = await axios.post(
                    'http://localhost:5000/upload',
                    jsonData,  // Send parsed JSON data directly
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'  // Important for sending JSON
                        },
                    }
                );
                
                console.log('Protected data:', response.data);
                setMessage('File uploaded successfully!');
            } catch (error) {
                console.error('Upload error:', error);
                setMessage('Failed to upload the file.');
            }
        };
    
        // Read the file content
        reader.readAsText(file);  // Assumes 'file' is a valid file object
    };

    const handleUploadCandidate = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }
    
        //console.log("check 1");
    
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileContent = event.target.result; // File content as text
                const jsonData = JSON.parse(fileContent); // Parse the JSON content
    
                const token = ReactSession.get('access_token');
                const response = await axios.post(
                    'http://localhost:5000/upload_candidate',
                    jsonData,  // Send parsed JSON data directly
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'  // Important for sending JSON
                        },
                    }
                );
                
                console.log('Protected data:', response.data);
                setMessage('File uploaded successfully!');
            } catch (error) {
                console.error('Upload error:', error);
                setMessage('Failed to upload the file.');
            }
        };
    
        // Read the file content
        reader.readAsText(file);  // Assumes 'file' is a valid file object
    };

    const handleUploadPO = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }
    
        //console.log("check 1");
    
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileContent = event.target.result; // File content as text
                const jsonData = JSON.parse(fileContent); // Parse the JSON content
    
                const token = ReactSession.get('access_token');
                const response = await axios.post(
                    'http://localhost:5000/upload_PO',
                    jsonData,  // Send parsed JSON data directly
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'  // Important for sending JSON
                        },
                    }
                );
                
                console.log('Protected data:', response.data);
                setMessage('File uploaded successfully!');
            } catch (error) {
                console.error('Upload error:', error);
                setMessage('Failed to upload the file.');
            }
        };
    
        // Read the file content
        reader.readAsText(file);  // Assumes 'file' is a valid file object
    };

    const handleUploadVoters = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }
    
        //console.log("check 1");
    
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const fileContent = event.target.result; // File content as text
                const jsonData = JSON.parse(fileContent); // Parse the JSON content
    
                const token = ReactSession.get('access_token');
                const response = await axios.post(
                    'http://localhost:5000/upload_voters',
                    jsonData,  // Send parsed JSON data directly
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'  // Important for sending JSON
                        },
                    }
                );
                
                console.log('Protected data:', response.data);
                setMessage('File uploaded successfully!');
            } catch (error) {
                console.error('Upload error:', error);
                setMessage('Failed to upload the file.');
            }
        };
    
        // Read the file content
        reader.readAsText(file);  // Assumes 'file' is a valid file object
    };



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
