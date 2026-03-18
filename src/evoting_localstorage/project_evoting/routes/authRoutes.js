const express = require('express');
const jwt = require('jsonwebtoken');
const { jwtkey } = require('../keys');
const router = express.Router();
const requireAuth = require('../middelware/requireToken');
const { PO, Votes, Admin, Candidate, Voter, Receipt, Bulletin,Keys,Dec,BMDPublicKey} = require('../models/User');
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

    console.log(`Running: precomputing=1 ${pythonExecutable} ${args.join(' ')}`);
    const pythonProcess = spawnSync(pythonExecutable, args, {
        env: { ...process.env, precomputing: '0' },
        maxBuffer: 1024 * 1024 * 1000
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
const upload = multer({ 
    dest: '/tmp/uploads/',
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.enc.json')) {
            cb(null, true);
        } else {
            cb(new Error('Only .enc.json files are accepted'), false);
        }
    }
});
function callPythonFunction2(functionName, ...params){
    const scriptPath = join(__dirname, '../../../db-sm-rsm/data_generation.py');
    const pythonExecutable = 'python3';
    const args = [scriptPath, functionName, JSON.stringify(params)];

    console.log(`Running: ${pythonExecutable} ${args.join(' ')}`);
    const pythonProcess = spawnSync(pythonExecutable, args, {
        env: { ...process.env, precomputing: '1' },
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
function callPythonEncrypt() {
    const scriptPath = join(__dirname, '../../../db-sm-rsm/encrypt_json.py');
    const pythonExecutable = 'python3';
    console.log(`Running: ${pythonExecutable} ${scriptPath}`);
    const pythonProcess = spawnSync(pythonExecutable, [scriptPath], {
        cwd: '/',   // <-- so ./output resolves to /output and ./encrypted_output to /encrypted_output
        env: { ...process.env, precomputing: '1' },
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
    console.log("Python output:", stdout);
    return stdout;
}
function callPythonDecrypt(encryptedFilePath) {
    const scriptPath = join(__dirname, '../../../db-sm-rsm/decrypt_json.py');
    const pythonExecutable = 'python3';
    console.log(`Running: ${pythonExecutable} ${scriptPath} ${encryptedFilePath}`);
    const pythonProcess = spawnSync(pythonExecutable, [scriptPath, encryptedFilePath], {
        cwd: '/',
        env: { ...process.env },
        maxBuffer: 1024 * 1024 * 50
    });
    if (pythonProcess.error) {
        throw pythonProcess.error;
    }
    const stderr = pythonProcess.stderr.toString().trim();
    if (stderr) {
        console.error('Python stderr:', stderr);
    }
    if (pythonProcess.status !== 0) {
        throw new Error(`Decryption failed with exit code ${pythonProcess.status}: ${stderr}`);
    }
    const stdout = pythonProcess.stdout.toString().trim();
    return JSON.parse(stdout);
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
    const encryptedOutputDirectory = '/encrypted_output';  // <-- mounted volume

    try {
        // Step 1: Generate ballots
        await callPythonFunction("generate", numBallots, numElections);
        console.log('Ballot generation complete');

        // Step 2: Encrypt
        callPythonEncrypt();
        console.log('Encryption complete');

        // Step 3: Build per-BMD ZIPs
        // Structure: /encrypted_output/<bmd_id>/<election_id>/ballot/*.enc.json
        if (!fs.existsSync(encryptedOutputDirectory)) {
            return res.status(404).json({ error: 'No encrypted output found' });
        }

        const bmdDirs = fs.readdirSync(encryptedOutputDirectory)
            .filter(entry =>
                fs.statSync(path.join(encryptedOutputDirectory, entry)).isDirectory()
            );

        if (bmdDirs.length === 0) {
            return res.status(404).json({ error: 'No BMD directories found in encrypted output' });
        }

        const concurrencyLimit = Math.min(os.cpus().length, 20);
        const bmdZipPaths = [];

        await async.eachLimit(bmdDirs, concurrencyLimit, async (bmdId) => {
            const bmdDir = path.join(encryptedOutputDirectory, bmdId);
            const bmdZipName = `${bmdId}.zip`;
            const bmdZipPath = path.join(outputDirectory, bmdZipName);

            await new Promise((resolve, reject) => {
                const output = fs.createWriteStream(bmdZipPath);
                const archive = archiver('zip', { zlib: { level: 9 } });

                output.on('close', () => {
                    console.log(`Created ZIP for ${bmdId}`);
                    resolve();
                });

                archive.on('error', reject);
                archive.pipe(output);

                // Walk: /encrypted_output/<bmdId>/<electionId>/ballot/*.enc.json
                const electionDirs = fs.readdirSync(bmdDir)
                    .filter(entry =>
                        fs.statSync(path.join(bmdDir, entry)).isDirectory()
                    );

                electionDirs.forEach(electionId => {
                    const ballotDir = path.join(bmdDir, electionId, 'ballot');
                    if (!fs.existsSync(ballotDir)) return;

                    const encFiles = fs.readdirSync(ballotDir)
                        .filter(file => file.endsWith('.enc.json'));

                    encFiles.forEach(file => {
                        archive.file(
                            path.join(ballotDir, file),
                            { name: `${electionId}/ballot/${file}` }
                        );
                    });
                });

                archive.finalize();
            });

            bmdZipPaths.push({ name: bmdZipName, filePath: bmdZipPath });
        });

        // Step 4: Master ZIP of all BMD ZIPs
        const masterZipName = 'all_bmds_encrypted.zip';
        const masterZipPath = path.join(outputDirectory, masterZipName);

        await new Promise((resolve, reject) => {
            const outputStream = fs.createWriteStream(masterZipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            outputStream.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(outputStream);

            bmdZipPaths.forEach(({ name, filePath }) => {
                archive.file(filePath, { name });
            });

            archive.finalize();
        });
        res.download(masterZipPath, masterZipName, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download ballots' });
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


const BATCH_SIZE = 1000;
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
        const uploadedFile = req.file;
        let votes;
        if (uploadedFile) {
            console.log(`Decrypting uploaded file: ${uploadedFile.path}`);
            votes = callPythonDecrypt(uploadedFile.path);
            console.log(`Decryption complete, got ${votes.length} votes`);
        } else {
            votes = req.body.votes;
        }
        if (!Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({
                status: 'Error',
                message: "Payload must contain a non-empty 'votes' array."
            });
        }
        let totalInserted = 0;
        let totalMatched = 0;
        let totalModified = 0;
        for (let i = 0; i < votes.length; i += BATCH_SIZE) {
            const batch = votes.slice(i, i + BATCH_SIZE);

            const bulkOps = batch.map(doc => ({
                updateOne: {
                    filter: {
                        voter_id: doc.voter_id,
                        election_id: doc.election_id
                    },
                    update: {
                        $setOnInsert: {
                            ...doc,
                            timestamp: new Date(doc.timestamp)
                        }
                    },
                    upsert: true,
                    hint: { voter_id: 1, election_id: 1 }
                }
            }));
            const bulkResult = await Bulletin.bulkWrite(bulkOps, {
                ordered: false,
                bypassDocumentValidation: true
            });
            totalInserted += bulkResult.upsertedCount || 0;
            totalMatched += bulkResult.matchedCount || 0;
            totalModified += bulkResult.modifiedCount || 0;
            const insertedIds = Object.values(bulkResult.upsertedIds || {});
            if (insertedIds.length > 0) {
                const insertedDocs = await Bulletin.find({
                    _id: { $in: insertedIds }
                });
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
            const updateVoterConditions = batch.map(doc => ({
                voter_id: doc.voter_id,
                election_id: doc.election_id
            }));
            await Voter.updateMany(
                { $or: updateVoterConditions },
                { $set: { vote: true } },
                { multi: true }
            );
        }
        if (uploadedFile && fs.existsSync(uploadedFile.path)) {
            fs.unlinkSync(uploadedFile.path);
            console.log(`Cleaned up temp file: ${uploadedFile.path}`);
        }
        res.send({
            status: 'OK',
            message: 'Upload process completed with timestamp-based conflict resolution.',
            insertedCount: totalInserted,
            matchedCount: totalMatched,
            modifiedCount: totalModified
        });
        requestStatus["upload"] = "success";
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).send({
            status: 'Error',
            message: 'An error occurred while processing the request.',
            detailedError: err.message
        });
        requestStatus["upload"] = "failed";
    }
});
              

module.exports = router;
async function generateAndInsertCombinations({
    electionId,
    election_name,
    election_type,
    number_of_preferences,
    candidateObjects
}) {
    const INSERT_BATCH = 5000;
    let buffer = [];
    let nextId = 0;
    const NAFS = { name: "NAFS", entry_number: "012" };
    async function flushIfNeeded() {
        if (buffer.length >= INSERT_BATCH) {
            await Candidate.insertMany(buffer, { ordered: false });
            buffer = [];
        }
    }
    function makeRecord(path) {
        return {
            election_id: electionId,
            election_name,
            election_type,
            number_of_preferences,
            name: path.map(c => c.name).join(","),
            entry_number: path.map(c => c.entry_number).join(","),
            cand_id: (nextId++).toString()
        };
    }
    async function backtrack(path, used) {
        if (path.length === number_of_preferences) {
            buffer.push(makeRecord(path));
            await flushIfNeeded();
            return;
        }
        for (let i = 0; i < candidateObjects.length; i++) {
            if (!used[i]) {
                used[i] = true;
                path.push(candidateObjects[i]);
                await backtrack(path, used);
                path.pop();
                used[i] = false;
            }
        }
    }
    await backtrack([], new Array(candidateObjects.length).fill(false));
    buffer.push(makeRecord(new Array(number_of_preferences).fill(NAFS)));
    await flushIfNeeded();
    for (const candidate of candidateObjects) {
        for (let nafsPos = 0; nafsPos < number_of_preferences; nafsPos++) {
            const path = [];
            for (let slot = 0; slot < number_of_preferences; slot++) {
                path.push(slot === nafsPos ? NAFS : candidate);
            }
            buffer.push(makeRecord(path));
            await flushIfNeeded();
        }
    }
    if (buffer.length > 0) {
        await Candidate.insertMany(buffer, { ordered: false });
    }
}


// Updated upload route
router.post('/upload_candidate', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;
        const BATCH_SIZE = 1000;
        for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE);
            // Group by election_id
            const electionMap = new Map();
            batch.forEach(candidate => {
                if (!electionMap.has(candidate.election_id)) {
                    electionMap.set(candidate.election_id, []);
                }
                electionMap.get(candidate.election_id).push(candidate);
            });
            for (const [electionId, candidates] of electionMap) {
                const {
                    election_name,
                    election_type,
                    number_of_preferences
                } = candidates[0];
                if (election_type !== "preferential") {
                    await Candidate.insertMany(candidates, { ordered: false });

                    // Add NAFS
                    const maxId = Math.max(
                        ...candidates.map(c => parseInt(c.cand_id))
                    );
                    await Candidate.insertMany([{
                        election_id: electionId,
                        election_name,
                        election_type,
                        number_of_preferences,
                        name: "NAFS",
                        entry_number: "012",
                        cand_id: (maxId + 1).toString()
                    }], { ordered: false });
                }
                else {
                    const candidateObjects = candidates.map(c => ({
                        name: c.name,
                        entry_number: c.entry_number
                    }));
                    const n = candidateObjects.length;
                    const k = number_of_preferences;
                    if (k > n) {
                        return res.status(400).send({
                            status: 'Error',
                            message: `number_of_preferences (${k}) cannot exceed candidate count (${n})`
                        });
                    }
                    if (n > 10 || k > 5) {
                        return res.status(400).send({
                            status: 'Error',
                            message: `Maximum allowed: 10 candidates and 5 preferences. Got n=${n}, k=${k}`
                        });
                    }
                    await generateAndInsertCombinations({
                        electionId,
                        election_name,
                        election_type,
                        number_of_preferences,
                        candidateObjects
                    });
                }
            }
        }
        return res.status(200).send({
            status: 'OK',
            message: 'Candidates processed successfully'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            status: 'Error',
            message: err.code === 11000
                ? 'Duplicate candidate detected'
                : 'Processing failed'
        });
    }
});


router.post('/upload_PO', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;
        const BATCH_SIZE = 1000;
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

router.post('/upload_bmd_keys', requireAuth, async (req, res) => {
    try {
        const jsonData = req.body;

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            return res.status(400).json({ status: 'Error', message: 'Payload must be a non-empty array.' });
        }
        await BMDPublicKey.insertMany(jsonData);
        return res.status(200).json({
            status: 'OK',
            message: 'BMD public keys uploaded successfully.',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'Error',
            message: 'An error occurred while processing the request.',
            detailedError: err.message
        });
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
        const decs = await Dec.find().lean();
        const candidates = await Candidate.find().lean();
        // Create election ID to name mapping
        const electionNameMap = candidates.reduce((acc, candidate) => {
            acc[candidate.election_id.toString()] = candidate.election_name;
            return acc;
        }, {});
        // Create election ID to type mapping
        const electionTypeMap = candidates.reduce((acc, candidate) => {
            acc[candidate.election_id.toString()] = candidate.election_type;
            return acc;
        }, {});
        // Group votes by election_id
        const groupedVotes = decs.reduce((acc, dec) => {
            const electionId = dec.election_id.toString();
            if (!acc[electionId]) acc[electionId] = [];

            if (Array.isArray(dec.msgs_out_dec) && dec.msgs_out_dec.length > 1) {
                dec.msgs_out_dec[1].forEach(item => {
                    if (Array.isArray(item) && item.length >= 2) {
                        acc[electionId].push(item[1]);
                    }
                });
            }
            return acc;
        }, {});
        const response = {};
        for (const electionId of Object.keys(groupedVotes)) {
            const electionType = electionTypeMap[electionId];
            const electionName = electionNameMap[electionId] || "Unknown Election";
            const electionCandidates = candidates
                .filter(c => c.election_id.toString() === electionId)
                .sort((a, b) => parseInt(a.cand_id) - parseInt(b.cand_id)); // must be sorted by cand_id
            if (electionType === "preferential") {
                try {
                    const rawResult = await callPythonFunction("count", electionId);
                    const preferentialResult = JSON.parse(rawResult);
                    response[electionId] = {
                        election_name: electionName,
                        election_type: electionType,
                        is_preferential: true,
                        winner: preferentialResult.winner,
                        total_voters: preferentialResult.total_voters,
                        total_rounds: preferentialResult.total_rounds,
                        rounds: preferentialResult.rounds
                    };
                } catch (parseErr) {
                    console.error(`Failed to parse preferential result for election ${electionId}:`, parseErr);
                    response[electionId] = {
                        election_name: electionName,
                        election_type: electionType,
                        is_preferential: true,
                        error: "Failed to process preferential vote count"
                    };
                }
            }
            else {
                const voteCounts = new Array(electionCandidates.length).fill(0);
                groupedVotes[electionId].forEach(vote => {
                    if (vote >= 0 && vote < voteCounts.length) {
                        voteCounts[vote]++;
                    }
                });
                response[electionId] = {
                    election_name: electionName,
                    election_type: electionType,
                    is_preferential: false,
                    candidates: electionCandidates.map((candidate, index) => ({
                        name: candidate.name,
                        entry_number: candidate.entry_number,
                        votes: voteCounts[index] || 0
                    }))
                };
            }
        }
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

router.post('/update-password', requireAuth,async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    // Validate request body
    if (!email || !oldPassword || !newPassword) {
        return res.status(400).send({ error: "Please provide email, old password, and new password." });
    }

    try {
        // Find the admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).send({ error: "Admin not found." });
        }

        // Compare old password
        const isMatch = await admin.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).send({ error: "Old password is incorrect." });
        }

        // Set new password (will trigger pre-save hook to hash it)
        admin.password = newPassword;
        await admin.save();

        res.send({ message: "Password changed successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Internal server error." });
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

  

  
