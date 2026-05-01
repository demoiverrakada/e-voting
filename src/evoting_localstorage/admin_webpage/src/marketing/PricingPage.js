import React from 'react';
import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';

const s = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa' },
  hero: { textAlign: 'center', padding: '72px 24px 48px', backgroundColor: 'white', borderBottom: '1px solid #e9ecef' },
  title: { fontSize: 42, fontWeight: 800, color: '#212529', margin: '0 0 16px' },
  sub: { fontSize: 18, color: '#6c757d', maxWidth: 520, margin: '0 auto' },
  cardsRow: { display: 'flex', justifyContent: 'center', gap: 32, padding: '64px 48px', flexWrap: 'wrap', maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  card: (highlight) => ({
    flex: '1 1 340px', maxWidth: 400, backgroundColor: 'white', borderRadius: 16,
    padding: 40, boxShadow: highlight ? '0 8px 32px rgba(0,123,255,0.18)' : '0 2px 12px rgba(0,0,0,0.08)',
    border: highlight ? '2px solid #007bff' : '1px solid #e9ecef', position: 'relative',
  }),
  badge: {
    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
    backgroundColor: '#007bff', color: 'white', padding: '4px 18px',
    borderRadius: 20, fontSize: 12, fontWeight: 'bold', letterSpacing: 1,
  },
  planName: { fontSize: 22, fontWeight: 700, color: '#212529', marginBottom: 8 },
  price: { fontSize: 48, fontWeight: 800, color: '#212529', margin: '16px 0 4px' },
  priceSub: { color: '#6c757d', fontSize: 14, marginBottom: 32 },
  divider: { border: 'none', borderTop: '1px solid #e9ecef', margin: '24px 0' },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 36px' },
  featureItem: { padding: '8px 0', color: '#495057', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 },
  check: { color: '#28a745', fontWeight: 'bold', fontSize: 16 },
  cross: { color: '#dee2e6', fontWeight: 'bold', fontSize: 16 },
  btn: (highlight) => ({
    display: 'block', width: '100%', padding: '14px', textAlign: 'center',
    backgroundColor: highlight ? '#007bff' : 'white',
    color: highlight ? 'white' : '#007bff',
    border: `2px solid #007bff`, borderRadius: 8,
    fontWeight: 'bold', fontSize: 16, textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box',
  }),
  faqSection: { maxWidth: 700, margin: '0 auto', padding: '0 48px 80px', width: '100%', boxSizing: 'border-box' },
  faqTitle: { fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40, color: '#212529' },
  faqItem: { backgroundColor: 'white', borderRadius: 10, padding: '24px 28px', marginBottom: 16, border: '1px solid #e9ecef' },
  faqQ: { fontWeight: 700, color: '#212529', marginBottom: 10, fontSize: 16 },
  faqA: { color: '#6c757d', lineHeight: 1.7, fontSize: 15 },
};

const freeFeatures = [
  { text: '2 elections', yes: true },
  { text: 'Up to 100 voters per election', yes: true },
  { text: 'FPTP & preferential ballots', yes: true },
  { text: 'Browser-side AES-GCM-256 encryption', yes: true },
  { text: 'Voter email invitations', yes: true },
  { text: 'Verifiable receipts', yes: true },
  { text: 'Unlimited elections', yes: false },
  { text: 'Priority support', yes: false },
];

const paidFeatures = [
  { text: 'Unlimited elections', yes: true },
  { text: 'Unlimited voters per election', yes: true },
  { text: 'FPTP & preferential ballots', yes: true },
  { text: 'Browser-side AES-GCM-256 encryption', yes: true },
  { text: 'Voter email invitations', yes: true },
  { text: 'Verifiable receipts', yes: true },
  { text: 'Priority email support', yes: true },
  { text: 'Early access to new features', yes: true },
];

const faqs = [
  { q: 'Do I need a credit card to sign up?', a: 'No. The free plan is free forever with no card required. You only pay if you choose to upgrade.' },
  { q: 'Is ₹999 a one-time fee or monthly?', a: 'It is a one-time payment per organisation that unlocks the paid plan permanently. No recurring charges.' },
  { q: 'How is my data secured?', a: 'Votes are encrypted in the voter\'s browser using AES-GCM-256 before transmission. The server stores only ciphertext. Zero-knowledge proofs allow public verifiability without revealing individual choices.' },
  { q: 'Can I run elections for my student body or club?', a: 'Absolutely — that is exactly what OpenVoting is built for. We have run real elections at IIT Delhi CAIC twice.' },
  { q: 'What happens to my elections if I stay on the free plan?', a: 'Your first 2 elections are fully functional forever. You only need to upgrade if you want to run more than 2 elections.' },
];

export default function PricingPage() {
  return (
    <div style={s.page}>
      <PublicNav />

      <div style={s.hero}>
        <h1 style={s.title}>Simple, honest pricing</h1>
        <p style={s.sub}>Start free. Upgrade when you need more elections.</p>
      </div>

      <div style={s.cardsRow}>
        {/* Free card */}
        <div style={s.card(false)}>
          <p style={s.planName}>Free</p>
          <p style={s.price}>₹0</p>
          <p style={s.priceSub}>Forever free. No credit card.</p>
          <hr style={s.divider} />
          <ul style={s.featureList}>
            {freeFeatures.map((f) => (
              <li key={f.text} style={s.featureItem}>
                <span style={f.yes ? s.check : s.cross}>{f.yes ? '✓' : '✗'}</span>
                <span style={f.yes ? {} : { color: '#adb5bd' }}>{f.text}</span>
              </li>
            ))}
          </ul>
          <a href="/org/signup" style={s.btn(false)}>Get Started Free</a>
        </div>

        {/* Paid card */}
        <div style={s.card(true)}>
          <span style={s.badge}>MOST POPULAR</span>
          <p style={s.planName}>Paid</p>
          <p style={s.price}>₹999</p>
          <p style={s.priceSub}>One-time payment · Unlimited forever</p>
          <hr style={s.divider} />
          <ul style={s.featureList}>
            {paidFeatures.map((f) => (
              <li key={f.text} style={s.featureItem}>
                <span style={s.check}>✓</span>
                {f.text}
              </li>
            ))}
          </ul>
          <a href="/org/signup" style={s.btn(true)}>Upgrade for ₹999</a>
        </div>
      </div>

      {/* FAQ */}
      <div style={s.faqSection}>
        <h2 style={s.faqTitle}>Frequently asked questions</h2>
        {faqs.map((f) => (
          <div key={f.q} style={s.faqItem}>
            <p style={s.faqQ}>{f.q}</p>
            <p style={s.faqA}>{f.a}</p>
          </div>
        ))}
      </div>

      <PublicFooter />
    </div>
  );
}
