import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const payload = searchParams.get('payload');
    const error   = searchParams.get('error');

    if (error) {
      const messages = {
        unauthorized_tenant: 'Your account does not belong to the Woven Talent organisation.',
        unauthorized_domain: 'Only @woventalent.in accounts are allowed.',
        invalid_state:       'Authentication session expired. Please try again.',
        sso_unavailable:     'Single sign-on is temporarily unavailable.',
        auth_failed:         'Authentication failed. Please try again.',
      };
      setErrorMsg(messages[error] || decodeURIComponent(error));
      return;
    }

    if (!payload) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      loginWithToken(data);

      const cs = data.clients || [];
      if (cs.length === 1 && !data.user?.is_super_admin) {
        navigate(`/w/${cs[0].slug}`, { replace: true });
      } else {
        navigate('/workspaces', { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, []); // eslint-disable-line

  if (errorMsg) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F8F7EF', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', padding: 24,
      }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
          <h2 style={{ color: '#DC2626', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>{errorMsg}</p>
          <a
            href="/login"
            style={{
              display: 'inline-block', padding: '10px 24px', background: '#00259C',
              color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}
          >
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F8F7EF', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid #00259C', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: '#00259C', fontWeight: 600, fontSize: 14 }}>Signing you in…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
