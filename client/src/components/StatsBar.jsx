import React from 'react';

export default function StatsBar({ roles }) {
  const totalHC     = roles.reduce((s, r) => s + (r.headcount || 0), 0);
  const totalFilled = roles.reduce((s, r) => s + (r.filled || 0), 0);
  const totalBudget = roles.reduce((s, r) => s + ((r.headcount||0) * parseFloat(r.ctc_budget||0)), 0);
  const hardRoles   = roles.filter(r => r.difficulty === 'red').length;
  const avgTTF      = roles.length
    ? Math.round(roles.reduce((s,r) => s + (r.avg_ttf_days||0), 0) / roles.length)
    : 0;

  const cards = [
    { label:'Total Headcount',      value: totalHC,         sub:`across ${roles.length} roles`,           color:'#00259C' },
    { label:'Positions Filled',     value: totalFilled,     sub:`${totalHC - totalFilled} remaining`,      color:'#16a34a' },
    { label:'Total CTC Budget',     value:`₹${totalBudget.toFixed(0)}L`, sub:'per annum',                color:'#00259C' },
    { label:'Hard-to-Fill Roles',   value: hardRoles,       sub:'require focused sourcing',               color:'#dc2626' },
    { label:'Avg. Time to Fill',    value:`${avgTTF}d`,     sub:'across all roles',                       color:'#b45309' },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background:'#fff', border:'1px solid #e2e0d4', borderRadius:12,
          padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</div>
          <div style={{ fontSize:28, fontWeight:800, color:c.color, margin:'4px 0 2px', lineHeight:1 }}>{c.value}</div>
          <div style={{ fontSize:11, color:'#aaa' }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
