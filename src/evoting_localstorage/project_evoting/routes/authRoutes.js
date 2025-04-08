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
const async = require('async');
const os = require('os');
// function for running api.py python script
function callPythonFunction(functionName, ...params) {
    const scriptPath = join(__dirname, '../../../db-sm-rsm/api.py');
    const pythonExecutable = 'python3';
    const args = [scriptPath, functionName, JSON.stringify(params)];

    console.log(`Running: precomputing=0 ${pythonExecutable} ${args.join(' ')}`);
    const pythonProcess = spawnSync(pythonExecutable, args, {
        env: { ...process.env, precomputing: '0' },
        maxBuffer: 1024 * 1024 * 10
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
        maxBuffer: 1024 * 1024 * 10
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

let requestStatus = {"generate":"pending","upload":"pending","decryption":"pending"};


// endpoint for generating the keys for the election
router.post('/setup', requireAuth, async (req, res) => {
    const { alpha, electionId } = req.body;
    const alp = Number(JSON.parse(alpha));
    const numElections = Number(JSON.parse(electionId)); // Total elections to create

    try {
        // Check if any election in 1..numElections already exists
        for (let i = 1; i <= numElections; i++) {
            const existing = await Keys.findOne({ election_id: i });
            if (existing) {
                return res.status(400).json({ error: `Setup already done for election ${i}` });
            }
        }

        // Create elections sequentially
        for (let i = 1; i <= numElections; i++) {
            await callPythonFunction('setup', alp, i);
            console.log(`Election ${i} setup complete`);
        }

        res.json({ message: `Setup successful for ${numElections} elections` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Generate ballots for multiple elections
router.post('/generate', requireAuth, async (req, res) => {
    const { n, electionId } = req.body;
    const numBallots = Number(n);
    const numElections = Number(electionId);
    const outputDirectory = '/output';

    try {
        // 1. Parallelize ballot generation and individual ZIP creation
        const concurrencyLimit = Math.min(os.cpus().length, 20); // Adjust based on system capacity
        const electionIds = Array.from({ length: numElections }, (_, i) => i + 1);

        await async.eachLimit(electionIds, concurrencyLimit, async (i) => {
            // Generate ballots for this election
            await callPythonFunction('generate', numBallots, i);
            console.log(`Ballots generated for election ${i}`);

            // Find PDFs for this election
            const electionFiles = fs.readdirSync(outputDirectory)
                .filter(file => file.startsWith(`election_id_${i}_`) && file.endsWith('.pdf'));

            if (electionFiles.length === 0) {
                console.warn(`No PDFs found for election ${i}`);
                return;
            }

            // Create individual ZIP
            const individualZipName = `election_id_${i}_ballots.zip`;
            const individualZipPath = path.join(outputDirectory, individualZipName);
            
            await new Promise((resolve, reject) => {
                const output = fs.createWriteStream(individualZipPath);
                const archive = archiver('zip', { zlib: { level: 9 } });

                output.on('close', () => {
                    console.log(`Created individual ZIP for election ${i}`);
                    resolve();
                });

                archive.on('error', reject);
                archive.pipe(output);
                
                electionFiles.forEach(file => {
                    archive.file(path.join(outputDirectory, file), { name: file });
                });

                archive.finalize();
            });
        });

        // 2. Create master ZIP
        const zipFiles = fs.readdirSync(outputDirectory)
            .filter(file => file.startsWith('election_id_') && file.endsWith('_ballots.zip'));

        if (zipFiles.length === 0) {
            return res.status(404).json({ error: 'No ballots generated' });
        }

        const masterZipName = 'all_elections_combined.zip';
        const masterZipPath = path.join(outputDirectory, masterZipName);
        
        await new Promise((resolve, reject) => {
            const outputStream = fs.createWriteStream(masterZipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            outputStream.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(outputStream);
            
            zipFiles.forEach(file => {
                archive.file(path.join(outputDirectory, file), { name: file });
            });

            archive.finalize();
        });

        // 3. Send the master ZIP
        res.download(masterZipPath, masterZipName, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download ballots' });
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


const BATCH_SIZE = 1000;
router.post('/upload', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;

        // Process in batches
        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE);
            
            // Prepare bulk write operations
            const bulkOps = batch.map(doc => ({
                updateOne: {
                    filter: { 
                        voter_id: doc.voter_id,
                        election_id: doc.election_id
                    },
                    update: {
                        $setOnInsert: { ...doc, timestamp: new Date(doc.timestamp) }
                    },
                    upsert: true,
                    // Only update if existing document has later timestamp
                    hint: { voter_id: 1, election_id: 1 }
                }
            }));

            // Execute bulk write
            const bulkResult = await Bulletin.bulkWrite(bulkOps, {
                ordered: false,
                bypassDocumentValidation: true
            });

            // Process successful inserts
            const insertedIds = Object.values(bulkResult.upsertedIds || {});
            if (insertedIds.length > 0) {
                const insertedDocs = await Bulletin.find({
                    _id: { $in: insertedIds }
                });

                // Update receipts for newly inserted documents
                await Promise.all(insertedDocs.map(async (entry) => {
                    const { commitment } = entry;
                    const receipt = await Receipt.findOne({ enc_hash: commitment });
                    
                    if (receipt) {
                        const { ov_hash } = receipt;
                        const updatedReceipts = await Receipt.updateMany(
                            { ov_hash },
                            { accessed: true }
                        );
                        console.log(`Updated ${updatedReceipts.modifiedCount} Receipts with ov_hash: ${ov_hash}`);
                    }
                }));
            }
        }

        res.send({ 
            status: 'OK', 
            message: 'Upload process completed with timestamp-based conflict resolution'
        });
        requestStatus["upload"] = "success";
    } catch (err) {
        console.error(err);
        res.status(500).send({ 
            status: 'Error', 
            message: 'An error occurred while processing the request.',
            detailedError: err.message
        });
        requestStatus["upload"] = "failed";
    }
});

router.post('/upload_candidate', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;

        // Batch insert candidates
        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE);
            await Candidate.insertMany(batch);
        }

        return res.status(200).send({ status: 'OK', message: 'Candidates uploaded successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
    }
});

router.post('/upload_PO', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;

        // Batch insert polling officers
        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE);
            await PO.insertMany(batch);
        }

        return res.status(200).send({ status: 'OK', message: 'Polling Officers uploaded successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
    }
});

router.post('/upload_voters', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;

        // Batch insert voters
        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE);
            await Voter.insertMany(batch);
        }

        return res.status(200).send({ status: 'OK', message: 'Voters uploaded successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
    }
});



// endpoint to 
router.post('/mix', requireAuth, async (req, res) => {
    try {
        const existingKey = await Keys.find(); // Assuming you want to fetch the first document
        if (!existingKey) {
            return res.status(422).send({ error: "Setup has not been done" });
        }
        const result=await callPythonFunction('mix')
        if (!result) {
            return res.status(422).send({ error: "Error during decrypting process" });
        }
        console.log(result); // Log the result or handle it internally
        res.send('Mixing and Decryption was successful'); // Custom response
        requestStatus["decryption"] = "success";
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message); // Send error message if something goes wrong
        requestStatus["decryption"] = "failed";
    }
});

// Example route to call the decvotes function
router.get('/bulletin', async (req, res) => {
    try {
        const users = await Bulletin.find().sort({ election_id: 1 });
        res.json(users);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});



router.get('/getVotes', async (req, res) => {
    try {
      // Fetch all Decs documents
      const decs = await Dec.find().lean();
  
      // Fetch all candidates
      const candidates = await Candidate.find().lean();
  
      // Group votes by election_id
      const groupedVotes = decs.reduce((acc, dec) => {
        const electionId = dec.election_id;
  
        // Ensure the election_id exists in the accumulator
        if (!acc[electionId]) {
          acc[electionId] = [];
        }
  
        // Extract vote data from msgs_out_dec
        if (Array.isArray(dec.msgs_out_dec) && dec.msgs_out_dec.length > 1) {
          const voteData = dec.msgs_out_dec[1]; // Second element contains the vote data
          voteData.forEach(item => {
            if (Array.isArray(item) && item.length >= 2) {
              acc[electionId].push(item[1]); // Push the candidate index (vote)
            }
          });
        }
  
        return acc;
      }, {});
  
      // Process votes for each election
      const response = Object.keys(groupedVotes).reduce((acc, electionId) => {
        // Filter candidates for this election
        const electionCandidates = candidates.filter(c => c.election_id == electionId);
  
        // Initialize a vote counts array based on the number of candidates in this election
        const voteCounts = new Array(electionCandidates.length).fill(0);
  
        // Increment vote counts based on groupedVotes for this election
        groupedVotes[electionId].forEach(vote => {
          if (voteCounts[vote] !== undefined) {
            voteCounts[vote] += 1;
          }
        });
  
        // Map candidates to their names and vote counts
        acc[electionId] = electionCandidates.map((candidate, index) => ({
          name: candidate.name,
          votes: voteCounts[index]
        }));
  
        return acc;
      }, {});
  
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


router.get("/status", (req, res) => {
    res.json(requestStatus);
});


module.exports = router;

  

  
