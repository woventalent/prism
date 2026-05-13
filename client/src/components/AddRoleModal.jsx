import React, { useState } from 'react';

const FIELD = (label, key, type='text', placeholder='') => ({ label, key, type, placeholder });

export default function AddRoleModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title:'', experience:'', headcount:1, ctc_budget:5,
    difficulty:'yellow', avg_ttf_days:'',
    jd_link:'', questionnaire_link:'', assessment_link:'', feedback_form_link:'',
    recruiter_pitch:''
  });

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await onCreate({
      ...form,
      headcount: parseInt(form.headcount) || 1,
      ctc_budget: parseFloat(form.ctc_budget) || 5,
      avg_ttf_days: parseInt(form.avg_ttf_days) || null,
    });
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'90vh', overflow:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ background:'#00259C', padding:'22px 28px', borderRadius:'16px 16px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ color:'#fff', fontSize:18, fontWeight:700 }}>Add New Role</h2>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:30, height:30, borderRadius:'50%', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:28 }}>
          <Row>
            <F label="Role / Qualification *" full>
              <input value={form.title} onChange={e => set('title',e.target.value)} placeholder="e.g. B.Tech / M.Tech (CSE)" required style={iS} />
            </F>
          </Row>
          <Row>
            <F label="Experience Range">
              <input value={form.experience} onChange={e => set('experience',e.target.value)} placeholder="e.g. 3–5 Yrs" style={iS} />
            </F>
            <F label="Headcount">
              <input type="number" min="1" value={form.headcount} onChange={e => set('headcount',e.target.value)} style={iS} />
            </F>
          </Row>
          <Row>
            <F label="CTC Budget (L)">
              <input type="number" min="1" step="0.5" value={form.ctc_budget} onChange={e => set('ctc_budget',e.target.value)} style={iS} />
            </F>
            <F label="Avg Time to Fill (Days)">
              <input type="number" min="1" value={form.avg_ttf_days} onChange={e => set('avg_ttf_days',e.target.value)} placeholder="30" style={iS} />
            </F>
          </Row>
          <F label="Hiring Difficulty">
            <select value={form.difficulty} onChange={e => set('difficulty',e.target.value)} style={iS}>
              <option value="green">🟢 Easy to Fill</option>
              <option value="yellow">🟡 Moderate</option>
              <option value="red">🔴 Hard to Fill</option>
            </select>
          </F>
          <div style={{ borderTop:'1px solid #f0ede0', margin:'16px 0', paddingTop:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#00259C', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 }}>Recruitment Kit Links (optional)</div>
            <Row>
              <F label="JD Link"><input value={form.jd_link} onChange={e => set('jd_link',e.target.value)} placeholder="https://..." style={iS} /></F>
              <F label="Questionnaire Link"><input value={form.questionnaire_link} onChange={e => set('questionnaire_link',e.target.value)} placeholder="https://..." style={iS} /></F>
            </Row>
            <Row>
              <F label="Assessment Form Link"><input value={form.assessment_link} onChange={e => set('assessment_link',e.target.value)} placeholder="https://..." style={iS} /></F>
              <F label="Feedback Form Link"><input value={form.feedback_form_link} onChange={e => set('feedback_form_link',e.target.value)} placeholder="https://..." style={iS} /></F>
            </Row>
          </div>
          <F label="Recruiter Pitch">
            <textarea value={form.recruiter_pitch} onChange={e => set('recruiter_pitch',e.target.value)} rows={3} placeholder="What should recruiters tell candidates about this role?" style={{ ...iS, resize:'vertical' }} />
          </F>

          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button type="submit" style={{ flex:1, padding:11, background:'#00259C', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Create Role</button>
            <button type="button" onClick={onClose} style={{ padding:'11px 18px', background:'transparent', border:'1px solid #e2e0d4', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:0 }}>{children}</div>; }
function F({ label, children, full }) { return <div style={{ marginBottom:14, gridColumn: full ? 'span 2' : undefined }}><label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555', marginBottom:5 }}>{label}</label>{children}</div>; }
const iS = { width:'100%', padding:'9px 12px', border:'1px solid #e2e0d4', borderRadius:7, background:'#faf9f3', fontSize:13, outline:'none', fontFamily:'Outfit,sans-serif' };
