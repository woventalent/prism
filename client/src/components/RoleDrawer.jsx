import React, { useEffect, useState, useCallback } from 'react';
import { getRole, updateRole, updateLifecycle, addPanelist, deletePanelist, updatePanelist, addChannel, deleteChannel, addApproval, updateApproval, deleteApproval } from '../api';
import { useAuth } from '../context/AuthContext';

const PRIMARY = '#00259C';
const DIFF_MAP = { green:{ bg:'#dcfce7', color:'#16a34a', label:'Easy to Fill' }, yellow:{ bg:'#fef3c7', color:'#b45309', label:'Moderate' }, red:{ bg:'#fee2e2', color:'#dc2626', label:'Hard to Fill' } };
const iS = { width:'100%', padding:'8px 11px', border:'1px solid #e2e0d4', borderRadius:7, background:'#faf9f3', fontSize:13, outline:'none', fontFamily:'Outfit,sans-serif' };

export default function RoleDrawer({ roleId, onClose, onUpdate, showToast }) {
  const { canEdit } = useAuth();
  const [role,    setRole]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRole(roleId);
      setRole(data);
      setDirty({});
    } catch { showToast('Failed to load role', 'error'); }
    finally  { setLoading(false); }
  }, [roleId, showToast]);

  useEffect(() => { load(); }, [load]);

  // ── Field update (local + debounced save) ─────────────────
  function setField(key, val) {
    setRole(r => ({ ...r, [key]: val }));
    setDirty(d => ({ ...d, [key]: val }));
  }

  async function saveChanges() {
    if (!Object.keys(dirty).length) return;
    setSaving(true);
    try {
      const updated = await updateRole(roleId, dirty);
      setRole(updated);
      onUpdate(updated);
      setDirty({});
      showToast('Changes saved');
    } catch { showToast('Save failed', 'error'); }
    finally { setSaving(false); }
  }

  // ── Lifecycle ─────────────────────────────────────────────
  async function saveLifecycle(key, val) {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    try {
      const lc = await updateLifecycle(roleId, { [key]: n });
      setRole(r => ({ ...r, lifecycle: lc }));
      showToast('Lifecycle updated');
    } catch { showToast('Failed to update lifecycle', 'error'); }
  }

  // ── Panelists ─────────────────────────────────────────────
  const [pForm, setPForm] = useState({ name:'', designation:'', email:'', phone:'' });
  async function handleAddPanelist() {
    if (!pForm.name) return;
    try {
      const p = await addPanelist(roleId, pForm);
      setRole(r => ({ ...r, panelists:[...r.panelists, p] }));
      setPForm({ name:'', designation:'', email:'', phone:'' });
      showToast('Panelist added');
    } catch { showToast('Failed to add panelist','error'); }
  }
  async function handleDelPanelist(pid) {
    try {
      await deletePanelist(roleId, pid);
      setRole(r => ({ ...r, panelists: r.panelists.filter(p => p.id !== pid) }));
      showToast('Panelist removed');
    } catch { showToast('Error','error'); }
  }

  // ── Sourcing channels ─────────────────────────────────────
  const [chInput, setChInput] = useState('');
  async function handleAddChannel() {
    if (!chInput.trim()) return;
    try {
      const c = await addChannel(roleId, { channel: chInput.trim() });
      setRole(r => ({ ...r, sourcing_channels:[...r.sourcing_channels, c] }));
      setChInput('');
      showToast('Channel added');
    } catch { showToast('Error','error'); }
  }
  async function handleDelChannel(cid) {
    try {
      await deleteChannel(roleId, cid);
      setRole(r => ({ ...r, sourcing_channels: r.sourcing_channels.filter(c => c.id !== cid) }));
    } catch { showToast('Error','error'); }
  }

  // ── Approvals ─────────────────────────────────────────────
  const [apInput, setApInput] = useState('');
  async function handleAddApproval() {
    if (!apInput.trim()) return;
    try {
      const a = await addApproval(roleId, { label: apInput.trim() });
      setRole(r => ({ ...r, approvals:[...r.approvals, a] }));
      setApInput('');
      showToast('Approval added');
    } catch { showToast('Error','error'); }
  }
  async function handleToggleApproval(ap) {
    const status = ap.status === 'approved' ? 'pending' : 'approved';
    try {
      const updated = await updateApproval(roleId, ap.id, { status });
      setRole(r => ({ ...r, approvals: r.approvals.map(a => a.id === ap.id ? updated : a) }));
    } catch { showToast('Error','error'); }
  }
  async function handleDelApproval(aid) {
    try {
      await deleteApproval(roleId, aid);
      setRole(r => ({ ...r, approvals: r.approvals.filter(a => a.id !== aid) }));
    } catch { showToast('Error','error'); }
  }

  // ─────────────────────────────────────────────────────────
  if (!role && loading) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#aaa' }}>Loading…</div>
      </Overlay>
    );
  }
  if (!role) return null;

  const diff = DIFF_MAP[role.difficulty] || DIFF_MAP.yellow;
  const lc   = role.lifecycle || {};
  const LC_STAGES = [
    { key:'sourcing',  label:'Sourcing'  },
    { key:'screening', label:'Screening' },
    { key:'interview', label:'Interview' },
    { key:'offered',   label:'Offered'   },
    { key:'joined',    label:'Joined'    },
  ];

  const hasDirty = Object.keys(dirty).length > 0;

  return (
    <Overlay onClose={onClose}>
      {/* Drawer header */}
      <div style={{ background:PRIMARY, padding:'20px 26px', position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1, paddingRight:16 }}>
            <div style={{ color:'#fff', fontSize:17, fontWeight:700, lineHeight:1.3 }}>{role.title}</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:3 }}>
              {role.experience} · ₹{parseFloat(role.ctc_budget).toFixed(0)}L CTC · {role.headcount} HC
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <span style={{ background:diff.bg, color:diff.color, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700 }}>● {diff.label}</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:30, height:30, borderRadius:'50%', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit,sans-serif' }}>✕</button>
          </div>
        </div>

        {hasDirty && canEdit && (
          <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flex:1, background:'rgba(255,255,255,0.12)', borderRadius:7, padding:'6px 12px', fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:500 }}>
              ✏️ You have unsaved changes
            </div>
            <button onClick={saveChanges} disabled={saving} style={{ padding:'6px 16px', background:'#fff', color:PRIMARY, border:'none', borderRadius:7, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setDirty({}); load(); }} style={{ padding:'6px 12px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'none', borderRadius:7, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>Discard</button>
          </div>
        )}
      </div>

      {/* Drawer body */}
      <div style={{ padding:'24px 26px', overflowY:'auto', flex:1 }}>

        {/* ── Lifecycle tracker ── */}
        <Section title="Lifecycle Tracker" icon="📊">
          <div style={{ display:'flex', borderRadius:9, overflow:'hidden', border:'1px solid #e2e0d4' }}>
            {LC_STAGES.map((s, idx) => {
              const count = parseInt(lc[s.key]) || 0;
              const isLast = s.key === 'joined';
              const bg = isLast && count > 0 ? '#dcfce7' : count > 0 ? '#e8edfa' : '#f5f3e8';
              const col= isLast && count > 0 ? '#16a34a' : count > 0 ? PRIMARY : '#aaa';
              return (
                <div key={s.key} style={{ flex:1, textAlign:'center', padding:'10px 6px', background:bg, borderRight: idx < LC_STAGES.length-1 ? '1px solid #e2e0d4' : 'none', cursor: canEdit ? 'pointer' : 'default' }}
                  onClick={() => { if (!canEdit) return; const v = prompt(`${s.label} count:`, count); if (v !== null) saveLifecycle(s.key, v); }}
                >
                  <div style={{ fontSize:20, fontWeight:800, color:col }}>{count}</div>
                  <div style={{ fontSize:10, fontWeight:600, color:col, textTransform:'uppercase', letterSpacing:0.4, marginTop:2 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
          {canEdit && <p style={{ fontSize:11, color:'#aaa', marginTop:6 }}>Click any stage to update the count.</p>}
        </Section>

        {/* ── Core role details ── */}
        <Section title="Role Details" icon="📋">
          <Grid2>
            <Field label="Role / Qualification">
              <input value={role.title} onChange={e => setField('title',e.target.value)} disabled={!canEdit} style={iS} />
            </Field>
            <Field label="Experience Range">
              <input value={role.experience} onChange={e => setField('experience',e.target.value)} disabled={!canEdit} style={iS} />
            </Field>
          </Grid2>
          <Grid3>
            <Field label="Headcount">
              <input type="number" min="0" value={role.headcount} onChange={e => setField('headcount',+e.target.value)} disabled={!canEdit} style={iS} />
            </Field>
            <Field label="CTC Budget (L)">
              <input type="number" min="0" step="0.5" value={role.ctc_budget} onChange={e => setField('ctc_budget',+e.target.value)} disabled={!canEdit} style={iS} />
            </Field>
            <Field label="Avg Time to Fill (Days)">
              <input type="number" min="0" value={role.avg_ttf_days||''} onChange={e => setField('avg_ttf_days',+e.target.value)} disabled={!canEdit} style={iS} placeholder="—" />
            </Field>
          </Grid3>
          <Grid2>
            <Field label="Positions Filled">
              <input type="number" min="0" value={role.filled||0} onChange={e => setField('filled',+e.target.value)} disabled={!canEdit} style={iS} />
            </Field>
            <Field label="In-Progress Candidates">
              <input type="number" min="0" value={role.in_progress||0} onChange={e => setField('in_progress',+e.target.value)} disabled={!canEdit} style={iS} />
            </Field>
          </Grid2>
          <Field label="Hiring Difficulty">
            <select value={role.difficulty} onChange={e => setField('difficulty',e.target.value)} disabled={!canEdit} style={iS}>
              <option value="green">🟢 Easy to Fill</option>
              <option value="yellow">🟡 Moderate</option>
              <option value="red">🔴 Hard to Fill</option>
            </select>
          </Field>
        </Section>

        {/* ── Recruitment Kit ── */}
        <Section title="Recruitment Kit" icon="🗂️">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'📄 Job Description', key:'jd_link' },
              { label:'📋 Questionnaire', key:'questionnaire_link' },
              { label:'🧪 Assessment Form', key:'assessment_link' },
              { label:'✍️ Interviewer Feedback Form', key:'feedback_form_link' },
            ].map(item => (
              <div key={item.key} style={{ background:'#f5f3e8', borderRadius:9, padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:0.4, marginBottom:8 }}>{item.label}</div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input
                    value={role[item.key]||''}
                    onChange={e => setField(item.key, e.target.value)}
                    disabled={!canEdit}
                    placeholder="Paste URL…"
                    style={{ ...iS, flex:1 }}
                  />
                  {role[item.key] && (
                    <a href={role[item.key]} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:12, color:PRIMARY, fontWeight:700, whiteSpace:'nowrap', textDecoration:'none' }}>
                      Open ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Recruiter Pitch ── */}
        <Section title="Recruiter Pitch" icon="💬">
          <p style={{ fontSize:11, color:'#aaa', marginBottom:8 }}>What recruiters should tell candidates about this role</p>
          <textarea
            value={role.recruiter_pitch||''}
            onChange={e => setField('recruiter_pitch', e.target.value)}
            disabled={!canEdit}
            rows={5}
            style={{ ...iS, resize:'vertical', lineHeight:1.6 }}
          />
        </Section>

        {/* ── Interview Panel ── */}
        <Section title="Interview Panel" icon="👥">
          {(!role.panelists || role.panelists.length === 0)
            ? <p style={{ color:'#bbb', fontSize:13, marginBottom:12 }}>No panelists added yet.</p>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                {role.panelists.map(p => (
                  <div key={p.id} style={{ background:'#f5f3e8', borderRadius:9, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{p.name} <span style={{ fontWeight:400, color:'#888', fontSize:12 }}>— {p.designation}</span></div>
                      <div style={{ fontSize:12, color:'#666', marginTop:3 }}>✉ {p.email || '—'} &nbsp;·&nbsp; 📞 {p.phone || '—'}</div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDelPanelist(p.id)} style={{ padding:'3px 10px', borderRadius:5, border:'none', background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'Outfit,sans-serif', flexShrink:0 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )
          }
          {canEdit && (
            <div style={{ background:'#f5f3e8', borderRadius:9, padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#555', marginBottom:10 }}>Add Panelist</div>
              <Grid2>
                <Field label="Full Name"><input value={pForm.name} onChange={e => setPForm(p=>({...p,name:e.target.value}))} placeholder="Name" style={iS} /></Field>
                <Field label="Designation"><input value={pForm.designation} onChange={e => setPForm(p=>({...p,designation:e.target.value}))} placeholder="e.g. Engineering Manager" style={iS} /></Field>
              </Grid2>
              <Grid2>
                <Field label="Email"><input type="email" value={pForm.email} onChange={e => setPForm(p=>({...p,email:e.target.value}))} placeholder="email@org.com" style={iS} /></Field>
                <Field label="Phone"><input value={pForm.phone} onChange={e => setPForm(p=>({...p,phone:e.target.value}))} placeholder="+91-XXXXX-XXXXX" style={iS} /></Field>
              </Grid2>
              <Btn onClick={handleAddPanelist}>Add to Panel</Btn>
            </div>
          )}
        </Section>

        {/* ── Sourcing Channels ── */}
        <Section title="Sourcing Channels" icon="📡">
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom: canEdit ? 12 : 0 }}>
            {(!role.sourcing_channels || role.sourcing_channels.length === 0)
              ? <span style={{ color:'#bbb', fontSize:13 }}>No channels added yet.</span>
              : role.sourcing_channels.map(c => (
                <span key={c.id} style={{ background:'#e8edfa', color:PRIMARY, padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6 }}>
                  {c.channel}
                  {canEdit && <span onClick={() => handleDelChannel(c.id)} style={{ cursor:'pointer', color:'#888', fontSize:15, lineHeight:1 }}>×</span>}
                </span>
              ))
            }
          </div>
          {canEdit && (
            <div style={{ display:'flex', gap:8 }}>
              <input value={chInput} onChange={e => setChInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAddChannel()}
                placeholder="Add channel (e.g. LinkedIn)…" style={{ ...iS, flex:1 }} />
              <Btn onClick={handleAddChannel}>Add</Btn>
            </div>
          )}
        </Section>

        {/* ── Approvals ── */}
        <Section title="Approvals Required" icon="✅" last>
          {(!role.approvals || role.approvals.length === 0)
            ? <p style={{ color:'#bbb', fontSize:13, marginBottom: canEdit ? 12 : 0 }}>No approvals added.</p>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom: canEdit ? 14 : 0 }}>
                {role.approvals.map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f5f3e8', borderRadius:7 }}>
                    <div
                      onClick={() => canEdit && handleToggleApproval(a)}
                      title={canEdit ? 'Click to toggle' : undefined}
                      style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, cursor: canEdit ? 'pointer' : 'default', background: a.status==='approved' ? '#16a34a' : '#e2e0d4', transition:'background 0.2s' }}
                    />
                    <span style={{ flex:1, fontSize:13 }}>{a.label}</span>
                    <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color: a.status==='approved' ? '#16a34a' : '#b45309' }}>{a.status}</span>
                    {canEdit && <button onClick={() => handleDelApproval(a.id)} style={{ padding:'2px 8px', borderRadius:4, border:'none', background:'#fee2e2', color:'#dc2626', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>✕</button>}
                  </div>
                ))}
              </div>
            )
          }
          {canEdit && (
            <div style={{ display:'flex', gap:8 }}>
              <input value={apInput} onChange={e => setApInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAddApproval()}
                placeholder="Add approval step…" style={{ ...iS, flex:1 }} />
              <Btn onClick={handleAddApproval}>Add</Btn>
            </div>
          )}
        </Section>

      </div>
    </Overlay>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Overlay({ children, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:150 }} />
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:680, maxWidth:'96vw',
        background:'#fff', zIndex:151, display:'flex', flexDirection:'column',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.15)', fontFamily:'Outfit,sans-serif'
      }}>
        {children}
      </div>
    </>
  );
}

function Section({ title, icon, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 28, paddingBottom: last ? 0 : 24, borderBottom: last ? 'none' : '1px solid #f0ede0' }}>
      <div style={{ fontSize:12, fontWeight:700, color:PRIMARY, textTransform:'uppercase', letterSpacing:0.6, marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#666', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

function Grid2({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>{children}</div>; }
function Grid3({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>{children}</div>; }
function Btn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding:'8px 16px', background:PRIMARY, color:'#fff', border:'none', borderRadius:7, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'Outfit,sans-serif', whiteSpace:'nowrap' }}>
      {children}
    </button>
  );
}
