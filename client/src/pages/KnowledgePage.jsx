import React, { useState, useRef } from 'react';
import CompanyProfile from './knowledge/CompanyProfile';
import Locations      from './knowledge/Locations';
import DomainMatrix   from './knowledge/DomainMatrix';
import BUPlanning     from './knowledge/BUPlanning';

const C = {
  blue: '#00259C', lightBlue: '#E8EDFB',
  border: '#E2E8F0', muted: '#64748B',
};

const TABS = [
  { id: 'company',  label: '🏢  Company Profile' },
  { id: 'locations',label: '📍  Capability Report' },
  { id: 'domains',  label: '🎯  Domain Matrix' },
  { id: 'bu',       label: '📊  BU Planning' },
];

function downloadSection(ref, title) {
  if (!ref?.current) return;
  const style = `
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Outfit', Arial, sans-serif; padding: 24px; color: #1E293B; }
      h2 { color: #00259C; font-size: 22px; margin: 0 0 8px; }
      h3 { color: #00259C; font-size: 16px; margin: 16px 0 8px; }
      h4 { font-size: 13px; font-weight: 600; margin: 12px 0 6px; color: #1E293B; }
      p  { font-size: 13px; line-height: 1.7; margin: 0 0 8px; }
      ul { padding-left: 20px; margin: 4px 0 8px; }
      li { font-size: 13px; line-height: 1.7; margin-bottom: 2px; }
      table { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 12px; }
      th { background: #00259C; color: #fff; padding: 9px 12px; text-align: left; }
      td { border: 1px solid #E2E8F0; padding: 8px 12px; vertical-align: top; }
      tr:nth-child(even) td { background: #F8FAFF; }
      .section-card { border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 18px; overflow: hidden; }
      .section-head { background: #E8EDFB; padding: 12px 16px; border-bottom: 1px solid #E2E8F0; }
      button, [style*="cursor"] { display: none !important; }
      input, textarea, select { border: none !important; background: transparent !important; resize: none !important; font-family: inherit !important; }
      @media print { @page { margin: 18mm; } }
    </style>
  `;
  const html = ref.current.innerHTML;
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>${style}</head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 300);
}

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState('company');
  const sectionRef = useRef(null);
  const allRef     = useRef(null);

  const tabLabel = TABS.find(t => t.id === activeTab)?.label || '';

  return (
    <div style={{ background: '#F4F7FB', minHeight: '100vh' }}>

      {/* sub-header / tab bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <nav style={{ display: 'flex', gap: 2 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? C.blue : C.muted,
                  borderBottom: activeTab === tab.id ? `2.5px solid ${C.blue}` : '2.5px solid transparent',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* download buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => downloadSection(sectionRef, tabLabel.replace(/[^\w\s]/g, '').trim())}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: `1px solid ${C.border}`, background: '#fff', color: C.muted,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}
              title="Download current section as PDF"
            >
              ⬇ Download Section
            </button>
            <button
              onClick={() => downloadSection(allRef, 'Adani DA - Talent Intelligence')}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                border: `1px solid ${C.blue}`, background: C.lightBlue, color: C.blue,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}
              title="Download all sections as PDF"
            >
              ⬇ Download All
            </button>
          </div>
        </div>
      </div>

      {/* visible section */}
      <div>
        {activeTab === 'company'   && <CompanyProfile printRef={sectionRef} />}
        {activeTab === 'locations' && <Locations      printRef={sectionRef} />}
        {activeTab === 'domains'   && <DomainMatrix   printRef={sectionRef} />}
        {activeTab === 'bu'        && <BUPlanning      printRef={sectionRef} />}
      </div>

      {/* hidden all-sections aggregator for "Download All" */}
      <div ref={allRef} style={{ display: 'none' }}>
        <div><CompanyProfileStatic /></div>
        <div style={{ marginTop: 32 }}><LocationsStatic /></div>
        <div style={{ marginTop: 32 }}><DomainMatrixStatic /></div>
        <div style={{ marginTop: 32 }}><BUPlanningStatic /></div>
      </div>
    </div>
  );
}

/* ── Thin wrappers for "Download All" that share the same components ── */
function CompanyProfileStatic() {
  const r = useRef(null);
  return <CompanyProfile printRef={r} />;
}
function LocationsStatic() {
  const r = useRef(null);
  return <Locations printRef={r} />;
}
function DomainMatrixStatic() {
  const r = useRef(null);
  return <DomainMatrix printRef={r} />;
}
function BUPlanningStatic() {
  const r = useRef(null);
  return <BUPlanning printRef={r} />;
}
