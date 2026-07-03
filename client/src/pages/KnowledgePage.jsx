import React, { useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import CompanyProfile from './knowledge/CompanyProfile';
import Locations      from './knowledge/Locations';
import DomainMatrix   from './knowledge/DomainMatrix';
import BUPlanning     from './knowledge/BUPlanning';

const C = {
  blue: '#00259C', lightBlue: '#E8EDFB',
  border: '#E2E8F0', muted: '#64748B',
};

const TABS = [
  { path: 'company-profile',   label: '🏢  Company Profile',  Component: CompanyProfile },
  { path: 'capability-report', label: '📍  Capability Report', Component: Locations },
  { path: 'domain-matrix',     label: '🎯  Domain Matrix',     Component: DomainMatrix },
  { path: 'bu-planning',       label: '📊  BU Planning',       Component: BUPlanning },
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
  const { clientSlug } = useParams();
  const { pathname } = useLocation();
  const sectionRef = useRef(null);
  const allRef     = useRef(null);

  const pathSegment = pathname.split('/').pop();
  const activeTab   = TABS.find(t => t.path === pathSegment) || TABS[0];
  const ActiveComponent = activeTab.Component;

  return (
    <div style={{ background: '#F4F7FB', minHeight: '100vh' }}>

      {/* sub-header / tab bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <nav style={{ display: 'flex', gap: 2 }}>
            {TABS.map(tab => {
              const isActive = tab.path === pathSegment;
              return (
                <Link
                  key={tab.path}
                  to={`/w/${clientSlug}/${tab.path}`}
                  style={{
                    padding: '14px 18px', textDecoration: 'none', display: 'block',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.blue : C.muted,
                    borderBottom: isActive ? `2.5px solid ${C.blue}` : '2.5px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {/* download buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => downloadSection(sectionRef, activeTab.label.replace(/[^\w\s]/g, '').trim())}
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
        <ActiveComponent printRef={sectionRef} />
      </div>

      {/* hidden all-sections aggregator for "Download All" */}
      <div ref={allRef} style={{ display: 'none' }}>
        {TABS.map(tab => {
          const Cmp = tab.Component;
          return <Cmp key={tab.path} printRef={{ current: null }} />;
        })}
      </div>
    </div>
  );
}
