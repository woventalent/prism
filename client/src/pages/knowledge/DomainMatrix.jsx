import React, { useState, useEffect, useRef } from 'react';
import { getKnowledge, saveKnowledge } from '../../api/index';
import { useClient } from '../../context/ClientContext';

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

// Columns that hold a person's name + role
const PERSON_COLS    = ['Client SPOC', 'Woven SPOC'];
const PERSON_DEFAULT = 'Name: \nDesignation/ Role: ';

// Columns that hold contact details
const CONTACT_COLS    = ['SPOC Contacts', 'Woven SPOC Contacts', 'SPOC Contact', 'Woven SPOC Contact'];
const CONTACT_DEFAULT = 'Mobile: \nEmail: ';

function colDefault(colName) {
  if (PERSON_COLS.includes(colName))  return PERSON_DEFAULT;
  if (CONTACT_COLS.includes(colName)) return CONTACT_DEFAULT;
  return '';
}

// Back-compat: keep old SPOC_COLS reference for addSpocCol quick-add buttons
const SPOC_COLS    = ['SPOC Contacts', 'Woven SPOC Contacts'];
const SPOC_DEFAULT = CONTACT_DEFAULT;

export default function DomainMatrix({ printRef }) {
  const { canEdit } = useClient() || {};

  const [data, setData]         = useState(null);
  const [loaded, setLoaded]     = useState(false);
  const [isEdit, setIsEdit]     = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const saveTimer = useRef(null);

  useEffect(() => {
    getKnowledge('domain_matrix').then(d => {
      if (d) {
        // Fill empty cells with column-appropriate defaults
        const patched = {
          ...d,
          rows: d.rows.map(r => {
            const nr = { ...r };
            d.columns.forEach(col => {
              if (!nr[col]) nr[col] = colDefault(col);
            });
            return nr;
          }),
        };
        setData(patched);
      }
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
        await saveKnowledge('domain_matrix', data);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded]);

  if (!data) return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;

  /* ── helpers ── */
  function setCellValue(rowId, col, val) {
    setData(d => ({ ...d, rows: d.rows.map(r => r.id === rowId ? { ...r, [col]: val } : r) }));
  }

  function setColName(ci, val) {
    setData(d => {
      const oldName = d.columns[ci];
      if (oldName === val) return d;
      const newCols = d.columns.map((c, i) => i === ci ? val : c);
      const newRows = d.rows.map(r => {
        const nr = { ...r, [val]: r[oldName] ?? '' };
        delete nr[oldName];
        return nr;
      });
      return { columns: newCols, rows: newRows };
    });
  }

  function addRow() {
    setData(d => {
      const newRow = { id: uid() };
      d.columns.forEach(c => { newRow[c] = colDefault(c); });
      return { ...d, rows: [...d.rows, newRow] };
    });
  }

  function removeRow(rowId) {
    setData(d => ({ ...d, rows: d.rows.filter(r => r.id !== rowId) }));
  }

  function addColumn(name) {
    const colName = name || `Col ${Date.now().toString(36).slice(-4)}`;
    setData(d => ({
      columns: [...d.columns, colName],
      rows: d.rows.map(r => ({ ...r, [colName]: colDefault(colName) })),
    }));
  }

  function addSpocCol(name) {
    setData(d => {
      if (d.columns.includes(name)) return d;
      return {
        columns: [...d.columns, name],
        rows: d.rows.map(r => ({ ...r, [name]: SPOC_DEFAULT })),
      };
    });
  }

  function removeColumn(ci) {
    setData(d => {
      const col = d.columns[ci];
      const newCols = d.columns.filter((_, i) => i !== ci);
      const newRows = d.rows.map(r => { const nr = { ...r }; delete nr[col]; return nr; });
      return { columns: newCols, rows: newRows };
    });
  }

  const statusLabel = saveStatus === 'saving' ? '⟳ Autosaving…' : saveStatus === 'saved' ? '✓ Autosaved' : '';

  return (
    <div ref={printRef} style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: C.blue, fontSize: 22, fontWeight: 700 }}>Domain Matrix</h2>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>Business domain landscape with leadership, capability, and manpower data</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {statusLabel && <span style={{ fontSize: 12, color: saveStatus === 'saved' ? '#16A34A' : C.muted }}>{statusLabel}</span>}
          {canEdit && isEdit && (
            <>
              <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addRow}>+ Row</button>
              <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={() => addColumn()}>+ Column</button>
              {/* #16 — quick-add SPOC columns */}
              {!data.columns.includes('SPOC Contact') && (
                <button style={btn('#7C3AED', '#F5F3FF', '#C4B5FD')} onClick={() => addSpocCol('SPOC Contact')}>+ SPOC Contact</button>
              )}
              {!data.columns.includes('Woven SPOC Contact') && (
                <button style={btn('#7C3AED', '#F5F3FF', '#C4B5FD')} onClick={() => addSpocCol('Woven SPOC Contact')}>+ Woven SPOC</button>
              )}
              <button style={btn(C.muted, '#fff', C.border)} onClick={() => setIsEdit(false)}>Done</button>
            </>
          )}
          {canEdit && !isEdit && (
            <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={() => setIsEdit(true)}>Edit Matrix</button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: C.blue }}>
              {data.columns.map((col, ci) => (
                <th key={ci} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                  {isEdit ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        value={col}
                        onChange={e => setColName(ci, e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, padding: '3px 6px', color: '#fff', fontSize: 11, fontFamily: 'inherit', width: 120 }}
                      />
                      {ci > 0 && (
                        <button onClick={() => removeColumn(ci)} style={{ background: 'rgba(255,100,100,0.3)', border: 'none', color: '#fff', borderRadius: 3, cursor: 'pointer', padding: '2px 5px', fontSize: 10 }}>✕</button>
                      )}
                    </div>
                  ) : col}
                </th>
              ))}
              {isEdit && <th style={{ background: C.blue, width: 50 }} />}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={row.id} style={{ background: ri % 2 === 0 ? '#fff' : '#FAFBFF', borderBottom: `1px solid ${C.border}` }}>
                {data.columns.map((col, ci) => (
                  <td key={ci} style={{ padding: '9px 14px', fontSize: 12, color: C.text, verticalAlign: 'top' }}>
                    {isEdit ? (
                      <textarea
                        value={row[col] || ''}
                        onChange={e => setCellValue(row.id, col, e.target.value)}
                        rows={2}
                        style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 4, padding: '4px 7px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', minWidth: ci === 0 ? 160 : 90 }}
                      />
                    ) : (
                      // #17 — white-space: pre-wrap so newlines in SPOC cells render
                      <span style={{ display: 'block', whiteSpace: 'pre-wrap', maxWidth: ci === data.columns.length - 1 ? 280 : 'none' }}>
                        {row[col] || <span style={{ color: C.muted, fontStyle: 'italic' }}>—</span>}
                      </span>
                    )}
                  </td>
                ))}
                {isEdit && (
                  <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                    <button onClick={() => removeRow(row.id)} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: C.red, borderRadius: 4, cursor: 'pointer', padding: '3px 7px', fontSize: 11 }}>✕</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEdit && (
        <div style={{ marginTop: 12, color: C.muted, fontSize: 12 }}>
          💡 Edit column headers inline. Use +Row / +Column to add, ✕ to remove. Changes autosave.
        </div>
      )}
    </div>
  );
}
