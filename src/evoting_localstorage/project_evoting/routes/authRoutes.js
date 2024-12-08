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
    // Use the correct relative path
    const scriptPath = join(__dirname, '../../BallotAudit/android/automation.py'); // Adjust as needed
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

// endpoint for sending the public part of the keys 
router.get('/pk', async (req, res) => {
    try {
        const existingKey = await Keys.findOne();
        if (!existingKey) {
            return res.status(422).send({ error: "Setup has not been done yet." });
        }
        console.log("here")
        // Sending the response in correct JSON format
        res.send({
            pai_pk: existingKey.pai_pk,
            pai_pklist_single: existingKey.pai_pklist_single,
            elg_pk: existingKey.elg_pk
        });
        console.log(res.data());
    } catch (err) {
        res.status(500).send(err.message);
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
    const result1=await callPythonFunction('upload');
    if (!result1 || !result) {
        return res.status(422).send({ error: "Error during uploading process"});
    }
    res.send({ status: 'OK', message: 'Upload process successful', result });
    }
    catch(err){
    	console.log("check 3")
        console.error(err);
        res.status(500).send({ status: 'Error', message: 'An error occurred while processing the request.'});
    }
});


router.post('/upload_candidate', requireAuth,async (req, res) => {
    console.log("check 2");
    try {
        const jsonData = req.body;

        // Insert data into MongoDB
        console.log("check 4");
        console.log(jsonData);
        const result = await Candidate.insertMany(jsonData);
        console.log("check 1");

        if (!result) {
            return res.status(422).send({ error: "Error during uploading process" });
        }

        // Prepare the data to write to a JSON file
        const inputFileName = 'candidates.json';
        const filePath = path.join(__dirname, inputFileName);

        // Write the JSON data to the file
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

        console.log(`JSON data written to ${filePath}`);

        // Spawn a Python process to run the voters_upload.py script
        const pythonProcess = spawn('python3', [path.join(__dirname, 'candidates_upload.py'), filePath]);

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
    console.log("check 2");
    try {
        const jsonData = req.body;

        // Insert data into MongoDB
        console.log("check 4");
        console.log(jsonData);
        const result = await Voter.insertMany(jsonData);
        console.log("check 1");

        if (!result) {
            return res.status(422).send({ error: "Error during uploading process" });
        }

        // Prepare the data to write to a JSON file
        const inputFileName = 'voters.json';
        const filePath = path.join(__dirname, inputFileName);

        // Write the JSON data to the file
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

        console.log(`JSON data written to ${filePath}`);

        // Spawn a Python process to run the voters_upload.py script
        const pythonProcess = spawn('python3', [path.join(__dirname, 'voters_upload.py'), filePath]);

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
router.get('/decvotes',requireAuth, async (req, res) => {
    try{
    const dec=await Dec.findOne();
    if(!dec){return res.status(422).send({ error: "Decryption of votes has not been done" });}
    res.send({msgs_out: dec.msgs_out});
    }
    catch(err){
        res.status(500).send(err.message);
    }
});

router.post('/proof', async (req, res) => {
    try{
        const result = await callPythonFunction('genproof')
       // console.log("let's see the result",result);
        if(!result){
            return res.status(422).send({error:"error during generation of proofs"})
        }

        res.send({result})
    }
    catch(err){
        console.error(err);
        res.status(500).send(err.message);
    }
});


router.post('/revproof',async(req,res) =>{
    try{
    const{pfcomms} = req.body;
    if(!pfcomms){
       return res.status(422).send({error:"must provide all arguements"});
    }
    const result = await callPythonFunction('genrevproofs',pfcomms);
    if(!result){
        return res.status(422).send({error:"error during reverse_proof process"})
    }
    res.send({result})
}
catch(err){
        console.error(err);
        res.status(500).send(err.message);
}

});

router.post('/pf_zksm', async (req, res) => {
    try {
        const { verfpk, sigs, enc_sigs, enc_sigs_rands } = req.body;
        if (!verfpk || !sigs || !enc_sigs || !enc_sigs_rands) {
            return res.status(422).send({ error: "Must provide all signatures" });
        }
        const result = await callPythonFunction('pf_zksm',verfpk,sigs,enc_sigs,enc_sigs_rands)
        if (!result) {
            return res.status(422).send({ error: "Error during proof process" });
        }
        res.send({ proof:result});
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


router.post('/pf_zkrsm', async (req, res) => {
    try {
        const { verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands } = req.body;
        if (!verfpk || !sigs_rev || !enc_sigs_rev || !enc_sigs_rev_rands) {
            return res.status(422).send({ error: "Must provide all signatures" });
        }
        const result = await callPythonFunction('pf_zkrsm',verfpk,sigs_rev,enc_sigs_rev,enc_sigs_rev_rands)
        if (!result) {
            return res.status(422).send({ error: "Error during proof process" });
        }
        res.send({ proof: result});
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


// bulletin board
router.get('/getVotes', async(req, res) => {
    await Bulletin.find()
        .then(users => res.json(users))
        .catch(err => res.status(400).json({ error: err.message }))
});


router.post('/fetch', async (req, res) => {
console.log(req.body);
  try {
    const { commitment, voter_id, preference } = req.body;
    console.log("got request");
    const formattedcommitment= commitment.replace(/'/g, '"');
    let comms = JSON.parse(formattedcommitment);
    console.log(comms);
    const checkVoter = await Voter.findOne({ voter_id });
    if (!checkVoter) {
      return res.status(422).send({ error: "This voter_id is not in the voter list" });
    }

    const Bullet = await Bulletin.findOne({ voter_id });
    if (!Bullet) {
      return res.status(422).send({ error: "This voter_id has not voted in the election" });
    }

    // No need to parse commitment; it's already an array
    const num = Number(preference); // Convert preference to a number

    // Check if Bullet.commitment matches the specified commitment
	console.log(Bullet.commitment)
	console.log(comms[num])
    if (Bullet.commitment === comms[num]) {
console.log("here I am ")      
res.send({message:"Voter details verified"});
    } else {
console.log("there I am")
      return res.status(422).send({ error: "Your vote doesn't match with the bulletin. Report to authorities." });
    }
  } catch (err) {
    return res.status(422).send(err.message);
  }
});


router.post('/audit', async (req, res) => {
    try {
        // Corrected request body extraction
        const { commitment, booth_num, bid } = req.body; 

        console.log("Received audit request");
        console.log(commitment)
        console.log(booth_num)
        console.log(bid)
        // Call the Python function
        const result = await callPythonFunction("audit", commitment, booth_num, bid);

        const parsedResult = typeof result === "string" ? JSON.parse(result) : result;

    // Check if any result has success === false
    const hasFailure = parsedResult.some(entry => entry[0] === false);

    // Map results to the desired response format
    const formattedResults = parsedResult.map(entry => ({
        success: entry[0],
        v_w_nbar: entry[1],
        name: entry[2],
        gamma_w: entry[3],
        commitment: entry[4]
    }));

    // Return false if there are any failures, otherwise return the results
    if (hasFailure) {
        return res.json({
            success: false,
            results: formattedResults
        });
    }

    // Return true if all entries are successful
    res.json({
        success: true,
        results: formattedResults
    });

    } catch (err) {
        // Catch and return any errors that occur
        console.error("Error during audit:", err.message);
        return res.status(500).json({ error: err.message });
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

  

  
