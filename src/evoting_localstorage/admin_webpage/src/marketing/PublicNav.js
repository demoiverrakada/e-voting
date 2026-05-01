import React from 'react';
const styles = {
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 48px', backgroundColor: '#ffffff',
    borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#007bff', textDecoration: 'none' },
  links: { display: 'flex', gap: 32, alignItems: 'center' },
  link: { color: '#495057', textDecoration: 'none', fontSize: 15 },
  ctaBtn: {
    padding: '9px 22px', backgroundColor: '#007bff', color: 'white',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold',
    fontSize: 14, textDecoration: 'none',
  },
};
export default function PublicNav() {
  return (
    <nav style={styles.nav}>
      <a href="/" style={styles.logo}>OpenVoting</a>
      <div style={styles.links}>
        <a href="/pricing" style={styles.link}>Pricing</a>
        <a href="/about" style={styles.link}>About</a>
        <a href="/org/login" style={styles.link}>Log in</a>
        <a href="/org/signup" style={styles.ctaBtn}>Get Started Free</a>
      </div>
    </nav>
  );
}
