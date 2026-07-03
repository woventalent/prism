import React, { useState, useEffect, useRef } from 'react';
import { getKnowledge, saveKnowledge } from '../../api/index';
import { useClient } from '../../context/ClientContext';
import RichTextEditor, { RichTextView } from '../../components/RichTextEditor';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const C = {
  blue: '#00259C', lightBlue: '#E8EDFB', red: '#DC2626',
  border: '#E2E8F0', card: '#fff', text: '#1E293B', muted: '#64748B',
};
const btn = (color, bg, border) => ({
  padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', border: `1px solid ${border || color}`,
  color, background: bg || 'transparent',
});
const iconBtn = (color = C.muted) => ({
  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
  borderRadius: 4, fontSize: 13, color, lineHeight: 1,
});

export default function Locations({ printRef }) {
  const { canEdit } = useClient() || {};

  const [data, setData]         = useState(null);
  const [loaded, setLoaded]     = useState(false);
  const [editing, setEditing]   = useState({});
  const [saveStatus, setSaveStatus] = useState('idle');
  const saveTimer = useRef(null);

  useEffect(() => {
    getKnowledge('locations').then(d => {
      if (d) setData(d);
      setLoaded(true);
    });
  }, []);

  // #20 — Autosave
  useEffect(() => {
    if (!loaded || !data) return;
    clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await saveKnowledge('locations', data);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded]);

  if (!data) return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;

  /* ── Location helpers ── */
  function updateLoc(lid, updater) {
    setData(d => ({ locations: d.locations.map(l => l.id === lid ? updater(l) : l) }));
  }
  function addLocation() {
    setData(d => ({
      locations: [...d.locations, {
        id: uid(), name: 'New Location',
        sections: [
          { id: uid(), title: 'About the Location', type: 'text', content: '' },
          { id: uid(), title: 'Candidate Pitch Points', type: 'list', items: [] },
        ],
      }],
    }));
  }
  function removeLocation(lid) {
    setData(d => ({ locations: d.locations.filter(l => l.id !== lid) }));
  }
  // #15 — reorder
  function moveLoc(lid, dir) {
    setData(d => {
      const arr = [...d.locations];
      const i = arr.findIndex(l => l.id === lid);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { locations: arr };
    });
  }

  /* ── Section helpers (within a location) ── */
  function addSection(lid) {
    updateLoc(lid, l => ({ ...l, sections: [...l.sections, { id: uid(), title: 'New Section', type: 'list', items: [] }] }));
  }
  function removeSection(lid, sid) {
    updateLoc(lid, l => ({ ...l, sections: l.sections.filter(s => s.id !== sid) }));
  }
  function updateSection(lid, sid, field, val) {
    updateLoc(lid, l => ({ ...l, sections: l.sections.map(s => s.id === sid ? { ...s, [field]: val } : s) }));
  }
  function addItem(lid, sid) {
    updateLoc(lid, l => ({ ...l, sections: l.sections.map(s => s.id !== sid ? s : { ...s, items: [...(s.items || []), ''] }) }));
  }
  function updateItem(lid, sid, ii, val) {
    updateLoc(lid, l => ({ ...l, sections: l.sections.map(s => {
      if (s.id !== sid) return s;
      const items = [...(s.items || [])]; items[ii] = val; return { ...s, items };
    }) }));
  }
  function removeItem(lid, sid, ii) {
    updateLoc(lid, l => ({ ...l, sections: l.sections.map(s => s.id !== sid ? s : { ...s, items: s.items.filter((_, i) => i !== ii) }) }));
  }

  const statusLabel = saveStatus === 'saving' ? '⟳ Autosaving…' : saveStatus === 'saved' ? '✓ Autosaved' : '';

  return (
    <div ref={printRef} style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: C.blue, fontSize: 22, fontWeight: 700 }}>Capability Report</h2>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>Location intelligence and candidate pitch guides</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {statusLabel && <span style={{ fontSize: 12, color: saveStatus === 'saved' ? '#16A34A' : C.muted }}>{statusLabel}</span>}
          {canEdit && <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addLocation}>+ Add Location</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 20 }}>
        {data.locations.map((loc, li) => {
          const isEdit = editing[loc.id];

          return (
            <div key={loc.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* location header */}
              <div style={{ background: C.blue, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* reorder arrows — only in edit mode */}
                {isEdit && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                    <button style={{ ...iconBtn('rgba(255,255,255,0.5)'), color: li === 0 ? 'rgba(255,255,255,0.2)' : '#fff' }} onClick={() => moveLoc(loc.id, -1)} disabled={li === 0}>▲</button>
                    <button style={{ ...iconBtn('rgba(255,255,255,0.5)'), color: li === data.locations.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff' }} onClick={() => moveLoc(loc.id, 1)} disabled={li === data.locations.length - 1}>▼</button>
                  </div>
                )}

                {isEdit ? (
                  <input
                    value={loc.name}
                    onChange={e => updateLoc(loc.id, l => ({ ...l, name: e.target.value }))}
                    style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 6, padding: '3px 8px', fontFamily: 'inherit' }}
                  />
                ) : (
                  <h3 style={{ margin: 0, flex: 1, color: '#fff', fontSize: 14, fontWeight: 700 }}>📍 {loc.name}</h3>
                )}

                {canEdit && (
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button
                      style={{ ...btn(isEdit ? C.blue : 'rgba(255,255,255,0.85)', isEdit ? '#fff' : 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)'), color: isEdit ? C.blue : '#fff' }}
                      onClick={() => setEditing(e => ({ ...e, [loc.id]: !e[loc.id] }))}
                    >{isEdit ? 'Done' : 'Edit'}</button>
                    <button style={{ ...btn('#FCA5A5', 'rgba(127,29,29,0.4)', 'transparent'), color: '#FCA5A5' }} onClick={() => removeLocation(loc.id)}>✕</button>
                  </div>
                )}
              </div>

              {/* sections */}
              <div style={{ padding: '14px 18px' }}>
                {loc.sections.map((sec, si) => (
                  <div key={sec.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: si < loc.sections.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
                    {isEdit ? (
                      <div style={{ display: 'flex', gap: 5, marginBottom: 7, alignItems: 'center' }}>
                        <input
                          value={sec.title}
                          onChange={e => updateSection(loc.id, sec.id, 'title', e.target.value)}
                          style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 7px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                        />
                        <select
                          value={sec.type}
                          onChange={e => updateSection(loc.id, sec.id, 'type', e.target.value)}
                          style={{ border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 6px', fontSize: 11, fontFamily: 'inherit' }}
                        >
                          <option value="text">Text</option>
                          <option value="list">List</option>
                        </select>
                        <button style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), padding: '3px 8px' }} onClick={() => removeSection(loc.id, sec.id)}>✕</button>
                      </div>
                    ) : (
                      <h4 style={{ margin: '0 0 6px', color: C.blue, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{sec.title}</h4>
                    )}

                    {/* #17 — text with rich editor or pre-wrap view */}
                    {sec.type === 'text' && (
                      isEdit ? (
                        <RichTextEditor
                          value={sec.content || ''}
                          onChange={v => updateSection(loc.id, sec.id, 'content', v)}
                          minHeight={60}
                        />
                      ) : (
                        <RichTextView content={sec.content} style={{ fontSize: 12 }} />
                      )
                    )}

                    {sec.type === 'list' && (
                      <ul style={{ margin: '3px 0 0', paddingLeft: 17 }}>
                        {(sec.items || []).map((item, ii) => (
                          <li key={ii} style={{ color: C.text, fontSize: 12, lineHeight: 1.7, marginBottom: isEdit ? 5 : 1 }}>
                            {isEdit ? (
                              <div style={{ display: 'flex', gap: 5 }}>
                                <input
                                  value={item}
                                  onChange={e => updateItem(loc.id, sec.id, ii, e.target.value)}
                                  style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 4, padding: '3px 7px', fontSize: 12, fontFamily: 'inherit' }}
                                />
                                <button style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), padding: '2px 7px' }} onClick={() => removeItem(loc.id, sec.id, ii)}>✕</button>
                              </div>
                            ) : item}
                          </li>
                        ))}
                        {isEdit && (
                          <li style={{ listStyle: 'none', marginTop: 5 }}>
                            <button style={{ ...btn(C.blue, C.lightBlue, C.blue), fontSize: 11, padding: '3px 10px' }} onClick={() => addItem(loc.id, sec.id)}>+ Add Item</button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
                {isEdit && (
                  <button style={{ ...btn(C.blue, C.lightBlue, C.blue), fontSize: 11 }} onClick={() => addSection(loc.id)}>+ Add Section</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
