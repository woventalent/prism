import React, { useState, useEffect } from 'react';
import { getKnowledge, saveKnowledge } from '../../api/index';
import { useAuth } from '../../context/AuthContext';

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

export default function BUPlanning({ printRef }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'recruiter';
  const [data, setData]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [editing, setEditing] = useState({});
  const [draft, setDraft]     = useState({});

  useEffect(() => { getKnowledge('bu_planning').then(d => { if (d) setData(d); }); }, []);

  if (!data) return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;

  function startEdit(bid) {
    const bu = data.bus.find(b => b.id === bid);
    setDraft(d => ({ ...d, [bid]: JSON.parse(JSON.stringify(bu)) }));
    setEditing(e => ({ ...e, [bid]: true }));
  }
  function cancelEdit(bid) {
    setEditing(e => ({ ...e, [bid]: false }));
    setDraft(d => { const c = { ...d }; delete c[bid]; return c; });
  }
  function commitEdit(bid) {
    const updated = data.bus.map(b => b.id === bid ? draft[bid] : b);
    setData({ bus: updated });
    setEditing(e => ({ ...e, [bid]: false }));
    setDraft(d => { const c = { ...d }; delete c[bid]; return c; });
  }

  async function saveAll(busOverride) {
    setSaving(true);
    try {
      const payload = { bus: busOverride || data.bus };
      await saveKnowledge('bu_planning', payload);
      setData(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  function addBU() {
    const dims = ['BU Overview', 'Products', 'Journey from Today to 5YP', 'Capability Gaps', 'Key Skills to be Hired', 'Where to Hire From / Not to Hire From', 'Assessments', 'HC Now & Later'];
    const years = ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'];
    const dataObj = {};
    dims.forEach(d => { dataObj[d] = {}; years.forEach(y => { dataObj[d][y] = ''; }); });
    const newBU = { id: uid(), title: 'New BU Head | Product', leader: '', specialization: '', years, dimensions: dims, data: dataObj };
    setData({ bus: [...data.bus, newBU] });
  }
  function removeBU(bid) {
    setData({ bus: data.bus.filter(b => b.id !== bid) });
  }

  /* draft helpers */
  function dSetField(bid, field, val) {
    setDraft(d => ({ ...d, [bid]: { ...d[bid], [field]: val } }));
  }
  function dSetCell(bid, dim, year, val) {
    setDraft(d => {
      const bu = JSON.parse(JSON.stringify(d[bid]));
      if (!bu.data[dim]) bu.data[dim] = {};
      bu.data[dim][year] = val;
      return { ...d, [bid]: bu };
    });
  }
  function dAddYear(bid) {
    setDraft(d => {
      const bu = JSON.parse(JSON.stringify(d[bid]));
      const next = `Y${bu.years.length + 1}`;
      bu.years.push(next);
      bu.dimensions.forEach(dim => { if (!bu.data[dim]) bu.data[dim] = {}; bu.data[dim][next] = ''; });
      return { ...d, [bid]: bu };
    });
  }
  function dRemoveYear(bid, yi) {
    setDraft(d => {
      const bu = JSON.parse(JSON.stringify(d[bid]));
      const yr = bu.years[yi];
      bu.years.splice(yi, 1);
      bu.dimensions.forEach(dim => { if (bu.data[dim]) delete bu.data[dim][yr]; });
      return { ...d, [bid]: bu };
    });
  }
  function dAddDimension(bid) {
    setDraft(d => {
      const bu = JSON.parse(JSON.stringify(d[bid]));
      const newDim = 'New Planning Dimension';
      bu.dimensions.push(newDim);
      bu.data[newDim] = {};
      bu.years.forEach(y => { bu.data[newDim][y] = ''; });
      return { ...d, [bid]: bu };
    });
  }
  function dSetDimName(bid, di, val) {
    setDraft(d => {
      const bu = JSON.parse(JSON.stringify(d[bid]));
      const oldName = bu.dimensions[di];
      bu.dimensions[di] = val;
      if (bu.data[oldName] !== undefined && oldName !== val) {
        bu.data[val] = bu.data[oldName];
        delete bu.data[oldName];
      }
      return { ...d, [bid]: bu };
    });
  }
  function dRemoveDimension(bid, di) {
    setDraft(d => {
      const bu = JSON.parse(JSON.stringify(d[bid]));
      const dim = bu.dimensions[di];
      bu.dimensions.splice(di, 1);
      delete bu.data[dim];
      return { ...d, [bid]: bu };
    });
  }
  function dSetYearLabel(bid, yi, val) {
    setDraft(d => {
      const bu = JSON.parse(JSON.stringify(d[bid]));
      const oldY = bu.years[yi];
      bu.years[yi] = val;
      bu.dimensions.forEach(dim => {
        if (!bu.data[dim]) bu.data[dim] = {};
        bu.data[dim][val] = bu.data[dim][oldY] ?? '';
        if (oldY !== val) delete bu.data[dim][oldY];
      });
      return { ...d, [bid]: bu };
    });
  }

  return (
    <div ref={printRef} style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: C.blue, fontSize: 22, fontWeight: 700 }}>BU Planning</h2>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>5-year workforce and capability planning per Business Unit</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addBU}>+ Add BU</button>
            <button style={btn('#fff', saving ? '#93A8DC' : C.blue, C.blue)} onClick={() => saveAll()} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save All Changes'}
            </button>
          </div>
        )}
      </div>

      {data.bus.map((bu) => {
        const isEdit = editing[bu.id];
        const d = isEdit ? draft[bu.id] : bu;

        return (
          <div key={bu.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 28, overflow: 'hidden' }}>
            {/* BU header */}
            <div style={{ background: C.lightBlue, padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {isEdit ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
                      <input
                        value={d.title}
                        onChange={e => dSetField(bu.id, 'title', e.target.value)}
                        placeholder="BU Title"
                        style={{ fontSize: 15, fontWeight: 700, border: `1.5px solid ${C.blue}`, borderRadius: 6, padding: '5px 10px', fontFamily: 'inherit', color: C.blue }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={d.leader}
                          onChange={e => dSetField(bu.id, 'leader', e.target.value)}
                          placeholder="BU Leader name"
                          style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit' }}
                        />
                        <input
                          value={d.specialization}
                          onChange={e => dSetField(bu.id, 'specialization', e.target.value)}
                          placeholder="Specialization / Domains"
                          style={{ flex: 2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ margin: '0 0 4px', color: C.blue, fontSize: 16, fontWeight: 700 }}>{bu.title}</h3>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {bu.leader && <span style={{ fontSize: 12, color: C.muted }}><b>Leader:</b> {bu.leader}</span>}
                        {bu.specialization && <span style={{ fontSize: 12, color: C.muted }}><b>Domains:</b> {bu.specialization}</span>}
                      </div>
                    </>
                  )}
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                    {isEdit ? (
                      <>
                        <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={dAddDimension.bind(null, bu.id)}>+ Row</button>
                        <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={dAddYear.bind(null, bu.id)}>+ Year</button>
                        <button style={btn('#fff', C.blue, C.blue)} onClick={() => { commitEdit(bu.id); saveAll(data.bus.map(b => b.id === bu.id ? draft[bu.id] : b)); }}>Save</button>
                        <button style={btn(C.muted, '#fff', C.border)} onClick={() => cancelEdit(bu.id)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button style={btn(C.blue, '#fff', C.border)} onClick={() => startEdit(bu.id)}>Edit</button>
                        <button style={btn(C.red, '#FEF2F2', '#FCA5A5')} onClick={() => removeBU(bu.id)}>Remove BU</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* planning table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFF' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: C.blue, fontSize: 12, fontWeight: 700, borderBottom: `2px solid ${C.border}`, minWidth: 200 }}>
                      Planning Dimension
                    </th>
                    {d.years.map((yr, yi) => (
                      <th key={yi} style={{ padding: '10px 10px', textAlign: 'center', color: C.blue, fontSize: 12, fontWeight: 700, borderBottom: `2px solid ${C.border}`, minWidth: 130 }}>
                        {isEdit ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              value={yr}
                              onChange={e => dSetYearLabel(bu.id, yi, e.target.value)}
                              style={{ width: 48, border: `1px solid ${C.border}`, borderRadius: 4, padding: '3px 5px', fontSize: 11, textAlign: 'center', fontFamily: 'inherit' }}
                            />
                            {d.years.length > 1 && (
                              <button onClick={() => dRemoveYear(bu.id, yi)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: C.red, borderRadius: 3, cursor: 'pointer', padding: '1px 5px', fontSize: 10 }}>✕</button>
                            )}
                          </div>
                        ) : yr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.dimensions.map((dim, di) => (
                    <tr key={di} style={{ borderBottom: `1px solid ${C.border}`, background: di % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: C.text, verticalAlign: 'top' }}>
                        {isEdit ? (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <input
                              value={dim}
                              onChange={e => dSetDimName(bu.id, di, e.target.value)}
                              style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 4, padding: '4px 7px', fontSize: 12, fontFamily: 'inherit' }}
                            />
                            <button onClick={() => dRemoveDimension(bu.id, di)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: C.red, borderRadius: 3, cursor: 'pointer', padding: '2px 6px', fontSize: 10 }}>✕</button>
                          </div>
                        ) : dim}
                      </td>
                      {d.years.map((yr, yi) => (
                        <td key={yi} style={{ padding: '8px 10px', fontSize: 12, color: C.text, verticalAlign: 'top' }}>
                          {isEdit ? (
                            <textarea
                              value={(d.data[dim] || {})[yr] || ''}
                              onChange={e => dSetCell(bu.id, dim, yr, e.target.value)}
                              rows={3}
                              style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 4, padding: '5px 7px', fontSize: 11, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <span style={{ color: (d.data[dim] || {})[yr] ? C.text : C.muted, fontStyle: (d.data[dim] || {})[yr] ? 'normal' : 'italic', lineHeight: 1.5, display: 'block', minHeight: 36 }}>
                              {(d.data[dim] || {})[yr] || '—'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
