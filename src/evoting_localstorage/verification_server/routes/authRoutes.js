const express = require('express');
const jwt = require('jsonwebtoken');
//const { jwtkey } = require('../keys');
const router = express.Router();
//const requireAuth = require('../middelware/requireToken');
//const {Verf,VerfP} = require('../models/User');
const cors = require('cors');
const { spawnSync } = require('child_process');
const fs = require('fs');
const { join } = require('path');
const path = require('path');

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
        
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


router.post('/pf_zkrsm_verf', async (req, res) => {
    try {
        const { verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands,dpk_bbsplussig_pfs,blsigs_rev,pfcomms} = req.body;
        if (!verfpk || !sigs_rev || !enc_sigs_rev || !enc_sigs_rev_rands ||!dpk_bbsplussig_pfs ||!blsigs_rev ||!pfcomms) {
            return res.status(422).send({ error: "Must provide all signatures" });
        }
        const result = await callPythonFunction('verfrsmproof',verfpk,sigs_rev,enc_sigs_rev,enc_sigs_rev_rands,dpk_bbsplussig_pfs,blsigs_rev,pfcomms)
        if (!result) {
            return res.status(422).send({ error: "Error during reverse set membership proof verification process" });
        }
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});




module.exports = router;
