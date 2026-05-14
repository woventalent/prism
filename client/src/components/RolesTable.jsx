import React from 'react';

const DIFF = {
  green:  { label:'Easy',     bg:'#dcfce7', color:'#16a34a' },
  yellow: { label:'Moderate', bg:'#fef3c7', color:'#b45309' },
  red:    { label:'Hard',     bg:'#fee2e2', color:'#dc2626' },
};

export default function RolesTable({ roles, onSelect, onDelete, selectedId }) {
  if (!roles.length) {
    return (
      <div style={{ background:'#fff', border:'1px solid #e2e0d4', borderRadius:12, padding:60, textAlign:'center', color:'#aaa' }}>
        No roles match your filter.
      </div>
    );
  }

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e0d4', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f5f3e8' }}>
              {['#','Role / Qualification','Experience','HC','CTC Budget','Filled','Pipeline','Difficulty','Avg TTF',''].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#00259C', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #e2e0d4', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r, i) => {
              const pct  = r.headcount > 0 ? Math.round((r.filled / r.headcount) * 100) : 0;
              const diff = DIFF[r.difficulty] || DIFF.yellow;
              const isSelected = selectedId === r.id;
              return (
                <tr key={r.id}
                  onClick={() => onSelect(r.id === selectedId ? null : r.id)}
                  style={{ borderBottom:'1px solid #f0ede0', background: isSelected ? '#f0f4ff' : 'transparent', transition:'background 0.15s', cursor:'pointer' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f0f4ff'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding:'13px 16px', color:'#bbb', fontSize:12 }}>{i + 1}</td>
                  <td style={{ padding:'13px 16px', fontWeight:600, maxWidth:240, lineHeight:1.4 }}>{r.title}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ background:'#e8edfa', color:'#00259C', padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:700 }}>{r.experience}</span>
                  </td>
                  <td style={{ padding:'13px 16px', fontWeight:800, fontSize:16, color:'#00259C' }}>{r.headcount}</td>
                  <td style={{ padding:'13px 16px', fontWeight:600 }}>₹{parseFloat(r.ctc_budget).toFixed(0)}L</td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:120 }}>
                      <div style={{ flex:1, height:5, background:'#e5e3d8', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:99, background:'#00259C', width:`${pct}%`, transition:'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize:11, color:'#666', whiteSpace:'nowrap' }}>{r.filled}/{r.headcount}</span>
                    </div>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:'#666' }}>{r.in_progress || 0} active</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ background:diff.bg, color:diff.color, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block' }} />
                      {diff.label}
                    </span>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:'#666' }}>{r.avg_ttf_days ? `${r.avg_ttf_days}d` : '—'}</td>
                  <td style={{ padding:'13px 16px' }} onClick={e => e.stopPropagation()}>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(r.id)}
                        style={{ padding:'5px 10px', borderRadius:6, border:'none', background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}
                      >✕</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
