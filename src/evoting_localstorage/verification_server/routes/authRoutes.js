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

    // Try parsing the JSON result
    try {
        parsedResult = JSON.parse(result);
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return res.status(500).send("Error parsing the result from Python");
    }

    // Validate that the parsed result is an array
    if (!Array.isArray(parsedResult)) {
        return res.status(500).send("Parsed result is not an array as expected");
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
    const formattedResult = parsedResult.map(parseNested);

    // Return formatted result for further usage
    return formattedResult;
}





router.post('/pf_zksm_verf', async (req, res) => {
    try {
        const result1 = await callPythonFunction('verfsigsm');
        if (!result1) {
            return res.status(422).send({ error: "Error during generation of signatures" });
        }
        console.log("Raw result1:", result1);
        const formattedResult = handleParsedResult(result1,res)
        console.log("formattedResult1",formattedResult)
        const verfpk=formattedResult[0]
        const sigs=formattedResult[1]
        const enc_sigs=formattedResult[2]
        const enc_sigs_rands=formattedResult[3]

        const Verfpk = reconstructOriginal(verfpk);
        const Sigs = reconstructOriginal(sigs);
        const EncSigs = reconstructOriginal(enc_sigs);
        const EncSigsRands = reconstructOriginal(enc_sigs_rands);

        console.log("Processed Verfpk:", Verfpk);
        console.log("Processed Sigs:", Sigs);
        console.log("Processed EncSigs:", EncSigs);
        console.log("Processed EncSigsRands:", EncSigsRands);

        const result2= await callPythonFunction2('pf_zksm',Verfpk,Sigs,EncSigs,EncSigsRands)
        if(!result2){
            return res.status(422).send({ error: "Error during set membership proof generation process" });
        }
        console.log("Raw result2:", result2);
        const formattedResult2=handleParsedResult(result2,res)
        console.log("formattedResult2",formattedResult2)
        const dpk_bbsig_pfs=formattedResult2[0]
        const blsigs=formattedResult2[1]

        const DpkBbsigPfs = reconstructOriginal(dpk_bbsig_pfs);
        const Blsigs = reconstructOriginal(blsigs);

        const result3 = await callPythonFunction('verfsmproof',Verfpk,Sigs,EncSigs,EncSigsRands,DpkBbsigPfs,Blsigs)

        if (!result3) {
            return res.status(422).send({ error: "Error during set membership proof verification process" });
        }
        console.log(result3)
        let result=JSON.parse(result3)
        return res.send({"encrypted_votes":result[0],"results":result[1],"status_forward_set_membership":result[2]});
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


router.post('/pf_zkrsm_verf', async (req, res) => {
    try {
        const result1 = await callPythonFunction('verfsigrsm');
        if (!result1) {
            return res.status(422).send({ error: "Error during generation of signatures" });
        }
        const formattedResult = handleParsedResult(result1,res)
        const verfpk=formattedResult[0]
        const sigs_rev=formattedResult[1]
        const enc_sigs_rev=formattedResult[2]
        const enc_sigs_rev_rands=formattedResult[3]

        const Verfpk = reconstructOriginal(verfpk);
        const SigsRev = reconstructOriginal(sigs_rev);
        const EncSigsRev = reconstructOriginal(enc_sigs_rev);
        const EncSigsRevRands = reconstructOriginal(enc_sigs_rev_rands);

        const result2= await callPythonFunction2('pf_zkrsm',Verfpk,SigsRev,EncSigsRev,EncSigsRevRands)
        if(!result2){
            return res.status(422).send({ error: "Error during reverse set membership proof generation process" });
        }
        const formattedResult2=handleParsedResult(result2,res)
        console.log(formattedResult2,"formattedResult2")
        const dpk_bbsplussig_pfs=formattedResult2[0]
        const blsigs_rev=formattedResult2[1]

        const DpkBbplussigPfs = reconstructOriginal(dpk_bbsplussig_pfs);
        const BlsigsRev = reconstructOriginal(blsigs_rev);
        const result3 = await callPythonFunction('verfrsmproof',Verfpk,SigsRev,EncSigsRev,EncSigsRevRands,DpkBbplussigPfs,BlsigsRev)
        if (!result3) {
            return res.status(422).send({ error: "Error during reverse set membership proof verification process" });
        }
        let result = JSON.parse(result3)
        return res.send({"decrypted_votes":result[0],"results":result[1],"status_reverse_set_membership":result[2]});
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
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
    return res.send({message:"Voter details verified"});
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


router.post('/pk', async (req, res) => {
        try {
            const existingKey = await Keys.findOne();
            if (!existingKey) {
                return res.status(422).send({ error: "Setup has not been done yet." });
            }
            console.log("here")
            // Sending the response in correct JSON format
            console.log(existingKey)
            res.send({
                pai_pk: existingKey.pai_pk,
                pai_pklist_single: existingKey.pai_pklist_single,
                elg_pk: existingKey.elg_pk
            });
            console.log(res);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
module.exports = router;
