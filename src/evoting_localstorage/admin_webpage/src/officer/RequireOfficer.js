import React, { useEffect, useState } from 'react';
import { getOfficerToken, officerFetch } from './api';

export default function RequireOfficer({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (!getOfficerToken()) {
      window.location.href = '/officer/login';
      return;
    }
    officerFetch('/officer/booth/session').then(({ error }) => {
      if (error) window.location.href = '/officer/login';
      else setStatus('ok');
    });
  }, []);

  if (status === 'checking') return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Verifying session...</div>;
  return children;
}
