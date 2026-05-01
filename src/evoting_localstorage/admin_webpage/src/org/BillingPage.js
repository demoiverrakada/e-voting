import React, { useEffect, useState } from 'react';
import { orgFetch } from './api';
import OrgLayout from './OrgLayout';

export default function BillingPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    orgFetch('/billing/status').then(({ data, error }) => {
      if (!error) setStatus(data);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async () => {
    setPaying(true);
    setMessage('');
    const { data, error } = await orgFetch('/billing/create-order', { method: 'POST' });
    if (error) { setMessage('Could not initiate payment: ' + error); setPaying(false); return; }

    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      name: 'OpenVoting',
      description: 'Upgrade to Paid Plan',
      order_id: data.order_id,
      handler: async (response) => {
        const { data: vData, error: vError } = await orgFetch('/billing/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        if (vError) { setMessage('Payment verification failed: ' + vError); }
        else { setMessage('🎉 Upgraded to Paid plan!'); setStatus(s => ({ ...s, plan: 'paid' })); }
        setPaying(false);
      },
      prefill: { email: data.org_email, name: data.org_name },
      theme: { color: '#007bff' },
    };

    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => { new window.Razorpay(options).open(); };
      document.body.appendChild(script);
    } else {
      new window.Razorpay(options).open();
      setPaying(false);
    }
  };

  if (loading) return <OrgLayout><p>Loading billing info...</p></OrgLayout>;

  return (
    <OrgLayout>
      <h2>Billing & Plan</h2>
      <div style={{ maxWidth: 500, background: 'white', padding: 30, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <p><strong>Current Plan:</strong> <span style={{ textTransform: 'uppercase', color: status?.plan === 'paid' ? '#28a745' : '#6c757d', fontWeight: 'bold' }}>{status?.plan}</span></p>
        <p><strong>Elections Created:</strong> {status?.elections_created || 0} {status?.plan === 'free' ? '/ 2' : '/ unlimited'}</p>
        {status?.plan === 'paid' && <p style={{ color: '#28a745' }}>✅ You are on the Paid plan. All features unlocked.</p>}
        {status?.plan === 'free' && (
          <>
            <hr />
            <h3>Upgrade to Paid — ₹999</h3>
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>Unlimited elections</li>
              <li>Unlimited voters per election</li>
              <li>Priority support</li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={paying}
              style={{ padding: '12px 28px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, marginTop: 10 }}
            >
              {paying ? 'Processing...' : 'Upgrade Now'}
            </button>
          </>
        )}
        {message && <p style={{ marginTop: 16, color: message.startsWith('🎉') ? '#28a745' : '#dc3545' }}>{message}</p>}
      </div>
    </OrgLayout>
  );
}
