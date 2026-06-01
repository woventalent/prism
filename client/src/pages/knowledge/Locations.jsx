import React, { useState, useEffect } from 'react';
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

export default function Locations({ printRef }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'recruiter';
  const [data, setData]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [editing, setEditing] = useState({});
  const [draft, setDraft]     = useState({});

  useEffect(() => { getKnowledge('locations').then(d => { if (d) setData(d); }); }, []);

  if (!data) return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;

  function startEdit(lid) {
    const loc = data.locations.find(l => l.id === lid);
    setDraft(d => ({ ...d, [lid]: JSON.parse(JSON.stringify(loc)) }));
    setEditing(e => ({ ...e, [lid]: true }));
  }
  function cancelEdit(lid) {
    setEditing(e => ({ ...e, [lid]: false }));
    setDraft(d => { const c = { ...d }; delete c[lid]; return c; });
  }
  function commitEdit(lid) {
    const updated = data.locations.map(l => l.id === lid ? draft[lid] : l);
    setData({ locations: updated });
    setEditing(e => ({ ...e, [lid]: false }));
    setDraft(d => { const c = { ...d }; delete c[lid]; return c; });
  }

  async function saveAll(locsOverride) {
    setSaving(true);
    try {
      const payload = { locations: locsOverride || data.locations };
      await saveKnowledge('locations', payload);
      setData(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  function addLocation() {
    const newLoc = {
      id: uid(), name: 'New Location',
      sections: [
        { id: uid(), title: 'About the Location', type: 'text', content: '' },
        { id: uid(), title: 'Candidate Pitch Points', type: 'list', items: [] },
      ],
    };
    setData({ locations: [...data.locations, newLoc] });
  }
  function removeLocation(lid) {
    setData({ locations: data.locations.filter(l => l.id !== lid) });
  }

  /* draft helpers */
  function dSet(lid, field, val) {
    setDraft(d => ({ ...d, [lid]: { ...d[lid], [field]: val } }));
  }
  function dSecSet(lid, si, field, val) {
    setDraft(d => {
      const loc = JSON.parse(JSON.stringify(d[lid]));
      loc.sections[si][field] = val;
      return { ...d, [lid]: loc };
    });
  }
  function dAddSec(lid) {
    setDraft(d => {
      const loc = JSON.parse(JSON.stringify(d[lid]));
      loc.sections.push({ id: uid(), title: 'New Section', type: 'list', items: [] });
      return { ...d, [lid]: loc };
    });
  }
  function dRemoveSec(lid, si) {
    setDraft(d => {
      const loc = JSON.parse(JSON.stringify(d[lid]));
      loc.sections.splice(si, 1);
      return { ...d, [lid]: loc };
    });
  }
  function dAddItem(lid, si) {
    setDraft(d => {
      const loc = JSON.parse(JSON.stringify(d[lid]));
      loc.sections[si].items = [...(loc.sections[si].items || []), ''];
      return { ...d, [lid]: loc };
    });
  }
  function dSetItem(lid, si, ii, val) {
    setDraft(d => {
      const loc = JSON.parse(JSON.stringify(d[lid]));
      loc.sections[si].items[ii] = val;
      return { ...d, [lid]: loc };
    });
  }
  function dRemoveItem(lid, si, ii) {
    setDraft(d => {
      const loc = JSON.parse(JSON.stringify(d[lid]));
      loc.sections[si].items.splice(ii, 1);
      return { ...d, [lid]: loc };
    });
  }

  return (
    <div ref={printRef} style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: C.blue, fontSize: 22, fontWeight: 700 }}>Locations</h2>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>City guides and candidate pitch intelligence for each hiring location</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addLocation}>+ Add Location</button>
            <button style={btn('#fff', saving ? '#93A8DC' : C.blue, C.blue)} onClick={() => saveAll()} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save All Changes'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 20 }}>
        {data.locations.map((loc) => {
          const isEdit = editing[loc.id];
          const d = isEdit ? draft[loc.id] : loc;

          return (
            <div key={loc.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* location header */}
              <div style={{ background: C.blue, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {isEdit ? (
                  <input
                    value={d.name}
                    onChange={e => dSet(loc.id, 'name', e.target.value)}
                    style={{ fontSize: 15, fontWeight: 700, color: C.blue, border: 'none', borderRadius: 6, padding: '4px 10px', fontFamily: 'inherit', width: '60%' }}
                  />
                ) : (
                  <h3 style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700 }}>📍 {loc.name}</h3>
                )}
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {isEdit ? (
                      <>
                        <button style={btn(C.blue, '#fff', '#fff')} onClick={() => { commitEdit(loc.id); saveAll(data.locations.map(l => l.id === loc.id ? draft[loc.id] : l)); }}>Save</button>
                        <button style={btn('rgba(255,255,255,0.7)', 'transparent', 'rgba(255,255,255,0.4)')} onClick={() => cancelEdit(loc.id)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button style={btn('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)')} onClick={() => startEdit(loc.id)}>Edit</button>
                        <button style={btn('#FCA5A5', '#7F1D1D', '#7F1D1D')} onClick={() => removeLocation(loc.id)}>Remove</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* location sections */}
              <div style={{ padding: '16px 20px' }}>
                {d.sections.map((sec, si) => (
                  <div key={sec.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: si < d.sections.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
                    {isEdit ? (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                        <input
                          value={sec.title}
                          onChange={e => dSecSet(loc.id, si, 'title', e.target.value)}
                          style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                        />
                        <select
                          value={sec.type}
                          onChange={e => dSecSet(loc.id, si, 'type', e.target.value)}
                          style={{ border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 6px', fontSize: 11, fontFamily: 'inherit' }}
                        >
                          <option value="text">Text</option>
                          <option value="list">List</option>
                        </select>
                        <button style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), padding: '3px 8px' }} onClick={() => dRemoveSec(loc.id, si)}>✕</button>
                      </div>
                    ) : (
                      <h4 style={{ margin: '0 0 8px', color: C.blue, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{sec.title}</h4>
                    )}

                    {sec.type === 'text' ? (
                      isEdit ? (
                        <textarea
                          value={sec.content || ''}
                          onChange={e => dSecSet(loc.id, si, 'content', e.target.value)}
                          rows={4}
                          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }}
                        />
                      ) : (
                        <p style={{ margin: 0, color: C.text, fontSize: 13, lineHeight: 1.7 }}>{sec.content}</p>
                      )
                    ) : (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {(sec.items || []).map((item, ii) => (
                          <li key={ii} style={{ color: C.text, fontSize: 12, lineHeight: 1.7, marginBottom: isEdit ? 5 : 1 }}>
                            {isEdit ? (
                              <div style={{ display: 'flex', gap: 5 }}>
                                <input
                                  value={item}
                                  onChange={e => dSetItem(loc.id, si, ii, e.target.value)}
                                  style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 4, padding: '3px 7px', fontSize: 12, fontFamily: 'inherit' }}
                                />
                                <button style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), padding: '2px 7px' }} onClick={() => dRemoveItem(loc.id, si, ii)}>✕</button>
                              </div>
                            ) : item}
                          </li>
                        ))}
                        {isEdit && (
                          <li style={{ listStyle: 'none', marginTop: 5 }}>
                            <button style={{ ...btn(C.blue, C.lightBlue, C.blue), padding: '3px 10px', fontSize: 11 }} onClick={() => dAddItem(loc.id, si)}>+ Add Item</button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
                {isEdit && (
                  <button style={{ ...btn(C.blue, C.lightBlue, C.blue), fontSize: 11 }} onClick={() => dAddSec(loc.id)}>
                    + Add Section
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
