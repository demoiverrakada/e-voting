import React from 'react';

const styles = {
  footer: {
    backgroundColor: '#212529', color: '#adb5bd',
    padding: '48px', textAlign: 'center', marginTop: 'auto',
  },
  links: { display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 },
  link: { color: '#adb5bd', textDecoration: 'none', fontSize: 14 },
  copy: { fontSize: 13 },
};

export default function PublicFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.links}>
        <a href="/" style={styles.link}>Home</a>
        <a href="/pricing" style={styles.link}>Pricing</a>
        <a href="/about" style={styles.link}>About</a>
        <a href="/org/signup" style={styles.link}>Sign Up</a>
        <a href="/org/login" style={styles.link}>Log In</a>
      </div>
      <p style={styles.copy}>© {new Date().getFullYear()} OpenVoting. Built at IIT Delhi.</p>
    </footer>
  );
}
