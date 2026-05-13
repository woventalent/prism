import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#F8F7EF',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'Outfit,sans-serif', padding:24
    }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{
            width:56, height:56, borderRadius:16, background:'#00259C',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', fontSize:22, fontWeight:800, color:'#fff'
          }}>R</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#00259C' }}>
            Recruitment Command Centre
          </h1>
          <p style={{ color:'#888', fontSize:13, marginTop:4 }}>AEW&amp;C Mk-II · Sign in to continue</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background:'#fff', borderRadius:16, padding:36,
          boxShadow:'0 4px 32px rgba(0,0,0,0.09)', border:'1px solid #e2e0d4'
        }}>
          {error && (
            <div style={{
              background:'#fee2e2', color:'#dc2626', padding:'10px 14px',
              borderRadius:8, fontSize:13, fontWeight:500, marginBottom:20
            }}>{error}</div>
          )}

          <Field label="Email Address">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@organisation.com" required
              style={inputStyle}
            />
          </Field>

          <Field label="Password">
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={inputStyle}
            />
          </Field>

          <button
            type="submit" disabled={loading}
            style={{
              width:'100%', padding:'12px', borderRadius:9,
              background: loading ? '#6b80c4' : '#00259C',
              color:'#fff', fontWeight:700, fontSize:15, border:'none',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop:8,
              transition:'background 0.15s'
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{ fontSize:11, color:'#aaa', textAlign:'center', marginTop:16 }}>
            Default — admin@aewc.org / Admin@123
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#444', marginBottom:6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:'100%', padding:'10px 13px', border:'1px solid #e2e0d4',
  borderRadius:8, background:'#faf9f3', fontSize:14, outline:'none',
  transition:'border-color 0.15s',
};
