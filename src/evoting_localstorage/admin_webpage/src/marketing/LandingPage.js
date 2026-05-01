import React from 'react';
import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';

const s = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  hero: {
    background: 'linear-gradient(135deg, #0062cc 0%, #007bff 60%, #66b2ff 100%)',
    color: 'white', textAlign: 'center', padding: '100px 24px 80px',
  },
  heroTag: {
    display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, padding: '4px 16px', fontSize: 13,
    fontWeight: 'bold', letterSpacing: 1, marginBottom: 24, textTransform: 'uppercase',
  },
  heroTitle: { fontSize: 52, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.15 },
  heroSub: { fontSize: 20, opacity: 0.9, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 },
  heroBtns: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },
  btnWhite: {
    padding: '14px 32px', backgroundColor: 'white', color: '#0062cc',
    border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: 16,
    cursor: 'pointer', textDecoration: 'none',
  },
  btnOutline: {
    padding: '14px 32px', backgroundColor: 'transparent', color: 'white',
    border: '2px solid white', borderRadius: 8, fontWeight: 'bold', fontSize: 16,
    cursor: 'pointer', textDecoration: 'none',
  },
  trustBar: {
    backgroundColor: '#f8f9fa', padding: '20px 48px',
    textAlign: 'center', borderBottom: '1px solid #e9ecef',
  },
  trustText: { color: '#6c757d', fontSize: 14, margin: 0 },
  trustBold: { color: '#212529', fontWeight: 'bold' },
  section: { padding: '80px 48px', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  sectionTitle: { fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 12, color: '#212529' },
  sectionSub: { fontSize: 18, color: '#6c757d', textAlign: 'center', marginBottom: 60, maxWidth: 600, margin: '0 auto 60px' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 },
  featureCard: {
    padding: 32, backgroundColor: 'white', borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0',
  },
  featureIcon: { fontSize: 36, marginBottom: 16 },
  featureTitle: { fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#212529' },
  featureDesc: { color: '#6c757d', lineHeight: 1.7, fontSize: 15 },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, counterReset: 'steps' },
  stepCard: {
    padding: 28, textAlign: 'center', backgroundColor: '#f8f9fa',
    borderRadius: 12, border: '1px solid #e9ecef',
  },
  stepNum: {
    width: 44, height: 44, borderRadius: '50%', backgroundColor: '#007bff',
    color: 'white', fontWeight: 'bold', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  },
  stepTitle: { fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#212529' },
  stepDesc: { color: '#6c757d', fontSize: 14, lineHeight: 1.6 },
  testimonial: {
    backgroundColor: '#0062cc', color: 'white',
    padding: '80px 48px', textAlign: 'center',
  },
  quoteText: { fontSize: 24, fontStyle: 'italic', maxWidth: 700, margin: '0 auto 24px', lineHeight: 1.6 },
  quoteName: { fontWeight: 'bold', fontSize: 16 },
  quoteRole: { opacity: 0.8, fontSize: 14, marginTop: 4 },
  cta: { backgroundColor: '#f8f9fa', padding: '80px 48px', textAlign: 'center' },
  ctaTitle: { fontSize: 36, fontWeight: 700, marginBottom: 16, color: '#212529' },
  ctaSub: { fontSize: 18, color: '#6c757d', marginBottom: 40 },
  ctaBtn: {
    display: 'inline-block', padding: '16px 40px', backgroundColor: '#007bff',
    color: 'white', borderRadius: 8, fontWeight: 'bold', fontSize: 18,
    textDecoration: 'none', border: 'none', cursor: 'pointer',
  },
};

const features = [
  { icon: '🔐', title: 'Cryptographic Security', desc: 'ElGamal threshold encryption and zero-knowledge proofs ensure votes are private, verifiable, and tamper-proof — even the server cannot read individual ballots.' },
  { icon: '🌐', title: 'Browser-Side Encryption', desc: 'Votes are encrypted in the voter\'s browser before being sent. AES-GCM-256 via Web Crypto API means no plaintext ever leaves the client.' },
  { icon: '📋', title: 'Multiple Ballot Types', desc: 'Run FPTP, preferential ranked-choice, or block voting elections. Configure the exact type your organisation needs.' },
  { icon: '📧', title: 'Automated Voter Invites', desc: 'Upload your voter list and OpenVoting emails unique one-time voting tokens to each voter automatically when you open an election.' },
  { icon: '🧾', title: 'Verifiable Receipts', desc: 'Every voter receives a cryptographic receipt they can use to independently verify their vote was counted — without revealing who they voted for.' },
  { icon: '📊', title: 'Real-Time Results', desc: 'Instant turnout stats and results dashboard the moment you close the election. Export data for your records.' },
];

const steps = [
  { num: 1, title: 'Create an account', desc: 'Sign up free in under 60 seconds. No credit card required.' },
  { num: 2, title: 'Set up your election', desc: 'Add election name, ballot type, and candidate list.' },
  { num: 3, title: 'Upload voters', desc: 'Import a CSV of voter names and email addresses.' },
  { num: 4, title: 'Open & close', desc: 'Click Open — voters get emailed. Click Close — results are instant.' },
];

export default function LandingPage() {
  return (
    <div style={s.page}>
      <PublicNav />

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroTag}>Trusted at IIT Delhi</div>
        <h1 style={s.heroTitle}>Secure Online Elections<br />for Every Organisation</h1>
        <p style={s.heroSub}>
          Cryptographically verified voting with zero-knowledge proofs.
          Run student body elections, club votes, or board decisions — in minutes.
        </p>
        <div style={s.heroBtns}>
          <a href="/org/signup" style={s.btnWhite}>Start Free</a>
          <a href="/pricing" style={s.btnOutline}>See Pricing</a>
        </div>
      </section>

      {/* Trust bar */}
      <div style={s.trustBar}>
        <p style={s.trustText}>
          <span style={s.trustBold}>2 real elections conducted</span> at IIT Delhi CAIC &nbsp;·&nbsp;
          Faculty mentor: <span style={s.trustBold}>Prof. Subodh Sharma, IIT Delhi</span> &nbsp;·&nbsp;
          <span style={s.trustBold}>End-to-end encrypted</span> ballots
        </p>
      </div>

      {/* Features */}
      <div style={{ backgroundColor: 'white' }}>
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Why OpenVoting?</h2>
          <p style={s.sectionSub}>Built by cryptography researchers. Designed for real organisations.</p>
          <div style={s.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ backgroundColor: '#f8f9fa' }}>
        <div style={s.section}>
          <h2 style={s.sectionTitle}>How it works</h2>
          <p style={s.sectionSub}>From signup to results in four steps.</p>
          <div style={s.stepsGrid}>
            {steps.map((step) => (
              <div key={step.num} style={s.stepCard}>
                <div style={s.stepNum}>{step.num}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div style={s.testimonial}>
        <p style={s.quoteText}>
          "OpenVoting brought verifiable cryptographic security to our student elections.
          The process was smooth, transparent, and the students trusted the result."
        </p>
        <p style={s.quoteName}>Prof. Subodh Sharma</p>
        <p style={s.quoteRole}>Faculty Mentor · Computer Science & Engineering, IIT Delhi</p>
      </div>

      {/* Final CTA */}
      <div style={s.cta}>
        <h2 style={s.ctaTitle}>Ready to run your first election?</h2>
        <p style={s.ctaSub}>Free plan includes 2 elections. No credit card required.</p>
        <a href="/org/signup" style={s.ctaBtn}>Create Free Account →</a>
      </div>

      <PublicFooter />
    </div>
  );
}
