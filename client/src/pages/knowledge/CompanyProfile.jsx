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
  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px',
  borderRadius: 4, fontSize: 14, color, lineHeight: 1,
});

const WIDTH_OPTIONS = [
  { val: 'full',       label: 'Full',  css: '100%' },
  { val: 'two-thirds', label: '2/3',   css: 'calc(66.667% - 7px)' },
  { val: 'half',       label: '1/2',   css: 'calc(50% - 10px)' },
  { val: 'third',      label: '1/3',   css: 'calc(33.333% - 14px)' },
  { val: 'quarter',    label: '1/4',   css: 'calc(25% - 15px)' },
];
function sectionWidth(w) {
  return WIDTH_OPTIONS.find(o => o.val === w)?.css || '100%';
}

function TableEditor({ table, onChange }) {
  const { headers = [], rows = [] } = table;
  function setHeader(i, v)       { const h = [...headers]; h[i] = v; onChange({ ...table, headers: h }); }
  function setCell(ri, ci, v)    { const r = rows.map(row => [...row]); r[ri][ci] = v; onChange({ ...table, rows: r }); }
  function addRow()              { onChange({ ...table, rows: [...rows, headers.map(() => '')] }); }
  function removeRow(i)          { onChange({ ...table, rows: rows.filter((_, ri) => ri !== i) }); }
  function addCol()              { onChange({ ...table, headers: [...headers, 'Column'], rows: rows.map(r => [...r, '']) }); }
  function removeCol(i)          { onChange({ ...table, headers: headers.filter((_, ci) => ci !== i), rows: rows.map(r => r.filter((_, ci) => ci !== i)) }); }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button style={{ ...btn(C.blue, C.lightBlue, C.blue), fontSize: 11 }} onClick={addRow}>+ Row</button>
        <button style={{ ...btn(C.blue, C.lightBlue, C.blue), fontSize: 11 }} onClick={addCol}>+ Column</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th key={ci} style={{ border: `1px solid ${C.border}`, background: C.lightBlue, padding: 4 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <input value={h} onChange={e => setHeader(ci, e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontSize: 11, fontWeight: 700, width: 80, fontFamily: 'inherit' }} />
                    {headers.length > 1 && (
                      <button onClick={() => removeCol(ci)} style={{ ...iconBtn(C.red), fontSize: 10 }}>✕</button>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ border: `1px solid ${C.border}`, width: 30, background: C.lightBlue }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ border: `1px solid ${C.border}`, padding: 3 }}>
                    <textarea value={cell} onChange={e => setCell(ri, ci, e.target.value)} rows={2}
                      style={{ width: '100%', border: 'none', resize: 'vertical', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </td>
                ))}
                <td style={{ border: `1px solid ${C.border}`, textAlign: 'center', padding: 3 }}>
                  <button onClick={() => removeRow(ri)} style={{ ...iconBtn(C.red), fontSize: 10 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableView({ table }) {
  const { headers = [], rows = [] } = table;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ border: `1px solid ${C.border}`, background: C.lightBlue, padding: '6px 10px', fontWeight: 700, color: C.blue, textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 ? '#FAFBFF' : '#fff' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ border: `1px solid ${C.border}`, padding: '6px 10px', whiteSpace: 'pre-wrap', color: C.text }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompanyProfile({ printRef, sectionKey = 'company_profile', pageTitle = 'Company Profile' }) {
  const { canEdit } = useClient() || {};

  const [data, setData]             = useState(null);
  const [loaded, setLoaded]         = useState(false);
  const [editing, setEditing]       = useState({});
  const [saveStatus, setSaveStatus] = useState('idle');
  const saveTimer = useRef(null);

  useEffect(() => {
    setData(null);
    setLoaded(false);
    getKnowledge(sectionKey).then(d => {
      if (d) setData(d);
      else setData({ sections: [] });
      setLoaded(true);
    }).catch(() => { setData({ sections: [] }); setLoaded(true); });
  }, [sectionKey]);

  useEffect(() => {
    if (!loaded || !data) return;
    clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await saveKnowledge(sectionKey, data);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded]);

  if (!data) return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;

  /* ── Section helpers ── */
  function updateSection(sid, updater) {
    setData(d => ({ sections: d.sections.map(s => s.id === sid ? updater(s) : s) }));
  }
  function addSection() {
    setData(d => ({ sections: [...d.sections, { id: uid(), title: 'New Section', width: 'full', subsections: [] }] }));
  }
  function removeSection(sid) {
    setData(d => ({ sections: d.sections.filter(s => s.id !== sid) }));
  }
  function moveSection(sid, dir) {
    setData(d => {
      const arr = [...d.sections];
      const i = arr.findIndex(s => s.id === sid);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { sections: arr };
    });
  }
  function setWidth(sid, w) {
    updateSection(sid, s => ({ ...s, width: w }));
  }

  /* ── Subsection helpers ── */
  function addSubsection(sid) {
    updateSection(sid, s => ({
      ...s,
      subsections: [...s.subsections, { id: uid(), title: 'New Subsection', type: 'text', content: '' }],
    }));
  }
  function removeSubsection(sid, subId) {
    updateSection(sid, s => ({ ...s, subsections: s.subsections.filter(ss => ss.id !== subId) }));
  }
  function updateSubsection(sid, subId, field, value) {
    updateSection(sid, s => ({
      ...s,
      subsections: s.subsections.map(ss => ss.id === subId ? { ...ss, [field]: value } : ss),
    }));
  }
  function moveSub(sid, subId, dir) {
    updateSection(sid, s => {
      const arr = [...s.subsections];
      const i = arr.findIndex(ss => ss.id === subId);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return s;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, subsections: arr };
    });
  }
  function addListItem(sid, subId) {
    updateSection(sid, s => ({
      ...s,
      subsections: s.subsections.map(ss => ss.id === subId ? { ...ss, items: [...(ss.items || []), ''] } : ss),
    }));
  }
  function updateListItem(sid, subId, idx, val) {
    updateSection(sid, s => ({
      ...s,
      subsections: s.subsections.map(ss => {
        if (ss.id !== subId) return ss;
        const items = [...(ss.items || [])]; items[idx] = val; return { ...ss, items };
      }),
    }));
  }
  function removeListItem(sid, subId, idx) {
    updateSection(sid, s => ({
      ...s,
      subsections: s.subsections.map(ss => ss.id !== subId ? ss : { ...ss, items: ss.items.filter((_, i) => i !== idx) }),
    }));
  }

  const statusLabel = saveStatus === 'saving' ? '⟳ Autosaving…' : saveStatus === 'saved' ? '✓ Autosaved' : '';

  return (
    <div ref={printRef} style={{ padding: '28px 32px' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: C.blue, fontSize: 22, fontWeight: 700 }}>{pageTitle}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {statusLabel && <span style={{ fontSize: 12, color: saveStatus === 'saved' ? '#16A34A' : C.muted }}>{statusLabel}</span>}
          {canEdit && <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addSection}>+ Add Section</button>}
        </div>
      </div>

      {/* flex-wrap grid so sections can be sized side-by-side */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {data.sections.map((sec, si) => {
          const isEdit = editing[sec.id];
          const currentWidth = sec.width || 'full';

          return (
            <div
              key={sec.id}
              style={{
                width: sectionWidth(currentWidth),
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {/* section header */}
              <div style={{ background: C.lightBlue, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${C.border}` }}>
                {/* reorder arrows — only in edit mode */}
                {isEdit && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <button
                      onClick={() => moveSection(sec.id, -1)}
                      disabled={si === 0}
                      style={{ background: si === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)', color: si === 0 ? 'rgba(255,255,255,0.25)' : '#fff', width: 24, height: 22, borderRadius: 4, cursor: si === 0 ? 'default' : 'pointer', fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >▲</button>
                    <button
                      onClick={() => moveSection(sec.id, 1)}
                      disabled={si === data.sections.length - 1}
                      style={{ background: si === data.sections.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)', color: si === data.sections.length - 1 ? 'rgba(255,255,255,0.25)' : '#fff', width: 24, height: 22, borderRadius: 4, cursor: si === data.sections.length - 1 ? 'default' : 'pointer', fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >▼</button>
                  </div>
                )}

                {/* title */}
                {canEdit ? (
                  <input
                    value={sec.title}
                    onChange={e => updateSection(sec.id, s => ({ ...s, title: e.target.value }))}
                    style={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.blue, border: isEdit ? `1.5px solid ${C.blue}` : '1.5px solid transparent', borderRadius: 5, padding: '3px 8px', background: 'transparent', fontFamily: 'inherit' }}
                  />
                ) : (
                  <h3 style={{ margin: 0, flex: 1, color: C.blue, fontSize: 15, fontWeight: 700 }}>{sec.title}</h3>
                )}

                {canEdit && (
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* width selector — visible when editing */}
                    {isEdit && WIDTH_OPTIONS.map(opt => (
                      <button
                        key={opt.val}
                        title={`Set block to ${opt.label} width`}
                        onClick={() => setWidth(sec.id, opt.val)}
                        style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer',
                          border: `1px solid ${currentWidth === opt.val ? C.blue : C.border}`,
                          background: currentWidth === opt.val ? C.lightBlue : '#fff',
                          color: currentWidth === opt.val ? C.blue : C.muted,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      style={btn(isEdit ? C.blue : C.muted, isEdit ? C.lightBlue : '#fff', C.border)}
                      onClick={() => setEditing(e => ({ ...e, [sec.id]: !e[sec.id] }))}
                    >
                      {isEdit ? 'Done' : 'Edit'}
                    </button>
                    <button style={btn(C.red, '#FEF2F2', '#FCA5A5')} onClick={() => removeSection(sec.id)}>Remove</button>
                  </div>
                )}
              </div>

              {/* subsections */}
              <div style={{ padding: '16px 20px' }}>
                {sec.subsections.map((sub, subI) => (
                  <div key={sub.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: subI < sec.subsections.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      {isEdit && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                          <button
                            onClick={() => moveSub(sec.id, sub.id, -1)}
                            disabled={subI === 0}
                            style={{ background: subI === 0 ? '#F1F5F9' : C.lightBlue, border: `1px solid ${subI === 0 ? C.border : '#93A8DC'}`, color: subI === 0 ? '#CBD5E1' : C.blue, width: 22, height: 20, borderRadius: 3, cursor: subI === 0 ? 'default' : 'pointer', fontSize: 10, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >▲</button>
                          <button
                            onClick={() => moveSub(sec.id, sub.id, 1)}
                            disabled={subI === sec.subsections.length - 1}
                            style={{ background: subI === sec.subsections.length - 1 ? '#F1F5F9' : C.lightBlue, border: `1px solid ${subI === sec.subsections.length - 1 ? C.border : '#93A8DC'}`, color: subI === sec.subsections.length - 1 ? '#CBD5E1' : C.blue, width: 22, height: 20, borderRadius: 3, cursor: subI === sec.subsections.length - 1 ? 'default' : 'pointer', fontSize: 10, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >▼</button>
                        </div>
                      )}

                      {isEdit ? (
                        <>
                          <input
                            value={sub.title}
                            onChange={e => updateSubsection(sec.id, sub.id, 'title', e.target.value)}
                            placeholder="Subsection title"
                            style={{ flex: 1, fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', fontFamily: 'inherit' }}
                          />
                          <select
                            value={sub.type}
                            onChange={e => updateSubsection(sec.id, sub.id, 'type', e.target.value)}
                            style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, fontFamily: 'inherit' }}
                          >
                            <option value="text">Text</option>
                            <option value="list">List</option>
                            <option value="table">Table</option>
                          </select>
                          <button style={btn(C.red, '#FEF2F2', '#FCA5A5')} onClick={() => removeSubsection(sec.id, sub.id)}>✕</button>
                        </>
                      ) : (
                        <h4 style={{ margin: 0, color: C.text, fontSize: 13, fontWeight: 600 }}>{sub.title}</h4>
                      )}
                    </div>

                    {sub.type === 'text' && (
                      isEdit ? (
                        <RichTextEditor
                          value={sub.content || ''}
                          onChange={v => updateSubsection(sec.id, sub.id, 'content', v)}
                          minHeight={80}
                        />
                      ) : (
                        <RichTextView content={sub.content} />
                      )
                    )}

                    {sub.type === 'list' && (
                      <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                        {(sub.items || []).map((item, ii) => (
                          <li key={ii} style={{ color: C.text, fontSize: 13, lineHeight: 1.7, marginBottom: isEdit ? 6 : 2 }}>
                            {isEdit ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input
                                  value={item}
                                  onChange={e => updateListItem(sec.id, sub.id, ii, e.target.value)}
                                  style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 13, fontFamily: 'inherit' }}
                                />
                                <button style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), padding: '3px 8px' }} onClick={() => removeListItem(sec.id, sub.id, ii)}>✕</button>
                              </div>
                            ) : <RichTextView content={item} style={{ display: 'inline' }} />}
                          </li>
                        ))}
                        {isEdit && (
                          <li style={{ listStyle: 'none', marginTop: 6 }}>
                            <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={() => addListItem(sec.id, sub.id)}>+ Add Item</button>
                          </li>
                        )}
                      </ul>
                    )}

                    {sub.type === 'table' && (
                      isEdit ? (
                        <TableEditor
                          table={sub.table || { headers: ['Column 1', 'Column 2'], rows: [['', '']] }}
                          onChange={t => updateSubsection(sec.id, sub.id, 'table', t)}
                        />
                      ) : (
                        <TableView table={sub.table || { headers: [], rows: [] }} />
                      )
                    )}
                  </div>
                ))}

                {isEdit && (
                  <button style={{ ...btn(C.blue, C.lightBlue, C.blue), marginTop: 4 }} onClick={() => addSubsection(sec.id)}>
                    + Add Subsection
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
