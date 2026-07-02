import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const ERROR_MESSAGES = {
  unauthorized_tenant: 'Your account does not belong to the Woven Talent organisation.',
  unauthorized_domain: 'Only @woventalent.in accounts are permitted.',
  invalid_state:       'Authentication session expired. Please try again.',
  sso_unavailable:     'Single sign-on is temporarily unavailable. Contact your admin.',
  auth_failed:         'Authentication failed. Please try again.',
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const errorMsg = error ? (ERROR_MESSAGES[error] || decodeURIComponent(error)) : null;

  function handleMicrosoftLogin() {
    window.location.href = '/api/auth/microsoft';
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #001A7A 0%, #00259C 50%, #1a3ab8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Outfit, sans-serif', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 28, fontWeight: 900, color: '#fff',
            letterSpacing: '-1px',
          }}>⬡</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            Prism
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6 }}>
            Talent Intelligence Platform · Woven Talent
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#1E293B', textAlign: 'center' }}>
            Welcome back
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: '#64748B', textAlign: 'center' }}>
            Sign in with your Woven Talent Microsoft account
          </p>

          {errorMsg && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626', padding: '12px 16px',
              borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 20,
              border: '1px solid #FCA5A5', lineHeight: 1.4,
            }}>
              {errorMsg}
            </div>
          )}

          {/* Microsoft Sign-In Button */}
          <button
            onClick={handleMicrosoftLogin}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 10,
              border: '1.5px solid #E2E8F0', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#1E293B',
              transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFF'; e.currentTarget.style.borderColor = '#00259C'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,37,156,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
          >
            {/* Microsoft logo */}
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1"  y="1"  width="9" height="9" fill="#F35325"/>
              <rect x="11" y="1"  width="9" height="9" fill="#81BC06"/>
              <rect x="1"  y="11" width="9" height="9" fill="#05A6F0"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFBA08"/>
            </svg>
            Sign in with Microsoft
          </button>

          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            Access is restricted to <strong>@woventalent.in</strong> accounts.
            <br />Contact your administrator if you need access.
          </p>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          © {new Date().getFullYear()} Woven Talent · Powered by Prism
        </p>
      </div>
    </div>
  );
}
