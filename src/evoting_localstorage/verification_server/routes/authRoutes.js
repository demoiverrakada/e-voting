const express = require('express');
//const { jwtkey } = require('../keys');
const router = express.Router();
//const requireAuth = require('../middelware/requireToken');
//const {Verf,VerfP} = require('../models/User');
const cors = require('cors');
const { spawnSync } = require('child_process');
const fs = require('fs');
const { join } = require('path');
const path = require('path');
const { Voter,Bulletin,Keys,Generator} = require('../models/User');

router.use(cors());
// function for running api.py python script
function callPythonFunction(functionName, ...params) {
    const scriptPath = join(__dirname, '../../../db-sm-rsm/api_verfication.py');
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


function callPythonFunction2(functionName, ...params) {
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

function processElementTuple(parsedInput) {
    if (Array.isArray(parsedInput)) {
        // Handle pairing.Element
        if (parsedInput[0] === "pairing.Element") {
            return `('pairing.Element', b'${parsedInput[1]}')`;
        }
        // Handle builtins.mpz
        if (parsedInput[0] === "builtins.mpz") {
            return `('builtins.mpz', ${parsedInput[1]})`; // Ensure correct formatting for mpz
        }
        // Handle builtins.tuple (nested tuples or lists inside)
        if (parsedInput[0] === "builtins.tuple" && Array.isArray(parsedInput[1])) {
            const innerElements = parsedInput[1].map(processElementTuple).join(", ");
            return `('builtins.tuple', [${innerElements}])`;
        }
        // Handle builtins.list inside tuples
        if (parsedInput[0] === "builtins.list" && Array.isArray(parsedInput[1])) {
            const listElements = parsedInput[1].map(processElementList).join(", ");
            return `('builtins.list', [${listElements}])`;
        }
    }
    throw new Error("Invalid tuple format in input");
}

function processElementList(parsedInput) {
    if (Array.isArray(parsedInput) && parsedInput[0] === "pairing.Element") {
        return `('pairing.Element', b'${parsedInput[1]}')`;
    }
    // Handle nested builtins.list
    if (Array.isArray(parsedInput) && parsedInput[0] === "builtins.list" && Array.isArray(parsedInput[1])) {
        const listElements = parsedInput[1].map(processElementList).join(", ");
        return `('builtins.list', [${listElements}])`;
    }
    // Handle tuples inside lists
    if (Array.isArray(parsedInput) && parsedInput[0] === "builtins.tuple" && Array.isArray(parsedInput[1])) {
        const tupleElements = parsedInput[1].map(processElementTuple).join(", ");
        return `('builtins.tuple', [${tupleElements}])`;
    }
    throw new Error("Invalid list element format in input");
}

function reconstructOriginal(parsedInput) {
    try {
        // Parse JSON input if it's a string
        if (typeof parsedInput === "string") {
            parsedInput = JSON.parse(parsedInput);
        }
    } catch (err) {
        throw new Error("Invalid JSON format: " + parsedInput);
    }

    if (typeof parsedInput === 'object' && !Array.isArray(parsedInput)) {
        return Object.fromEntries(
            Object.entries(parsedInput).map(([key, value]) => [
                key, 
                reconstructOriginal(value) // Recurse through object entries
            ])
        );
    }
    console.log("Processing parsedInput:", JSON.stringify(parsedInput, null, 2)); // Debug input

    if (
        Array.isArray(parsedInput) &&
        parsedInput.length === 2 &&
        parsedInput[0] === "builtins.list" &&
        Array.isArray(parsedInput[1])
    ) {
        // Handle a list of pairing.Elements or nested structures inside a list
        const result = parsedInput[1].map(processElementList).join(", ");
        return `('builtins.list', [${result}])`;
    } else if (
        Array.isArray(parsedInput) &&
        parsedInput.length === 2 &&
        parsedInput[0] === "pairing.Element"
    ) {
        // Reconstruct a single pairing.Element
        return `('pairing.Element', b'${parsedInput[1]}')`;
    } else if (
        Array.isArray(parsedInput) &&
        parsedInput.length === 2 &&
        parsedInput[0] === "builtins.tuple" &&
        Array.isArray(parsedInput[1])
    ) {
        // Handle tuple with nested elements (can be pairing.Element or other tuples/lists)
        const result = parsedInput[1].map(processElementTuple).join(", ");
        return `('builtins.tuple', [${result}])`;
    } else if (
        Array.isArray(parsedInput) &&
        parsedInput.length === 2 &&
        parsedInput[0] === "builtins.dict" &&
        typeof parsedInput[1] === "object"
    ) {
        // Handle builtins.dict (map-like structures)
        const dictEntries = Object.entries(parsedInput[1])
            .map(([key, value]) => `${JSON.stringify(key)}: ${processElementTuple(value)}`)
            .join(", ");
        return `('builtins.dict', {${dictEntries}})`;
    } else if (
        Array.isArray(parsedInput) &&
        parsedInput.length === 2 &&
        parsedInput[0] === "builtins.set" &&
        Array.isArray(parsedInput[1])
    ) {
        // Handle builtins.set (sets of elements)
        const setElements = parsedInput[1].map(processElementTuple).join(", ");
        return `('builtins.set', {${setElements}})`;
    } else if (
        Array.isArray(parsedInput) &&
        parsedInput.every(
            (item) => Array.isArray(item) && item.length === 2 && item[0] === "pairing.Element"
        )
    ) {
        // Handle list of pairing.Element arrays (e.g., [[...], [...], ...])
        const elements = parsedInput.map(processElementList).join(", ");
        return `[${elements}]`;
    } else if (
        Array.isArray(parsedInput) &&
        parsedInput.every(
            (item) =>
                Array.isArray(item) &&
                item.length === 2 &&
                item[0] === "builtins.tuple" &&
                Array.isArray(item[1])
        )
    ) {
        // Handle list of builtins.tuple arrays (e.g., [[...], [...], ...])
        const tuples = parsedInput.map((tuple) => processElementTuple(tuple)).join(", ");
        return `[${tuples}]`;
    }

    // Fallback case for unexpected input
    throw new Error("Unrecognized input format: " + JSON.stringify(parsedInput, null, 2));
}


function handleParsedResult(result, res) {
    let parsedResult;

    try {
        parsedResult = JSON.parse(result);
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return res.status(500).send("Error parsing the result from Python");
    }
    if (typeof parsedResult !== 'object' || parsedResult === null) {
        return res.status(500).send("Expected object structure");
    }

    // Helper function to parse complex strings
    function parseComplexString(str) {
        if (typeof str !== 'string') {
            return str; // If not a string, return it as-is
        }

        str = str.replace(/^"|"$/g, '')
                 .replace(/\\"/g, '"')
                 .replace(/'/g, '"') // Replace single quotes with double quotes
                 .replace(/b"/g, '"') // Handle Python byte string format
                 .replace(/\(/g, '[')  // Replace parentheses with brackets
                 .replace(/\)/g, ']')
                 .replace(/"pairing\.Element"/g, '"pairing.Element"')
                 .replace(/"builtins\.list"/g, '"builtins.list"')
                 .replace(/"builtins\.tuple"/g, '"builtins.tuple"')
                 .replace(/"builtins\.mpz"/g, '"builtins.mpz"');

        try {
            return JSON.parse(str);
        } catch (error) {
            console.error("Parsing error:", error);
            console.log("Failed to parse:", str);
            throw error;
        }
    }

    // Recursive function to handle nested structures
    function parseNested(item) {
        if (typeof item === 'string') {
            return parseComplexString(item);
        } else if (Array.isArray(item)) {
            return item.map(parseNested); // Process each element recursively
        } else if (item && typeof item === 'object') {
            // If it's an object, process each key-value pair recursively
            return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, parseNested(value)]));
        }
        return item; // Return as-is for unsupported types
    }

    // Map the parsed result using the recursive function
    const formattedResult = Object.fromEntries(
        Object.entries(parsedResult).map(([key, value]) => [
            key,
            parseNested(value) // Recursively process nested values
        ])
    );

    // Return formatted result for further usage
    return formattedResult;
}


let requestStatus = {"audit":"pending","voterverf":"pending","decryption_sm":"pending","vvpatverf":"pending"};


router.post('/pf_zksm_verf', async (req, res) => {
    try {
        const result1 = await callPythonFunction('verfsigsm');
        if (!result1) {
            return res.status(422).send({ error: "Error during generation of signatures" });
        }

        const formattedResult = handleParsedResult(result1, res);
        console.log("formattedResult1", formattedResult);
        
        const allElectionResults = {};

        // Loop through all election IDs in the result
        for (const [electionId, electionData] of Object.entries(formattedResult)) {
            console.log(`Processing election ${electionId}`);
            
            // Extract components for current election
            const { verfpk, sigs, enc_sigs, enc_sigs_rands } = electionData;

            // Reconstruct original format for each component
            const Verfpk = reconstructOriginal(verfpk);
            const Sigs = reconstructOriginal(sigs);
            const EncSigs = reconstructOriginal(enc_sigs);
            const EncSigsRands = reconstructOriginal(enc_sigs_rands);

            console.log(`Processed components for election ${electionId}:`);
            console.log("Verfpk:", Verfpk);
            console.log("Sigs:", Sigs);
            console.log("EncSigs:", EncSigs);
            console.log("EncSigsRands:", EncSigsRands);
            console.log("election_id",electionId);
            // Call Python function with election ID parameter
            const result2 = await callPythonFunction2('pf_zksm',Verfpk,Sigs,EncSigs,EncSigsRands,electionId);

            if (!result2) {
                return res.status(422).send({ 
                    error: `Error during set membership proof generation for election ${electionId}`
                });
            }
            const formattedResult2 = handleParsedResult(result2, res);
            console.log("formattedResult2",formattedResult2)
            const dpk_bbsig_pfs = formattedResult2['0'];
            const blsigs = formattedResult2['1']
            const DpkBbsigPfs = reconstructOriginal(dpk_bbsig_pfs);
            const Blsigs = reconstructOriginal(blsigs);
            // Verify proof for current election
            const result3 = await callPythonFunction('verfsmproof',Verfpk,Sigs,EncSigs,EncSigsRands,DpkBbsigPfs,Blsigs,electionId );
            if (!result3) {
                return res.status(422).send({ 
                    error: `Verification failed for election ${electionId}`
                });
            }
            const parsedResult = JSON.parse(result3);
            allElectionResults[electionId] = {"encrypted_votes": parsedResult[0],"results": parsedResult[1],"status_forward_set_membership": parsedResult[2]};
        }
        requestStatus["decryption_sm"] = "success";
        return res.send(allElectionResults);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
        requestStatus["decryption_sm"] = "failed"
    }
});


router.post('/pf_zkrsm_verf', async (req, res) => {
    try {
            const result1 = await callPythonFunction('verfsigrsm');
            if (!result1) {
                return res.status(422).send({ error: "Error during generation of signatures" });
            }
            const formattedResult = handleParsedResult(result1, res);
            console.log("formattedResult1", formattedResult);
            const allElectionResults = {};
            for (const [electionId, electionData] of Object.entries(formattedResult)) {
                console.log(`Processing election ${electionId}`);
                const { verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands } = electionData;
                const Verfpk = reconstructOriginal(verfpk);
                const SigsRev = reconstructOriginal(sigs_rev);
                const EncSigsRev = reconstructOriginal(enc_sigs_rev);
                const EncSigsRevRands = reconstructOriginal(enc_sigs_rev_rands);
                console.log(`Processed components for election ${electionId}:`);
                console.log("Verfpk:", Verfpk);
                console.log("Sigs:", SigsRev);
                console.log("EncSigs:", EncSigsRev);
                console.log("EncSigsRands:", EncSigsRevRands);
                const result2 = await callPythonFunction2('pf_zkrsm',Verfpk,SigsRev,EncSigsRev,EncSigsRevRands,electionId);
                if (!result2) {
                    return res.status(422).send({ 
                        error: `Error during set membership proof generation for election ${electionId}`
                    });
                }
                const formattedResult2 = handleParsedResult(result2, res);
                const dpk_bbsplussig_pfs = formattedResult2['0'];
                const blsigs_rev=formattedResult2['1'];
                const DpkBbplussigPfs = reconstructOriginal(dpk_bbsplussig_pfs);
                const BlsigsRev = reconstructOriginal(blsigs_rev);
                const result3 = await callPythonFunction('verfrsmproof',Verfpk,SigsRev,EncSigsRev,EncSigsRevRands,DpkBbplussigPfs,BlsigsRev,electionId );
                if (!result3) {
                    return res.status(422).send({ 
                        error: `Verification failed for election ${electionId}`
                    });
                }
                const parsedResult = JSON.parse(result3);
                allElectionResults[electionId] = {"decrypted_votes": parsedResult[0],"results": parsedResult[1],"status_reverse_set_membership": parsedResult[2]};
            }
            //console.log("here")
            requestStatus["decryption_rsm"] = "success"
            return res.send(allElectionResults);
    
        } catch (err) {
            console.error(err);
            res.status(500).send(err.message);
            requestStatus["decryption_rsm"] = "failed"
        }
});

router.post('/fetch', async (req, res) => {
    console.log(req.body);
    try {
        const { voter_id } = req.body;
        const checkVoter = await Voter.find({ voter_id:voter_id });
        if (!checkVoter || checkVoter.length === 0) {
            return res.status(422).send({ error: "This voter_id is not in the voter list" });
        }

        const Bullet = await Bulletin.find({ voter_id:voter_id });
        if (!Bullet || Bullet.length === 0) {
            return res.status(422).send({ error: "This voter_id has not voted in the election" });
        }
            //console.log("here I am ")
            //console.log(Bullet)
            // Prepare the response with an elections array
            const electionsData = Bullet.map(bullet => ({
                election_id: bullet.election_id, // Assuming this exists
                preference: bullet.pref_id, // Assuming this exists
                commitment: bullet.commitment, // Assuming this exists
            }));
            requestStatus["voterverf"] = "success"
            return res.send({ elections: electionsData });
    } catch (err) {
        console.error(err); // Log the error for debugging purposes
        requestStatus["voterverf"] = "failed"
        return res.status(500).send({ error: "Internal Server Error" });
    }
});


    
    
router.post('/audit', async (req, res) => {
        try {
            // Corrected request body extraction
            const { commitment, booth_num, bid ,election_id} = req.body; 
    
            console.log("Received audit request");
            console.log(commitment)
            console.log(booth_num)
            console.log(bid)
            console.log(election_id)
            // Call the Python function
            const result = await callPythonFunction("audit", commitment, booth_num, bid,election_id);
            if(result==="The ballot has already been audited or the ballot has been used to cast a vote."){
                return res.json({results:"The ballot has already been audited or the ballot has been used to cast a vote."})
            }
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
        requestStatus["audit"] = "success"
        } catch (err) {
            // Catch and return any errors that occur
            console.error("Error during audit:", err.message);
            requestStatus["audit"] = "failed"
            return res.status(500).json({ error: err.message });
        }
    });

router.post('/vvpat', async (req, res) => {
        try {
            const { bid,electionId } = req.body;
    
            // Validate input
            if (!bid) {
                return res.status(400).json({ error: "Ballot id is required." });
            }
    
            // Call the Python function with the bid
            const result = await callPythonFunction("vvpat", bid,electionId);
    
            // Handle the result
            if (result === "This VVPAT doesn't correspond to a decrypted vote.") {
                return res.json({ results: result });
            } else if (typeof result === "object" && result.cand_name &&result.extended_vote) {
                return res.json({ cand_name: result.cand_name ,extended_vote:result.extended_vote});
            } else {
                // Handle unexpected response from Python function
                return res.status(500).json({ error: "Unexpected response from verification process." });
            }
        } catch (err) {
            console.error("Error during VVPAT verification:", err.message);
            return res.status(500).json({ error: "Internal server error." });
        }
    });
    

router.post('/runBuild2', async(req, res) => {
    try {
        // Path to the pre-existing app file
        const appPath = path.join('/app/evoting_localstorage/BallotAudit/android/app/build/outputs/apk/release', 'app-release.apk');

        // Check if the file exists
        if (!fs.existsSync(appPath)) {
            return res.status(404).json({
                success: false,
                message: 'The app file was not found.'
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
        console.error('Error while trying to send the file:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/runBuild3', async(req, res) => {
    try {
        // Path to the pre-existing app file
        const appPath = path.join('/app/evoting_localstorage/VoterVerification/android/app/build/outputs/apk/release', 'app-release.apk');

        // Check if the file exists
        if (!fs.existsSync(appPath)) {
            return res.status(404).json({
                success: false,
                message: 'The app file was not found.'
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
        console.error('Error while trying to send the file:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get("/status", (req, res) => {
    res.json(requestStatus);
});

module.exports = router;
