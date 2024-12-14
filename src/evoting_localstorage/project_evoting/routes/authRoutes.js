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

//function for running evoting_fron app generation script
function callPythonFunction3(functionName, ...params) {
    // Use the correct relative path
    const scriptPath = join(__dirname, '../../evoting_fron/android/automation.py'); // Adjust as needed
    const pythonExecutable = 'python3';

    console.log("Resolved script path:", scriptPath);

    const formattedParams = params.map(param => 
        typeof param === 'string' ? `'${param}'` : param
    ).join(', ');

    const command = `${pythonExecutable} ${scriptPath}`;
    console.log(`Running: ${command}`);

    const pythonProcess = spawnSync(pythonExecutable, [scriptPath, functionName, ...params], {
        env: { ...process.env, precomputing: '0' },
    });

    if (pythonProcess.error) {
        console.error('Python process error:', pythonProcess.error);
        throw pythonProcess.error;
    }

    const stdout = pythonProcess.stdout.toString().trim();
    const stderr = pythonProcess.stderr.toString().trim();

    if (stderr) {
        console.error('Python stderr:', stderr);
    }

    try {
        console.log('Python stdout:', stdout);
        return stdout || stderr;
    } catch (error) {
        console.error('Error reading or parsing result:', error);
        throw error;
    }
}

//function for running BallotAudit app generation script

function callPythonFunction4(functionName, ...params) {
    const scriptPath = '/app/evoting_localstorage/BallotAudit/android/automation.py';
    const pythonExecutable = 'python3';

    console.log("Resolved script path:", scriptPath);

    const formattedParams = params.map(param =>
        typeof param === 'string' ? `'${param}'` : param
    ).join(' ');

    console.log(`Formatted params: ${formattedParams}`);

    const pythonProcess = spawnSync(pythonExecutable, [scriptPath, functionName, ...params], {
        env: {
            ...process.env,
            PATH: process.env.PATH + ':/root/.nvm/versions/node/v22.3.0/bin', // Explicitly add Node path
            precomputing: '0'
        },
        cwd: '/app/evoting_localstorage/BallotAudit/android/', // Make sure the working directory is correct
        encoding: 'utf-8',
    });

    if (pythonProcess.error) {
        console.error('Error spawning Python process:', pythonProcess.error);
        throw pythonProcess.error;
    }

    const stdout = pythonProcess.stdout.trim();
    const stderr = pythonProcess.stderr.trim();

    if (stderr) {
        console.error('Python stderr:', stderr);
    }

    console.log('Python stdout:', stdout);

    if (pythonProcess.status !== 0) {
        throw new Error(`Python script failed with exit code ${pythonProcess.status}: ${stderr}`);
    }

    return stdout || stderr;
}

function callPythonFunction5(functionName, ...params) {
    // Use the correct relative path
    const scriptPath = join(__dirname, '../../VoterVerification/android/automation.py'); // Adjust as needed
    const pythonExecutable = 'python3';

    console.log("Resolved script path:", scriptPath);

    const formattedParams = params.map(param => 
        typeof param === 'string' ? `'${param}'` : param
    ).join(', ');

    const command = `${pythonExecutable} ${scriptPath}`;
    console.log(`Running: ${command}`);

    const pythonProcess = spawnSync(pythonExecutable, [scriptPath, functionName, ...params], {
        env: { ...process.env, precomputing: '0' },
    });

    if (pythonProcess.error) {
        console.error('Python process error:', pythonProcess.error);
        throw pythonProcess.error;
    }

    const stdout = pythonProcess.stdout.toString().trim();
    const stderr = pythonProcess.stderr.toString().trim();

    if (stderr) {
        console.error('Python stderr:', stderr);
    }

    try {
        console.log('Python stdout:', stdout);
        return stdout || stderr;
    } catch (error) {
        console.error('Error reading or parsing result:', error);
        throw error;
    }
}


// endpoint for generating the keys for the election
router.post('/setup',requireAuth, async (req, res) => {
    const { alpha, n } = req.body;
    const alp = Number(JSON.parse(alpha));
    const nu = Number(JSON.parse(n));

    try {
        document= await Keys.find();
        if(document.length==1) return res.status(400).send("Setup has already been done.")
        const result= await callPythonFunction('setup',nu,alp);
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
        const archiver = require('archiver');
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
router.post('/upload', requireAuth,async (req, res) => {
    console.log("check 1")
    try{
    console.log("check 2")
    const jsonData = req.body;
    console.log(jsonData)
    const result= await Bulletin.insertMany(jsonData);
    if (!result) {
        return res.status(422).send({ error: "Error during uploading process"});
    }
    // const result2=await callPythonFunction('mix')
    //     if (!result2) {
    //         return res.status(422).send({ error: "Error during decrypting process" });
    //     }
    res.send({ status: 'OK', message: 'Upload process successful', result });
    }
    catch(err){
    	console.log("check 3")
        console.error(err);
        res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.'});
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
        console.log("check 4");
        console.log(jsonData);
        const result = await PO.insertMany(jsonData);
        console.log("check 1");

        if (!result) {
            return res.status(422).send({ error: "Error during uploading process" });
        }

        // Prepare the data to write to a JSON file
        const inputFileName = 'pos.json';
        const filePath = path.join(__dirname, inputFileName);

        // Write the JSON data to the file
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

        console.log(`JSON data written to ${filePath}`);

        // Spawn a Python process to run the voters_upload.py script
        const pythonProcess = spawn('python3', [path.join(__dirname, 'pos_upload.py'), filePath]);

        // Handle the output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Output: ${data}`);
        });

        // Handle any errors from the Python script
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        // Handle the completion of the Python process
        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            if (code === 0) {
                // If Python script finishes successfully
                res.send({ status: 'OK', message: 'Upload process successful', result });
            } else {
                res.status(500).send({ status: 'Error', message: `Python script failed with exit code ${code}` });
            }
        });

    } catch (err) {
        console.log("check 3");
        console.error(err);
        res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.' });
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


// endpoint for getting the encrypted votes
router.get('/encvotes',async(req,res)=>{
    Votes.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json({ error: err.message }))
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
        // Call the Python function to start the build process
        console.log('Calling Python function to start the build process');
        const result = await callPythonFunction3("runBuild1");

        // Log the result
        console.log('Build process result:', result);

        // Path to the generated app (adjust to match your build script's output location)
        const appPath = path.join(__dirname, '../../evoting_fron/android/app/build/outputs/apk/release/app-release.apk');

        // Check if the file exists
        if (!fs.existsSync(appPath)) {
            return res.status(404).json({
                success: false,
                message: 'Build process completed, but the app file was not found.'
            });
        }

        // Send the app file as a download
        console.log('Sending the generated app file to the client');
        res.download(appPath, 'app-release.apk', (err) => {
            if (err) {
                console.error('Error sending the app file:', err);
                res.status(500).json({ error: 'Failed to send the app file.' });
            }
        });
    } catch (err) {
        // Handle any errors that occur
        console.error('Error during build process:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Your Express endpoint where the build process is triggered
router.post('/runBuild2', async (req, res) => {
    try {
        // Call the Python function to start the build process
        console.log('Calling Python function to start the build process');
        const result = await callPythonFunction4("runBuild2");

        // Log the result
        console.log('Build process result:', result);

        // Path to the generated app (adjust to match your build script's output location)
        const appPath = path.join(__dirname, '../../BallotAudit/android/app/build/outputs/apk/release/app-release.apk');

        // Check if the file exists
        if (!fs.existsSync(appPath)) {
            return res.status(404).json({
                success: false,
                message: 'Build process completed, but the app file was not found.'
            });
        }

        // Send the app file as a download
        console.log('Sending the generated app file to the client');
        res.download(appPath, 'app-release.apk', (err) => {
            if (err) {
                console.error('Error sending the app file:', err);
                res.status(500).json({ error: 'Failed to send the app file.' });
            }
        });
    } catch (err) {
        // Handle any errors that occur
        console.error('Error during build process:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/runBuild3', async (req, res) => {
    try {
        // Call the Python function to start the build process
        console.log('Calling Python function to start the build process');
        const result = await callPythonFunction5("runBuild3");

        // Log the result
        console.log('Build process result:', result);

        // Path to the generated app (adjust to match your build script's output location)
        const appPath = path.join(__dirname, '../../VoterVerification/android/app/build/outputs/apk/release/app-release.apk');

        // Check if the file exists
        if (!fs.existsSync(appPath)) {
            return res.status(404).json({
                success: false,
                message: 'Build process completed, but the app file was not found.'
            });
        }

        // Send the app file as a download
        console.log('Sending the generated app file to the client');
        res.download(appPath, 'app-release.apk', (err) => {
            if (err) {
                console.error('Error sending the app file:', err);
                res.status(500).json({ error: 'Failed to send the app file.' });
            }
        });
    } catch (err) {
        // Handle any errors that occur
        console.error('Error during build process:', err.message);
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;

  

  
