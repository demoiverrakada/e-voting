const express = require('express');
const jwt = require('jsonwebtoken');
const { jwtkey } = require('../keys');
const router = express.Router();
const requireAuth = require('../middelware/requireToken');
const { PO, Votes, Admin, Candidate, Voter, Receipt, Bulletin,Keys,Dec,Verf,VerfP} = require('../models/User');
const cors = require('cors');
const { spawnSync } = require('child_process');
const fs = require('fs');
const { join } = require('path');
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');
router.use(cors());
// function for running api.py python script
function callPythonFunction(functionName, ...params) {
    const scriptPath = join(__dirname, '../../../db-sm-rsm/api.py');
    const pythonExecutable = 'python3';
    const args = [scriptPath, functionName, JSON.stringify(params)];

    console.log(`Running: precomputing=0 ${pythonExecutable} ${args.join(' ')}`);
    const pythonProcess = spawnSync(pythonExecutable, args, {
        env: { ...process.env, precomputing: '0' },
    });

    if (pythonProcess.error) {
        throw pythonProcess.error;
    }

    const stdout = pythonProcess.stdout.toString().trim();
    const stderr = pythonProcess.stderr.toString().trim();

    if (stderr) {
        console.error('Python stderr:', stderr);
    }

    try {
        const result = stdout;
        console.log(result)
        return (result);
    } catch (error) {
        console.error('Error reading or parsing result from file:', error);
        throw error;
    }
}

function callPythonFunction2(functionName, ...params){
    const scriptPath = join(__dirname, '../../../db-sm-rsm/data_generation.py');
    const pythonExecutable = 'python3';
    const args = [scriptPath, functionName, JSON.stringify(params)];

    console.log(`Running: ${pythonExecutable} ${args.join(' ')}`);
    const pythonProcess = spawnSync(pythonExecutable, args, {
        env: { ...process.env, precomputing: '0' },
    });

    if (pythonProcess.error) {
        throw pythonProcess.error;
    }

    const stdout = pythonProcess.stdout.toString().trim();
    const stderr = pythonProcess.stderr.toString().trim();

    if (stderr) {
        console.error('Python stderr:', stderr);
    }

    try {
        const result = stdout;
        console.log(result)
        return (result);
    } catch (error) {
        console.error('Error reading or parsing result from file:', error);
        throw error;
    }
}

// endpoint for generating the keys for the election
router.post('/setup',requireAuth, async (req, res) => {
    const {alpha} = req.body;
    const alp = Number(JSON.parse(alpha));

    try {
        document= await Keys.find();
        if(document.length==1) return res.status(400).send("Setup has already been done.")
        const result= await callPythonFunction('setup',alp);
        console.log(result); // Log the result or handle it internally
        res.send('Setup was successful.'); // Custom response
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message); // Send error message if something goes wrong
    }
});

router.post('/generate',requireAuth, async (req, res) => {
    const { n } = req.body;
    const num = Number(JSON.parse(n));
    const outputDirectory = '/output';

    try {
        // Call the Python function to generate ballots
        const result = await callPythonFunction("generate", num);
        console.log(result);

        // Read the generated PDF files from the output directory
        const files = fs.readdirSync(outputDirectory).filter(file => file.endsWith('.pdf'));

        if (files.length === 0) {
            return res.status(404).send('No ballots generated.');
        }

        // Create a zip archive of the generated PDFs
        const zipFilePath = path.join(outputDirectory, 'ballots.zip');
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        files.forEach(file => {
            archive.file(path.join(outputDirectory, file), { name: file });
        });
        archive.finalize();

        // When the zip is ready, send it to the client
        output.on('close', () => {
            res.download(zipFilePath, 'ballots.zip', err => {
                if (err) {
                    console.error('Error sending zip file:', err);
                    res.status(500).send('Error downloading the ballots.');
                }
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});



// endpoint for uploading the votes list
router.post('/upload', requireAuth, async (req, res) => {
    console.log("check 1");
    try {
        console.log("check 2");
        const jsonData = req.body;
        console.log(jsonData);

        // Insert data into the Bulletin collection
        const result = await Bulletin.insertMany(jsonData);
        console.log(result);
        if (!result) {
            return res.status(422).send({ error: "Error during uploading process" });
        }
        console.log("check 4");
        // Update the Receipt collection
        await Promise.all(result.map(async (entry) => {
            const { commitment } = entry;
        
            // Find the ov_hash associated with the given enc_hash
            const receipt = await Receipt.findOne({ enc_hash: commitment });
            console.log(receipt);
            console.log("check 5");
            if (receipt) {
                const { ov_hash } = receipt;
        
                // Update all entries containing the same ov_hash
                console.log("check 6");
                const updatedReceipts = await Receipt.updateMany(
                    { ov_hash },               // Find all entries with the same ov_hash
                    { accessed: true }         // Set accessed to true
                );
        
                console.log(`Updated ${updatedReceipts.modifiedCount} Receipts with ov_hash: ${ov_hash}`);
            } else {
                console.log(`No Receipt found with enc_hash: ${commitment}`);
            }
        }));

        // Respond to the client
        res.send({ status: 'OK', message: 'Upload process and receipt updates successful', result });
    } catch (err) {
        console.log("check 3");
        console.error(err);
        res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
    }
});


router.post('/upload_candidate', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;

        // Insert data into MongoDB
        console.log(jsonData);
        const result = await Candidate.insertMany(jsonData);

        if (!result) {
            return res.status(422).send({ error: "Error during uploading process" });
        }

        // Send back a success response with status 200
        return res.status(200).send({ status: 'OK', message: 'Candidates uploaded successfully', data: result });

    } catch (err) {
        console.error(err);
        // Handle errors gracefully
        return res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
    }
});

router.post('/upload_PO', requireAuth,async (req, res) => {
    console.log("check 2");
    try {
        const jsonData = req.body;

        // Insert data into MongoDB
        console.log(jsonData);
        const result = await PO.insertMany(jsonData);

        if (!result) {
            return res.status(422).send({ error: "Error during uploading process" });
        }

        // Send back a success response with status 200
        return res.status(200).send({ status: 'OK', message: 'Polling Officer uploaded successfully', data: result });

    } catch (err) {
        console.error(err);
        // Handle errors gracefully
        return res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
    }
        
});

router.post('/upload_voters', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;

        // Insert data into MongoDB
        console.log(jsonData);
        const result = await Voter.insertMany(jsonData);

        if (!result) {
            return res.status(422).send({ error: "Error during uploading process" });
        }

        // Send back a success response with status 200
        return res.status(200).send({ status: 'OK', message: 'Voters uploaded successfully', data: result });

    } catch (err) {
        console.error(err);
        // Handle errors gracefully
        return res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
    }
});

router.get('/pk', async (req, res) => {
    try {
        const existingKey = await Keys.findOne();
        if (!existingKey) {
            return res.status(422).send({ error: "Setup has not been done yet." });
        }
        console.log("here")
        // Sending the response in correct JSON format
        console.log(existingKey)
        res.status(200).send({
            pai_pk: JSON.stringify(existingKey.pai_pk),
            pai_pklist_single: JSON.stringify(existingKey.pai_pklist_single),
            elg_pk: JSON.stringify(existingKey.elg_pk)
        });
        console.log(res);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// endpoint to 
router.post('/mix', requireAuth, async (req, res) => {
    try {
        const existingKey = await Keys.findOne(); // Assuming you want to fetch the first document
        if (!existingKey) {
            return res.status(422).send({ error: "Setup has not been done" });
        }
        const result=await callPythonFunction('mix')
        if (!result) {
            return res.status(422).send({ error: "Error during decrypting process" });
        }
        console.log(result); // Log the result or handle it internally
        res.send('Mixing and Decryption was successful'); // Custom response
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message); // Send error message if something goes wrong
    }
});

// Example route to call the decvotes function
router.get('/bulletin', async (req, res) => {
    await Bulletin.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json({ error: err.message }))
});



router.get('/getVotes',async (req, res) => {
    try {
      // Fetch all Decs documents with .lean() to simplify the result
      const decs = await Dec.find().lean();
  
      // Log the documents to see the full data (optional)
      console.log('Fetched Decs:', decs);
  
      // Assuming the votes are stored in the msgs_out_dec array like [2, 3, 2, 2, 3]
      const msgs_out_dec = decs.map(dec => dec.msgs_out_dec[1].map(item => item[1])).flat();  // Flatten to get the vote array
  
      console.log('Votes:', msgs_out_dec);  // Logs: [2, 3, 2, 2, 3]
  
      // Fetch all candidates
      const candidates = await Candidate.find().lean();
  
      // Initialize a vote counts array based on the number of candidates
      const voteCounts = new Array(candidates.length).fill(0);
  
      // Increment the vote count for each candidate
      msgs_out_dec.forEach(vote => {
        voteCounts[vote] += 1;
      });
  
      const response = candidates.map((candidate, index) => ({
        name: candidate.name,
        votes: voteCounts[index]
      }));
  
      // Return the response as an array of candidate names and votes
      res.json(response);
  
    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ error: err.message });
    }
  });
      

// for signing in Polling Officer
router.post('/signin/PO', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(422).send({ error: "Must provide email or password" });
    }

    try {
        const newPO = await PO.findOne({ email });
        if (!newPO) {
            return res.status(422).send({ error: "Polling Officer doesn't exist with this email" });
        }

        await newPO.comparePassword(password);
        const token = jwt.sign({ userId: newPO._id }, jwtkey);
        res.send({ token });
    } catch (err) {
        console.error(err);
        return res.status(422).send(err.message);
    }
});

// for signing in Admin
router.post('/signin/Admin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(422).send({ error: "Must provide email or password" });
    }
    const newAdmin = await Admin.findOne({ email });
    if (!newAdmin) {
        return res.status(422).send({ error: "Admin doesn't exist with this email" });
    }
    try {
        await newAdmin.comparePassword(password);
        const token = jwt.sign({ userId: newAdmin._id }, jwtkey);
        console.log(token)
        res.send({ token });
    } catch (err) {
        return res.status(422).send(err.message);
    }
});

router.post('/runBuild1', async (req, res) => {
    try {
        // Paths to the APK and JSON files
        const appPath = path.join('/app/evoting_localstorage/evoting_fron/android/app/build/outputs/apk/release', 'app-release.apk');
        const outputDirectory = '/output'; // Path to the JSON files
        const zipFilePath = path.join(outputDirectory, 'evoting.zip'); // Temporary zip file path

        // Check if the APK file exists
        if (!fs.existsSync(appPath)) {
            return res.status(404).json({
                success: false,
                message: 'The APK file was not found.'
            });
        }

        // Call the Python function to generate the JSON file
        const result = await callPythonFunction2('');
        console.log('Python function executed successfully:', result);

        // Check for JSON files in the output directory
        const jsonFiles = fs.readdirSync(outputDirectory).filter(file => file.endsWith('.json'));
        if (jsonFiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No JSON files found in the output directory.'
            });
        }

        // Create a ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });
        const output = fs.createWriteStream(zipFilePath);

        output.on('close', () => {
            console.log(`ZIP file created successfully. Total size: ${archive.pointer()} bytes`);

            // Send the ZIP file as a download
            res.download(zipFilePath, 'download.zip', (err) => {
                if (err) {
                    console.error('Error sending the ZIP file:', err);
                    res.status(500).json({ error: 'Failed to send the ZIP file.' });
                }

                // Cleanup: delete the temporary ZIP file after sending
                fs.unlinkSync(zipFilePath);
            });
        });

        archive.on('error', (err) => {
            console.error('Error while creating ZIP archive:', err);
            res.status(500).json({ error: 'Failed to create ZIP archive.' });
        });

        // Pipe the archive to the output stream
        archive.pipe(output);

        // Add the APK file to the archive
        archive.file(appPath, { name: 'app-release.apk' });

        // Add all JSON files to the archive
        jsonFiles.forEach(file => {
            archive.file(path.join(outputDirectory, file), { name: file });
        });

        // Finalize the archive
        archive.finalize();
    } catch (err) {
        // Handle any errors that occur
        console.error('Error while processing the request:', err.message);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;

  

  
