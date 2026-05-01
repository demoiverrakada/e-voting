import React, { useState } from 'react';
import { orgFetch, setOrgToken } from './api';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  error: {
    color: '#dc3545',
    marginBottom: '16px',
    textAlign: 'center',
  },
  link: {
    display: 'block',
    textAlign: 'center',
    marginTop: '16px',
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '-12px',
    marginBottom: '16px',
  },
};

export default function OrgSignup() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { data, error: fetchError } = await orgFetch('/org/register', {
      method: 'POST',
      body: JSON.stringify({ name, slug, email, password }),
    });

    if (fetchError) {
      setError(fetchError);
    } else {
      setOrgToken(data.token);
      window.location.href = '/org/dashboard';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Organization Sign Up</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            placeholder="Organization Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Slug (e.g. iitd-caic)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            required
          />
          <div style={styles.hint}>Lowercase letters, numbers, and hyphens only</div>
          <input
            style={styles.input}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit">
            Create Account
          </button>
        </form>
        <a style={styles.link} href="/org/login">
          Already have an account? Log in
        </a>
      </div>
    </div>
  );
}
