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





router.post('/pf_zksm_verf', async (req, res) => {
    try {
        const { verfpk, sigs, enc_sigs, enc_sigs_rands,dpk_bbsig_pfs,blsigs} = req.body;
        if (!verfpk || !sigs || !enc_sigs || !enc_sigs_rands|| !dpk_bbsig_pfs ||!blsigs) {
            return res.status(422).send({ error: "Must provide all signatures" });
        }
        const result = await callPythonFunction('verfsmproof',verfpk,sigs,enc_sigs,enc_sigs_rands,dpk_bbsig_pfs,blsigs)
        if (!result) {
            return res.status(422).send({ error: "Error during set membership proof verification process" });
        }
        
        return res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


router.post('/pf_zkrsm_verf', async (req, res) => {
    try {
        const { verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands,dpk_bbsplussig_pfs,blsigs_rev} = req.body;
        if (!verfpk || !sigs_rev || !enc_sigs_rev || !enc_sigs_rev_rands ||!dpk_bbsplussig_pfs ||!blsigs_rev) {
            return res.status(422).send({ error: "Must provide all signatures" });
        }
        const result = await callPythonFunction('verfrsmproof',verfpk,sigs_rev,enc_sigs_rev,enc_sigs_rev_rands,dpk_bbsplussig_pfs,blsigs_rev)
        if (!result) {
            return res.status(422).send({ error: "Error during reverse set membership proof verification process" });
        }
        return res.send(result);
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

router.post('/verfsig', async (req, res) => {
        try{
            const result = await callPythonFunction('verfsigsm');

        // Check if result exists and is a string before processing
        if (!result) {
            return res.status(422).send({ error: "Error during generation of proofs" });
        }

        // Parse the result string as JSON
        let parsedResult;
        try {
            // Assuming `result` is a JSON string, try parsing it into an object
            parsedResult = JSON.parse(result);
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return res.status(500).send("Error parsing the result from Python");
        }

        // Check if parsedResult is an array (for example, from the Python function)
        if (!Array.isArray(parsedResult)) {
            return res.status(500).send("Parsed result is not an array as expected");
        }

        // Function to parse complex strings
        function parseComplexString(str) {
            // Remove outer quotes and escape any remaining quotes
            str = str.replace(/^"|"$/g, '')
                     .replace(/\\"/g, '"');

            // Replace Python-style type annotations and byte string markers
            str = str
                .replace(/'/g, '"')  // Convert single quotes to double quotes
                .replace(/b"/g, '"')  // Remove byte string markers
                .replace(/\(/g, '[')  // Convert tuples to arrays
                .replace(/\)/g, ']')
                .replace(/"pairing\.Element"/g, '"pairing.Element"')
                .replace(/"builtins\.list"/g, '"builtins.list"')
                .replace(/"builtins\.tuple"/g, '"builtins.tuple"');

            try {
                return JSON.parse(str);
            } catch (error) {
                console.error('Parsing error:', error);
                console.log('Failed to parse:', str);
                throw error;
            }
        }

        // Use .map() to parse each element if it's an array
        const formattedResult = parsedResult.map(parseComplexString);

        // Return the formatted result as a response
        return res.send({
            "verfpk": formattedResult[0],
            "sigs": formattedResult[1],
            "enc_sigs": formattedResult[2],
            "enc_sigs_rands": formattedResult[3]
        });
    }
    catch(err){
            console.error(err);
            res.status(500).send(err.message);
    }
});
    
    
router.post('/verfsigrev',async(req,res) =>{
        try{
        const result = await callPythonFunction('verfsigrsm');
        if (!result) {
            return res.status(422).send({ error: "Error during generation of proofs" });
        }

        // Parse the result string as JSON
        let parsedResult;
        try {
            // Assuming `result` is a JSON string, try parsing it into an object
            parsedResult = JSON.parse(result);
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return res.status(500).send("Error parsing the result from Python");
        }

        // Check if parsedResult is an array (for example, from the Python function)
        if (!Array.isArray(parsedResult)) {
            return res.status(500).send("Parsed result is not an array as expected");
        }

        // Function to parse complex strings
        function parseComplexString(str) {
            // Remove outer quotes and escape any remaining quotes
            str = str.replace(/^"|"$/g, '')
                     .replace(/\\"/g, '"');

            // Replace Python-style type annotations and byte string markers
            str = str
                .replace(/'/g, '"')  // Convert single quotes to double quotes
                .replace(/b"/g, '"')  // Remove byte string markers
                .replace(/\(/g, '[')  // Convert tuples to arrays
                .replace(/\)/g, ']')
                .replace(/"pairing\.Element"/g, '"pairing.Element"')
                .replace(/"builtins\.list"/g, '"builtins.list"')
                .replace(/"builtins\.tuple"/g, '"builtins.tuple"')
                .replace(/"builtins\.mpz"/g, '"builtins.mpz"');

            try {
                return JSON.parse(str);
            } catch (error) {
                console.error('Parsing error:', error);
                console.log('Failed to parse:', str);
                throw error;
            }
        }

        // Use .map() to parse each element if it's an array
        const formattedResult = parsedResult.map(parseComplexString);

        // Return the formatted result as a response
        return res.send({
            "verfpk": formattedResult[0],
            "sigs_rev": formattedResult[1],
            "enc_sigs_rev": formattedResult[2],
            "enc_sigs_rev_rands": formattedResult[3]
        });
    }
    catch(err){
            console.error(err);
            res.status(500).send(err.message);
    }
    
    });

router.post('/pk', async (req, res) => {
        try {
            const existingKey = await Keys.find();
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
