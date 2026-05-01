import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import './VotePage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(digest));
}

async function encryptSelection(selection) {
  const plaintext = JSON.stringify(selection);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  return {
    encrypted_vote: {
      algorithm: 'AES-GCM-256',
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(encrypted)),
      key_id: 'browser-local',
    },
    selection_hash: await sha256Hex(plaintext),
  };
}

function buildReceiptQrValue(receipt) {
  return JSON.stringify({
    receipt_id: receipt.id,
    receipt_hash: receipt.hash,
    issued_at: receipt.issued_at,
    election_id: receipt.election_id,
  });
}

function VotePage() {
  const [session, setSession] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptQr, setReceiptQr] = useState('');

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!token) {
        setStatus('error');
        setError('This voting link is missing a token.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/voter/session?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to load this voting session.');
        }
        if (!isMounted) return;
        setSession(data);
        setRankedCandidates(data.candidates);
        setStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setError(err.message);
      }
    }

    loadSession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!receipt) return;

    QRCode.toDataURL(buildReceiptQrValue(receipt), {
      margin: 1,
      width: 180,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    }).then(setReceiptQr).catch(() => setReceiptQr(''));
  }, [receipt]);

  const electionType = session?.election?.type || 'fptp';
  const isPreferential = electionType === 'preferential';
  const canSubmit = isPreferential
    ? rankedCandidates.length === session?.candidates?.length
    : Boolean(selectedCandidate);

  function moveCandidate(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= rankedCandidates.length) return;

    const next = [...rankedCandidates];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setRankedCandidates(next);
  }

  async function submitVote() {
    if (!session || !canSubmit) return;

    setStatus('submitting');
    setError('');

    const selection = {
      election_id: session.election.id,
      ballot_type: electionType,
      submitted_at: new Date().toISOString(),
      selection: isPreferential
        ? rankedCandidates.map((candidate, index) => ({
            rank: index + 1,
            cand_id: candidate.cand_id,
          }))
        : [{ cand_id: selectedCandidate }],
    };

    try {
      const encrypted = await encryptSelection(selection);
      const client_receipt_nonce = window.crypto.randomUUID();

      const res = await fetch(`${API_BASE_URL}/api/vote/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ballot_type: electionType,
          client_receipt_nonce,
          ...encrypted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to submit your vote.');
      }

      setReceipt(data.receipt);
      setStatus('receipt');
    } catch (err) {
      setStatus('ready');
      setError(err.message);
    }
  }

  if (status === 'loading') {
    return (
      <main className="vote-shell">
        <section className="vote-panel vote-status-panel">
          <div className="vote-loader" />
          <h1>Loading ballot</h1>
        </section>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="vote-shell">
        <section className="vote-panel vote-status-panel">
          <h1>Voting link unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (status === 'receipt' && receipt) {
    return (
      <main className="vote-shell">
        <section className="vote-panel receipt-panel">
          <div>
            <p className="vote-eyebrow">{session.org.name}</p>
            <h1>Vote submitted</h1>
            <p>Your encrypted vote was accepted. Keep this receipt for verification.</p>
          </div>

          <div className="receipt-grid">
            <div className="receipt-qr">
              {receiptQr ? <img src={receiptQr} alt="Receipt QR code" /> : <span>QR</span>}
            </div>
            <dl className="receipt-details">
              <div>
                <dt>Receipt ID</dt>
                <dd>{receipt.id}</dd>
              </div>
              <div>
                <dt>Receipt Hash</dt>
                <dd>{receipt.hash}</dd>
              </div>
              <div>
                <dt>Election</dt>
                <dd>{receipt.election_name}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="vote-shell">
      <section className="vote-panel">
        <header className="vote-header">
          <div>
            <p className="vote-eyebrow">{session.org.name}</p>
            <h1>{session.election.name}</h1>
            <p>Signed in as {session.voter.name}</p>
          </div>
          <span className="vote-mode">{isPreferential ? 'Preferential' : 'FPTP'}</span>
        </header>

        {error && <div className="vote-alert">{error}</div>}

        {isPreferential ? (
          <div className="ranking-list">
            {rankedCandidates.map((candidate, index) => (
              <div className="ranking-row" key={candidate.cand_id}>
                <span className="rank-number">{index + 1}</span>
                <div className="candidate-copy">
                  <strong>{candidate.name}</strong>
                  <span>Entry {candidate.entry_number}</span>
                </div>
                <div className="rank-actions" aria-label={`Move ${candidate.name}`}>
                  <button type="button" onClick={() => moveCandidate(index, -1)} disabled={index === 0}>
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCandidate(index, 1)}
                    disabled={index === rankedCandidates.length - 1}
                  >
                    Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="candidate-list">
            {session.candidates.map((candidate) => (
              <label
                className={`candidate-option ${selectedCandidate === candidate.cand_id ? 'selected' : ''}`}
                key={candidate.cand_id}
              >
                <input
                  type="radio"
                  name="candidate"
                  value={candidate.cand_id}
                  checked={selectedCandidate === candidate.cand_id}
                  onChange={(event) => setSelectedCandidate(event.target.value)}
                />
                <span>
                  <strong>{candidate.name}</strong>
                  <em>Entry {candidate.entry_number}</em>
                </span>
              </label>
            ))}
          </div>
        )}

        <footer className="vote-footer">
          <p>Your selection is encrypted in this browser before it is sent.</p>
          <button type="button" onClick={submitVote} disabled={!canSubmit || status === 'submitting'}>
            {status === 'submitting' ? 'Submitting...' : 'Submit encrypted vote'}
          </button>
        </footer>
      </section>
    </main>
  );
}

export default VotePage;
