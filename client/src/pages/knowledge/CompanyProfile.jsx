import React, { useState, useEffect, useRef } from 'react';
import { getKnowledge, saveKnowledge } from '../../api/index';
import { useAuth } from '../../context/AuthContext';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const C = {
  blue: '#00259C', lightBlue: '#E8EDFB', red: '#DC2626',
  border: '#E2E8F0', card: '#fff', bg: '#F4F7FB',
  text: '#1E293B', muted: '#64748B',
};

const btn = (color, bg, border) => ({
  padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', border: `1px solid ${border || color}`,
  color, background: bg || 'transparent', transition: 'opacity 0.15s',
});

export default function CompanyProfile({ printRef }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'recruiter';
  const [data, setData]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [editing, setEditing] = useState({});   // sectionId → true
  const [draft, setDraft]     = useState({});   // sectionId → draft data

  useEffect(() => {
    getKnowledge('company_profile').then(d => {
      if (d) setData(d);
    });
  }, []);

  if (!data) return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;

  /* ── helpers ── */
  function startEdit(sid) {
    const sec = data.sections.find(s => s.id === sid);
    setDraft(d => ({ ...d, [sid]: JSON.parse(JSON.stringify(sec)) }));
    setEditing(e => ({ ...e, [sid]: true }));
  }
  function cancelEdit(sid) {
    setEditing(e => ({ ...e, [sid]: false }));
    setDraft(d => { const c = { ...d }; delete c[sid]; return c; });
  }
  function commitEdit(sid) {
    const updated = data.sections.map(s => s.id === sid ? draft[sid] : s);
    setData({ ...data, sections: updated });
    setEditing(e => ({ ...e, [sid]: false }));
    setDraft(d => { const c = { ...d }; delete c[sid]; return c; });
  }

  async function saveAll(sectionsOverride) {
    setSaving(true);
    try {
      const payload = { sections: sectionsOverride || data.sections };
      await saveKnowledge('company_profile', payload);
      setData(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  function addSection() {
    const newSec = { id: uid(), title: 'New Section', subsections: [] };
    const updated = { sections: [...data.sections, newSec] };
    setData(updated);
  }
  function removeSection(sid) {
    const updated = { sections: data.sections.filter(s => s.id !== sid) };
    setData(updated);
  }

  /* ── draft helpers ── */
  function dSet(sid, path, value) {
    setDraft(d => {
      const sec = JSON.parse(JSON.stringify(d[sid]));
      const parts = path.split('.');
      let cur = sec;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return { ...d, [sid]: sec };
    });
  }
  function dSubSet(sid, subIdx, field, value) {
    setDraft(d => {
      const sec = JSON.parse(JSON.stringify(d[sid]));
      sec.subsections[subIdx][field] = value;
      return { ...d, [sid]: sec };
    });
  }
  function dAddSub(sid) {
    setDraft(d => {
      const sec = JSON.parse(JSON.stringify(d[sid]));
      sec.subsections.push({ id: uid(), title: 'New Subsection', type: 'text', content: '' });
      return { ...d, [sid]: sec };
    });
  }
  function dRemoveSub(sid, subIdx) {
    setDraft(d => {
      const sec = JSON.parse(JSON.stringify(d[sid]));
      sec.subsections.splice(subIdx, 1);
      return { ...d, [sid]: sec };
    });
  }
  function dAddItem(sid, subIdx) {
    setDraft(d => {
      const sec = JSON.parse(JSON.stringify(d[sid]));
      sec.subsections[subIdx].items = [...(sec.subsections[subIdx].items || []), ''];
      return { ...d, [sid]: sec };
    });
  }
  function dSetItem(sid, subIdx, itemIdx, val) {
    setDraft(d => {
      const sec = JSON.parse(JSON.stringify(d[sid]));
      sec.subsections[subIdx].items[itemIdx] = val;
      return { ...d, [sid]: sec };
    });
  }
  function dRemoveItem(sid, subIdx, itemIdx) {
    setDraft(d => {
      const sec = JSON.parse(JSON.stringify(d[sid]));
      sec.subsections[subIdx].items.splice(itemIdx, 1);
      return { ...d, [sid]: sec };
    });
  }

  return (
    <div ref={printRef} style={{ padding: '28px 32px' }}>
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: C.blue, fontSize: 22, fontWeight: 700 }}>Company Profile</h2>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>
            Adani Defence &amp; Aerospace — Talent Acquisition Intelligence
          </p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addSection}>+ Add Section</button>
            <button
              style={btn('#fff', saving ? '#93A8DC' : C.blue, C.blue)}
              onClick={() => saveAll()}
              disabled={saving}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save All Changes'}
            </button>
          </div>
        )}
      </div>

      {/* sections */}
      {data.sections.map((sec) => {
        const isEdit = editing[sec.id];
        const d = isEdit ? draft[sec.id] : sec;

        return (
          <div key={sec.id} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, marginBottom: 20, overflow: 'hidden',
          }}>
            {/* section header */}
            <div style={{
              background: C.lightBlue, padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: `1px solid ${C.border}`,
            }}>
              {isEdit ? (
                <input
                  value={d.title}
                  onChange={e => dSet(sec.id, 'title', e.target.value)}
                  style={{ fontSize: 16, fontWeight: 700, color: C.blue, border: `1.5px solid ${C.blue}`, borderRadius: 6, padding: '4px 10px', width: '60%', fontFamily: 'inherit' }}
                />
              ) : (
                <h3 style={{ margin: 0, color: C.blue, fontSize: 16, fontWeight: 700 }}>{sec.title}</h3>
              )}
              {canEdit && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {isEdit ? (
                    <>
                      <button style={btn('#fff', C.blue, C.blue)} onClick={() => { commitEdit(sec.id); saveAll(data.sections.map(s => s.id === sec.id ? draft[sec.id] : s)); }}>Save</button>
                      <button style={btn(C.muted, '#fff', C.border)} onClick={() => cancelEdit(sec.id)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button style={btn(C.blue, '#fff', C.border)} onClick={() => startEdit(sec.id)}>Edit</button>
                      <button style={btn(C.red, '#FEF2F2', '#FCA5A5')} onClick={() => removeSection(sec.id)}>Remove</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* subsections */}
            <div style={{ padding: '16px 20px' }}>
              {d.subsections.map((sub, si) => (
                <div key={sub.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: si < d.subsections.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
                  {isEdit ? (
                    <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={sub.title}
                        onChange={e => dSubSet(sec.id, si, 'title', e.target.value)}
                        placeholder="Subsection title"
                        style={{ flex: 1, fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', fontFamily: 'inherit' }}
                      />
                      <select
                        value={sub.type}
                        onChange={e => dSubSet(sec.id, si, 'type', e.target.value)}
                        style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, fontFamily: 'inherit' }}
                      >
                        <option value="text">Text</option>
                        <option value="list">List</option>
                      </select>
                      <button style={btn(C.red, '#FEF2F2', '#FCA5A5')} onClick={() => dRemoveSub(sec.id, si)}>✕</button>
                    </div>
                  ) : (
                    <h4 style={{ margin: '0 0 8px', color: C.text, fontSize: 13, fontWeight: 600 }}>{sub.title}</h4>
                  )}

                  {sub.type === 'text' ? (
                    isEdit ? (
                      <textarea
                        value={sub.content || ''}
                        onChange={e => dSubSet(sec.id, si, 'content', e.target.value)}
                        rows={4}
                        style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 13, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <p style={{ margin: 0, color: C.text, fontSize: 13, lineHeight: 1.7 }}>{sub.content}</p>
                    )
                  ) : (
                    <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                      {(sub.items || []).map((item, ii) => (
                        <li key={ii} style={{ color: C.text, fontSize: 13, lineHeight: 1.7, marginBottom: isEdit ? 6 : 2 }}>
                          {isEdit ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                value={item}
                                onChange={e => dSetItem(sec.id, si, ii, e.target.value)}
                                style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 13, fontFamily: 'inherit' }}
                              />
                              <button style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), padding: '3px 8px' }} onClick={() => dRemoveItem(sec.id, si, ii)}>✕</button>
                            </div>
                          ) : item}
                        </li>
                      ))}
                      {isEdit && (
                        <li style={{ listStyle: 'none', marginTop: 6 }}>
                          <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={() => dAddItem(sec.id, si)}>+ Add Item</button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}

              {isEdit && (
                <button style={{ ...btn(C.blue, C.lightBlue, C.blue), marginTop: 4 }} onClick={() => dAddSub(sec.id)}>
                  + Add Subsection
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
