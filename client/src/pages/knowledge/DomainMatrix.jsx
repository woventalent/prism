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

export default function DomainMatrix({ printRef }) {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'recruiter';
  const [data, setData]       = useState(null);
  const [isEdit, setIsEdit]   = useState(false);
  const [draft, setDraft]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => { getKnowledge('domain_matrix').then(d => { if (d) setData(d); }); }, []);

  if (!data) return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;

  function startEdit() {
    setDraft(JSON.parse(JSON.stringify(data)));
    setIsEdit(true);
  }
  function cancelEdit() { setIsEdit(false); setDraft(null); }

  async function saveEdit() {
    setSaving(true);
    try {
      await saveKnowledge('domain_matrix', draft);
      setData(draft);
      setIsEdit(false);
      setDraft(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  /* draft helpers */
  function setCellValue(rowId, col, val) {
    setDraft(d => {
      const rows = d.rows.map(r => r.id === rowId ? { ...r, [col]: val } : r);
      return { ...d, rows };
    });
  }
  function setColName(ci, val) {
    setDraft(d => {
      const oldName = d.columns[ci];
      const newCols = d.columns.map((c, i) => i === ci ? val : c);
      const newRows = d.rows.map(r => {
        const newRow = { ...r };
        if (oldName !== val) { newRow[val] = newRow[oldName] ?? ''; delete newRow[oldName]; }
        return newRow;
      });
      return { columns: newCols, rows: newRows };
    });
  }
  function addRow() {
    setDraft(d => {
      const newRow = { id: uid() };
      d.columns.forEach(c => { newRow[c] = ''; });
      return { ...d, rows: [...d.rows, newRow] };
    });
  }
  function removeRow(rowId) {
    setDraft(d => ({ ...d, rows: d.rows.filter(r => r.id !== rowId) }));
  }
  function addColumn() {
    const name = `Col ${Date.now().toString(36).slice(-4)}`;
    setDraft(d => ({
      columns: [...d.columns, name],
      rows: d.rows.map(r => ({ ...r, [name]: '' })),
    }));
  }
  function removeColumn(ci) {
    setDraft(d => {
      const col = d.columns[ci];
      const newCols = d.columns.filter((_, i) => i !== ci);
      const newRows = d.rows.map(r => { const nr = { ...r }; delete nr[col]; return nr; });
      return { columns: newCols, rows: newRows };
    });
  }

  const display = isEdit ? draft : data;

  return (
    <div ref={printRef} style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: C.blue, fontSize: 22, fontWeight: 700 }}>Domain Matrix</h2>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 13 }}>Business domain landscape with leadership, capability, and manpower data</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            {isEdit ? (
              <>
                <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addRow}>+ Row</button>
                <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addColumn}>+ Column</button>
                <button style={btn('#fff', saving ? '#93A8DC' : C.blue, C.blue)} onClick={saveEdit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button style={btn(C.muted, '#fff', C.border)} onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={startEdit}>
                {saved ? '✓ Saved' : 'Edit Matrix'}
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: C.blue }}>
              {display.columns.map((col, ci) => (
                <th key={ci} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.3, whiteSpace: 'nowrap', position: 'relative' }}>
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
            {display.rows.map((row, ri) => (
              <tr key={row.id} style={{ background: ri % 2 === 0 ? '#fff' : '#FAFBFF', borderBottom: `1px solid ${C.border}` }}>
                {display.columns.map((col, ci) => (
                  <td key={ci} style={{ padding: '9px 14px', fontSize: 12, color: C.text, verticalAlign: 'top' }}>
                    {isEdit ? (
                      <textarea
                        value={row[col] || ''}
                        onChange={e => setCellValue(row.id, col, e.target.value)}
                        rows={2}
                        style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 4, padding: '4px 7px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', minWidth: ci === 0 ? 160 : 90 }}
                      />
                    ) : (
                      <span style={{ display: 'block', whiteSpace: ci === display.columns.length - 1 ? 'normal' : 'nowrap', maxWidth: ci === display.columns.length - 1 ? 280 : 'none' }}>
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
          💡 Tip: Click column headers to rename them. Use + Row / + Column to add, ✕ to remove.
        </div>
      )}
    </div>
  );
}
