import React from 'react';
import { clearOrgToken } from './api';

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#343a40',
    color: 'white',
    fontFamily: 'sans-serif',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logout: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #ff4d4d',
    color: '#ff4d4d',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  container: {
    padding: '40px 24px',
    fontFamily: 'sans-serif',
    maxWidth: '1000px',
    margin: 'auto',
  },
};

export default function OrgLayout({ children, orgName }) {
  const handleLogout = () => {
    clearOrgToken();
    window.location.href = '/org/login';
  };

  return (
    <div>
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => window.location.href = '/org/dashboard'}>
          🗳 E-Vote
        </div>
        <div style={styles.right}>
          <a href="/org/billing" style={{ marginLeft: 16, color: '#007bff', textDecoration: 'none' }}>Billing</a>
          <span>{orgName}</span>
          <button style={styles.logout} onClick={handleLogout}>Log out</button>
        </div>
      </nav>
      <div style={styles.container}>
        {children}
      </div>
    </div>
  );
}
