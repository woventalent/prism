import React from 'react';

export default function Toast({ msg, type = 'success' }) {
  const bg = type === 'error' ? '#dc2626' : type === 'warning' ? '#b45309' : '#16a34a';
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, background:bg, color:'#fff',
      padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600,
      boxShadow:'0 4px 20px rgba(0,0,0,0.2)', zIndex:9999,
      animation:'slideUp 0.25s ease',
      fontFamily:'Outfit,sans-serif',
    }}>
      {msg}
      <style>{`@keyframes slideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }`}</style>
    </div>
  );
}
