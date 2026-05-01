import React from 'react';
import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';

const s = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  hero: { textAlign: 'center', padding: '80px 24px 60px', background: 'linear-gradient(135deg, #0062cc 0%, #007bff 100%)', color: 'white' },
  heroTitle: { fontSize: 42, fontWeight: 800, margin: '0 0 16px' },
  heroSub: { fontSize: 18, opacity: 0.9, maxWidth: 580, margin: '0 auto' },
  section: { padding: '64px 48px', maxWidth: 820, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  h2: { fontSize: 30, fontWeight: 700, color: '#212529', marginBottom: 16 },
  p: { color: '#495057', lineHeight: 1.8, fontSize: 16, marginBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e9ecef', marginBottom: 24 },
  cardName: { fontWeight: 700, fontSize: 18, color: '#212529', marginBottom: 4 },
  cardRole: { color: '#007bff', fontSize: 14, fontWeight: 600, marginBottom: 12 },
  cardDesc: { color: '#6c757d', lineHeight: 1.7, fontSize: 15 },
  techGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 24 },
  techItem: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: '14px 18px', fontSize: 14, color: '#495057', border: '1px solid #e9ecef' },
  ctaBox: { backgroundColor: '#007bff', color: 'white', borderRadius: 16, padding: 48, textAlign: 'center', margin: '0 48px 80px', maxWidth: 820, marginLeft: 'auto', marginRight: 'auto' },
  ctaTitle: { fontSize: 28, fontWeight: 700, marginBottom: 12 },
  ctaSub: { opacity: 0.9, marginBottom: 32, fontSize: 16 },
  ctaBtn: { display: 'inline-block', padding: '13px 36px', backgroundColor: 'white', color: '#007bff', borderRadius: 8, fontWeight: 'bold', fontSize: 16, textDecoration: 'none' },
};

export default function AboutPage() {
  return (
    <div style={s.page}>
      <PublicNav />

      <div style={s.hero}>
        <h1 style={s.heroTitle}>About OpenVoting</h1>
        <p style={s.heroSub}>Cryptographically secure elections, built by researchers at IIT Delhi.</p>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>Our story</h2>
        <p style={s.p}>
          OpenVoting started as a research project in the Computer Science & Engineering department at IIT Delhi, focused on making cryptographic voting protocols practical for real organisations. Most voting systems claim to be "secure" — ours proves it mathematically.
        </p>
        <p style={s.p}>
          We have already run two real elections at IIT Delhi's Computer-Aided Innovation Centre (CAIC), under the mentorship of Prof. Subodh Sharma. Those elections used the same technology that powers this platform today.
        </p>
        <p style={s.p}>
          Our mission is to make verifiable, coercion-resistant digital elections accessible to every student body, club, cooperative, and organisation — not just governments with million-dollar budgets.
        </p>
      </div>

      <div style={{ backgroundColor: '#f8f9fa' }}>
        <div style={s.section}>
          <h2 style={s.h2}>The technology</h2>
          <p style={s.p}>OpenVoting is built on well-studied cryptographic primitives that provide strong security guarantees:</p>
          <div style={s.techGrid}>
            {[
              'ElGamal Threshold Encryption', 'Paillier Homomorphic Encryption',
              'Boneh-Boyen Signatures', 'Zero-Knowledge Proofs',
              'Pedersen Commitments', 'Mix-Net Shuffle Proofs',
              'Shamir Secret Sharing', 'AES-GCM-256 (Browser)',
            ].map((t) => <div key={t} style={s.techItem}>🔐 {t}</div>)}
          </div>
        </div>
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>Institutional support</h2>
        <div style={s.card}>
          <p style={s.cardName}>Prof. Subodh Sharma</p>
          <p style={s.cardRole}>Faculty Mentor · CSE Department, IIT Delhi</p>
          <p style={s.cardDesc}>
            Prof. Sharma has guided the research and real-world deployment of the OpenVoting platform at IIT Delhi. His expertise in formal verification and systems security has shaped the cryptographic foundations of the project.
          </p>
        </div>
        <div style={s.card}>
          <p style={s.cardName}>IIT Delhi — CAIC</p>
          <p style={s.cardRole}>First Production Customer</p>
          <p style={s.cardDesc}>
            The Computer-Aided Innovation Centre at IIT Delhi ran two real institutional elections on OpenVoting, validating the platform under live conditions with real voters and real stakes.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 916, margin: '0 auto', width: '100%', padding: '0 48px 80px', boxSizing: 'border-box' }}>
        <div style={s.ctaBox}>
          <h2 style={s.ctaTitle}>Want to run a secure election?</h2>
          <p style={s.ctaSub}>Free plan available. No credit card required.</p>
          <a href="/org/signup" style={s.ctaBtn}>Get Started Free</a>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
