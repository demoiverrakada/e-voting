import React, { useState, useEffect } from 'react';
import {useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ReactSession } from 'react-client-session';
import './App.css';
ReactSession.setStoreType('sessionStorage');
function Options() {
  const navigate = useNavigate();
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [alpha, setAlpha] = useState(2);
  const [n, setN] = useState(5);

  useEffect(() => {
    const token = ReactSession.get('access_token');
    //alert(token);
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleUpload = async () => {
    navigate('/upload', { replace: true });
  };
  const handleSetup = async () => {
    try {
      //const alpha = 2;
      //const n = 5;
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'https://2a61-223-229-214-187.ngrok-free.app/setup',
        { alpha: alpha, n: n }, // Replace with actual values if needed
        {
          headers: {
            authorization: `Bearer ${token}`
          },
        }
      );
      console.log('Protected data:', response.data);
      alert('Setup was successful');
      setShowSetupForm(false); // Hide the form after successful setup
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
    }
  };

  const handleEvoting_fron = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'https://2a61-223-229-214-187.ngrok-free.app/p/runBuild1',
        { alpha: alpha, n: n }, // Replace with actual values if needed
        {
          headers: {
            authorization: `Bearer ${token}`
          },
          responseType: 'blob', // Important to handle file as a blob
        }
      );
  
      // Create a link element to trigger the download
      const blob = new Blob([response.data], { type: 'application/octet-stream' }); // You can specify the MIME type depending on the file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'app_file'; // Specify the file name to download
      link.click();
  
      alert('Setup was successful');
      setShowSetupForm(false); // Hide the form after successful setup
    } catch (err) {
      alert(`Setup failed: ${err.message}`);
    }
  };

  // Declare state variables for loading and time
  const [loadingBallotAudit, setLoadingBallotAudit] = useState(false);
  const [timeElapsedBallotAudit, setTimeElapsedBallotAudit] = useState(0);

  // Timer function to keep counting time
  const startTimer = (setTimeElapsed) => {
    return setInterval(() => {
      setTimeElapsed((prevTime) => prevTime + 1);
    }, 1000);
  };

  const handleBallot_audit = async () => {
    // Start the timer immediately when the button is pressed
    setLoadingBallotAudit(true);
    setTimeElapsedBallotAudit(0);
    const timerInterval = startTimer(setTimeElapsedBallotAudit);

    // Show alert that the process has started
    alert('Ballot Audit has started. Please wait...');

    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'https://2a61-223-229-214-187.ngrok-free.app/runBuild2',
        { alpha: 'alpha_value', n: 'n_value' }, // Replace with actual values if needed
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
          responseType: 'blob', // Ensure the response is treated as a file (binary data)
        }
      );

      // Check if the response contains a file (APK)
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'BallotAudit.apk'; // Fallback name if not provided

      // Create a Blob URL to download the APK file
      const blob = new Blob([response.data], { type: 'application/vnd.android.package-archive' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName; // Set the downloaded file name
      link.click(); // Simulate the click to trigger download

      // Stop the timer once the process is complete
      clearInterval(timerInterval);
      alert('Build completed and APK is ready for download!');

      setLoadingBallotAudit(false); // End loading state
    } catch (err) {
      clearInterval(timerInterval); // Ensure the timer is cleared on error
      alert(`Ballot Audit setup failed: ${err.message}`);
      setLoadingBallotAudit(false);
    }
  };
  
  



  const handleGenerate = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post(
        'https://2a61-223-229-214-187.ngrok-free.app/generate',
        { n: n },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
          timeout: 100000, // Increase timeout to 100 seconds
          responseType: 'blob', // Correctly handle binary data
        }
      );
  
      // Check if the response status is 200
      if (response.status === 200) {
        alert('ballots.zip is being downloaded!');
  
        // Create a Blob from the response data
        const zipBlob = new Blob([response.data], { type: 'application/zip' });
        const url = URL.createObjectURL(zipBlob);
  
        // Create a temporary anchor element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ballots.zip'; // Name of the downloaded file
        document.body.appendChild(link);
        link.click();
  
        // Cleanup
        link.remove();
        URL.revokeObjectURL(url);
  
        alert('Ballot generation was successful and the file has been downloaded');
        setShowSetupForm(false); // Hide the form after successful setup
      } else {
        alert('Failed to generate ballots. Please try again.');
      }
    } catch (err) {
      console.error('Error during ballot generation:', err);
      alert(`Ballot generation failed: ${err.message}`);
    }
  };
  
  
  

  const handleGetPublicKeys = async () => {
    try {
      const response = await axios.get('https://2a61-223-229-214-187.ngrok-free.app/pk');
      console.log(response.data);
      alert('Public keys fetched successfully');
    } catch (err) {
      alert(`Failed to get public keys: ${err.message}`);
    }
  };

  const handlebulletintovotes = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.post('https://2a61-223-229-214-187.ngrok-free.app/mix', 
        {}, // Replace this empty object with the appropriate request body if needed
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
      alert('Encrypted Votes have successfully fetched from Bulletin, You can proceed further');
    } catch (err) {
      alert(`Failed to decrypt votes: ${err.message}`);
    }
  };
    

  const handleGetEncVotes = async () => {
    try {
      const response = await axios.get('https://2a61-223-229-214-187.ngrok-free.app/encvotes');
      console.log(response.data);

      // Convert JSON response to Blob and download it
      const jsonBlob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'encrypted_votes.json'; // The name of the downloaded file
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      URL.revokeObjectURL(url);

      alert('Encrypted votes fetched successfully');
    } catch (err) {
      alert(`Failed to get encrypted votes: ${err.message}`);
    }
  };

  const handleDecryptVotes = async () => {
    try {
      const token = ReactSession.get('access_token');
      const response = await axios.get('https://2a61-223-229-214-187.ngrok-free.app/decvotes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      alert('Votes decrypted successfully');
    } catch (err) {
      alert(`Failed to decrypt votes: ${err.message}`);
    }
  };

  const handleGetDcrpVotes = async () => {
    try {
      const response = await axios.get('https://2a61-223-229-214-187.ngrok-free.app/getVotes');
      console.log(response.data);
      
      // Convert JSON response to Blob and download it
      const jsonBlob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Decrypted_votes.json'; // The name of the downloaded file
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      URL.revokeObjectURL(url);

      alert('Decrypted votes fetched successfully');
    } catch (err) {
      alert(`Failed to get decrypted votes: ${err.message}`);
    }
  };

  const handle_proof = async () => {
    try {
      const response = await axios.post('http://localhost:5000/proof');
      console.log(response.data);
      alert('Proof generated successfully');
    } catch (err) {
      alert(`Failed to generate proof: ${err.message}`);
    }
  };

  const handle_rev_proof = async () => {
    try {
      const response = await axios.post('http://localhost:5000/proof');
      console.log(response.data);
      alert('Proof generated successfully');
    } catch (err) {
      alert(`Failed to generate proof: ${err.message}`);
    }
  };

  const handle_pf_zksm = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/pf_zksm',
        {  verfpk: "('pairing.Element', b'2:CjMQ6gpsCYDx6N0V4IubPORywEDtLg55k5+HRsK1Ppoj78Wb5qgOAHYU2IaJme/tz5J7/HhFND0V29aXYevrggE=')",
          sigs: "('builtins.list', [('pairing.Element', b'1:H47WAVXSmcFoW5jieLkKYtJd87yndqp73ypyRg1dRUwB'), ('pairing.Element', b'1:AVFQbbCqwYvPgJ5EFo+NMfXRa2bTVTI8ssKOP+VVdNcB'), ('pairing.Element', b'1:FZOhHJQNwdNpjF/tP/UGwgHDrcSro9CX+j+RBqw+UhIB'), ('pairing.Element', b'1:I180gAzVfMsIERMvTkcS+W6/6COO7UAcjSC/1lPdf5UB'), ('pairing.Element', b'1:A00dMlZtP+gWwfAo95iMeUPsuXHrtrTAKkIo3DyVpqQA')])",
          enc_sigs: "('builtins.tuple', [('builtins.tuple', [('pairing.Element', b'1:BFuCMsFWz86cU9nJET9IB28i/OCnNHWIHHO2gdOJTI0A'), ('pairing.Element', b'1:AorSrGFEbLd1CQCFPZRjv7mOJeyY8TH4ie8WZj3qNf4A')]), ('builtins.tuple', [('pairing.Element', b'1:EEzBUcJzO4IK5NtXkuiI7csg+/W9FHvN9sRGSUeayWAA'), ('pairing.Element', b'1:Eg0vCMny2YOUgLkANjYVYBbzHd8h2BGBClB72e2zhVAA')]), ('builtins.tuple', [('pairing.Element', b'1:AT1CkoT1R5XSmfbwafScOlsGwoJTKpJV5ULGSitghPQA'), ('pairing.Element', b'1:D3Amgs2jn64Qv5h/g7Vp+k9rwN+wLIVkkGhXEelUD3cA')]), ('builtins.tuple', [('pairing.Element', b'1:AlEtUSYkdGaE0MATd7pL5Niuko7a8OzhsNNaAiG9WGYB'), ('pairing.Element', b'1:Ce9+mANj5RBamun2Im1cED80bhOexcCFRtgspZlfDJMA')]), ('builtins.tuple', [('pairing.Element', b'1:B37vtQ3lepvJym42BAuFSrMZaLdRE5Qxx9BzuvvhPssA'), ('pairing.Element', b'1:F/p4U/TVrA0rK+Tn3GYs14ZuFlBDUz9vjP5Y3AsfLwoB')])])",
          enc_sigs_rands: "('builtins.tuple', [('pairing.Element', b'0:I6jRmhP4QwSx7zhA64VbJtn4r6A9h4Dl5B2uzgjadZk='), ('pairing.Element', b'0:FRFNwP4BO+Vd/c8U5h8hT2ggmZ1id1azPa87UIWullY='), ('pairing.Element', b'0:DBEl5Oo5BbXG/1HtDm9a62VNFdmraAnp/0vtmSus8nI='), ('pairing.Element', b'0:CoMPBe371SZI0+j/xdF6sS4jt9/0TKuFnTyAex977CA='), ('pairing.Element', b'0:HcsvjgK6Ol3zli+AY/kj8AorUUy8w9b8jmcGnqcTPho=')])"
       }, // Replace with actual values if needed
      );
      console.log('Protected data:', response.data);
      alert('pf_zksm was successful');
    } catch (err) {
      alert(`pf_zksm failed: ${err.message}`);
    }
  };


  const handle_pf_zkrsm = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/pf_zkrsm',
        { verfpk: [[15085577907441114050169285608601565780657418585165191739433240031807959308394, 747931217877267907246304258799127734505653466721828503593023021315045557473], [8607958271574829364856688507957609207704107304617360570898896607397528913007, 12819836294746371717574886338959404499071461235096889869846084699761053460984]],
          sigs_rev: [[10871103373554430876212195244062863118470048922697984363654275647995107352309, 14588752444689077999179031036738824240110365319258526280728045995424602863968], [14635995292514013682843710785019986837654249496309860234128064447720228488628, 7490416346840699065599831647372996040991264927741821665653188764749219184892], [3085809152394522993745127486979938085909304373421733015219089990318887878239, 6123935812123418267447700390259769564296499963561016333150652170049063640584], [645767153434866582641676799281992599919752656403851240598701079998145359635, 240347667424424897248920315572727599407199379112195774499400549993544576237], [1470307968589927849258931640013956377470922297905394427121202832020456218351, 8017063602494283197177965020337224933145632059732604870820033375713036164679]], 
          enc_sigs_rev: (([2259046181703738368291721840811235921236584709365636687337142044434551703720, 3855846160293488948062014792982783512066574782258660822736762940814434848175], [4468055670506573225448317846797383685787081578424406341217689642699590371129, 526187473887345784692178344028005240139640406859695376689335270131322396186]), ([4688389028570507840908574593147620833157294546022606783879584416303809867590, 9667235178192079178599189583360410593527214182902192106734630343722288472335], [11262654116821897277229242460448892251900516703009232397947462156542328565024, 8112973161053034697348863653477086476751080954452688173231017956250803280854]), ([6037525825261838815105803337600257663313623450777610717798751831387873123842, 14451153397270528450646097780488132874645736488923745944690077650959163438903], [9415112056648037179712008870736618586536886285106139662633336814381277663052, 15991552205114876811352533005175151394142834656779231542563641655610888574403]), ([14194021038050979164823131707692884742392672437818671149980329116099314509666, 13846945040022650563915945588174382473179194113625758786045581232936062029809], [10617406723293633086190859199167091175714349795712589443687117361625591436766, 2876482976694602555786279062628098483169591631914466817759341536651465357129]), ([6029397694073810229509093236052774036439782660094298968705430614127309405080, 4339939533272541270031776636731965152243692413045594154116170465111170065065], [14098339800369970357224057102908831722980761858486166895211349140270107660826, 104852475402223917096652378115123502175521570563385798474069120433061459058])), 
          enc_sigs_rev_rands : (2591632588171959204976402903037496489239157434914000888857564997771879164290, 4572001452888155510446558986932054210480216452258796815644989586533400573699, 15272403800678919654472370257195972725165465848004680938769449451791516102513, 1889734078656689304410284164876401670472952225363786993123108969719311621373, 8238507263989595427404736699586006753177386410703875426582240525164088304131)
       }, // Replace with actual values if needed
      );
      console.log('Protected data:', response.data);
      alert('pf_zkrsm was successful');
    } catch (err) {
      alert(`pf_zkrsm failed: ${err.message}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Admin Options</h1>
        <br />
        <form>
          <button type="button" id="upload" onClick={handleUpload}>Upload</button>
          <button type="button" id="setup" onClick={() => setShowSetupForm(!showSetupForm)}>
          {showSetupForm ? 'Cancel Setup' : 'Setup'}</button>

          {showSetupForm && (
          <div className="setup-form">
            <h3>Setup Parameters</h3>
            <label>
              Alpha:
              <input
                type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*"
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
              />
            </label>
            <label>
              N:
              <input
                type="number"
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
              />
            </label>
            <button type="button" onClick={handleSetup}>Submit Setup</button>
          </div>
          )}

          <button type="button" id="evoting_fron" onClick={handleEvoting_fron}>Evoting App</button>
          <button type="button" id="BallotAudit" onClick={handleBallot_audit}>Ballot Audit</button>
          <button 
            type="button" 
            id="generate" 
            onClick={() => setShowGenerateForm(!showGenerateForm)}
          >
            {showGenerateForm ? 'Cancel Generate' : 'Generate Ballot'}
          </button>

          {showGenerateForm && (
            <div className="generate-form">
              <h3>Generate Ballots</h3>
              <label>
                N (Number of Ballots):
                <input
                  type="number"
                  value={n}
                  onChange={(e) => setN(Number(e.target.value))}
                />
              </label>
              <button type="button" onClick={handleGenerate}>
                Submit Generate
              </button>
            </div>
          )}

          <button type="button" id="get_pub_keys" onClick={handleGetPublicKeys}>Get public keys</button>
          <button type="button" id="get_pub_keys" onClick={handlebulletintovotes}>Bulletin to Votes</button>
          <button type="button" id="get_enc_votes" onClick={handleGetEncVotes}>Get encrypted votes</button>
          <button type="button" id="decrypt_votes" onClick={handleDecryptVotes}>Decrypt votes</button>
          <button type="button" id="get_dcrp_votes" onClick={handleGetDcrpVotes}>Get decrypted votes</button>
          {/* // <button type="button" id="proof" onClick={handle_proof}>Proof</button>
          // <button type="button" id="rev_proof" onClick={handle_rev_proof}>rev_proof</button> */}
          <button type="button" id="pf_zksm" onClick={handle_pf_zksm}>pf_zksm</button>
          <button type="button" id="pf_zkrsm" onClick={handle_pf_zkrsm}>pf_zkrsm</button>
        </form>
      </header>
    </div>
  );
}

export default Options;
