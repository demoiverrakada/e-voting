import React, { useEffect, useState } from 'react';
import { getOrgToken, orgFetch } from './api';

export default function RequireOrg({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (!getOrgToken()) {
      window.location.href = '/org/login';
      return;
    }
    orgFetch('/org/me').then(({ error }) => {
      if (error) {
        window.location.href = '/org/login';
      } else {
        setStatus('ok');
      }
    });
  }, []);

  if (status === 'checking') return <div style={{ padding: 40 }}>Verifying session...</div>;
  return children;
}
