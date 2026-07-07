import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext';
import { getKnowledge, saveKnowledge } from '../api/index';
import CompanyProfile from './knowledge/CompanyProfile';
import Locations      from './knowledge/Locations';
import DomainMatrix   from './knowledge/DomainMatrix';
import BUPlanning     from './knowledge/BUPlanning';

const MAX_TABS = 10;
const TABS_KEY = '_tabs_config';

// Generate a URL-friendly slug from a name
const generateSlug = (name) => {
  return `custom_${name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .slice(0, 50)}`;          // Limit to 50 chars after "custom_"
};

const DEFAULT_TABS = [
  { id: 'company-profile',   name: 'Company Profile',  icon: '🏢', isBuiltIn: true },
  { id: 'capability-report', name: 'Capability Report', icon: '📍', isBuiltIn: true },
  { id: 'domain-matrix',     name: 'Domain Matrix',     icon: '🎯', isBuiltIn: true },
  { id: 'bu-planning',       name: 'BU Planning',       icon: '📊', isBuiltIn: true },
];

const C = {
  blue: '#00259C', lightBlue: '#E8EDFB',
  border: '#E2E8F0', muted: '#64748B', red: '#DC2626',
};
const btn = (color, bg, border) => ({
  padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', border: `1px solid ${border || color}`,
  color, background: bg || 'transparent', fontFamily: 'inherit',
});

// Renders the right component for a tab
function TabContent({ tab, printRef }) {
  if (tab.id === 'company-profile')   return <CompanyProfile printRef={printRef} />;
  if (tab.id === 'capability-report') return <Locations      printRef={printRef} />;
  if (tab.id === 'domain-matrix')     return <DomainMatrix   printRef={printRef} />;
  if (tab.id === 'bu-planning')       return <BUPlanning     printRef={printRef} />;
  return <CompanyProfile printRef={printRef} sectionKey={tab.id} pageTitle={tab.name} />;
}

// Inline tab management panel
function ManageTabsPanel({ tabs: initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(initial.map(t => ({ ...t })));

  function updateField(id, field, val) {
    setDraft(d => d.map(t => {
      if (t.id === id) {
        // If updating name on a custom tab, regenerate the slug
        if (field === 'name' && !t.isBuiltIn) {
          return { ...t, id: generateSlug(val), [field]: val };
        }
        return { ...t, [field]: val };
      }
      return t;
    }));
  }
  function move(id, dir) {
    setDraft(d => {
      const arr = [...d];
      const i = arr.findIndex(t => t.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }
  function remove(id) {
    setDraft(d => d.length > 1 ? d.filter(t => t.id !== id) : d);
  }
  function addTab() {
    if (draft.length >= MAX_TABS) return;
    setDraft(d => [...d, { id: generateSlug('New Tab'), name: 'New Tab', icon: '📄', isBuiltIn: false }]);
  }

  const arrowBtn = (disabled) => ({
    background: disabled ? '#F1F5F9' : C.lightBlue,
    border: `1px solid ${disabled ? C.border : '#93A8DC'}`,
    color: disabled ? '#CBD5E1' : C.blue,
    width: 22, height: 20, borderRadius: 3,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 10, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div style={{ background: '#F8FAFF', borderBottom: `1px solid ${C.border}`, padding: '16px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>
          Manage Tabs — {draft.length}/{MAX_TABS} tabs
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {draft.length < MAX_TABS && (
            <button style={btn(C.blue, C.lightBlue, C.blue)} onClick={addTab}>+ Add Tab</button>
          )}
          <button style={btn('#fff', C.blue, C.blue)} onClick={() => onSave(draft)}>Save & Close</button>
          <button style={btn(C.muted, '#fff', C.border)} onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {draft.map((tab, i) => (
          <div key={tab.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px' }}>
            {/* reorder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => move(tab.id, -1)} disabled={i === 0} style={arrowBtn(i === 0)}>▲</button>
              <button onClick={() => move(tab.id, 1)} disabled={i === draft.length - 1} style={arrowBtn(i === draft.length - 1)}>▼</button>
            </div>

            {/* icon */}
            <input
              value={tab.icon}
              onChange={e => updateField(tab.id, 'icon', e.target.value)}
              title="Tab icon (emoji)"
              style={{ width: 38, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px', fontSize: 16, fontFamily: 'inherit' }}
            />

            {/* name */}
            <input
              value={tab.name}
              onChange={e => updateField(tab.id, 'name', e.target.value)}
              style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }}
            />

            {/* delete — any tab can be removed; minimum 1 tab */}
            <button
              onClick={() => remove(tab.id)}
              disabled={draft.length <= 1}
              title={draft.length <= 1 ? 'At least one tab is required' : 'Remove tab'}
              style={{ ...btn(C.red, '#FEF2F2', '#FCA5A5'), flexShrink: 0, opacity: draft.length <= 1 ? 0.4 : 1, cursor: draft.length <= 1 ? 'not-allowed' : 'pointer' }}
            >Remove</button>
          </div>
        ))}
      </div>

      <p style={{ margin: '10px 0 0', fontSize: 11, color: C.muted }}>
        Any tab can be removed. Deleting a tab hides it from navigation — its content remains in the database and can be restored by re-adding a tab with the same name. Max {MAX_TABS} tabs.
      </p>
    </div>
  );
}

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
  const { pathname }   = useLocation();
  const navigate       = useNavigate();
  const { client, canEdit } = useClient() || {};

  const [tabs, setTabs]             = useState(DEFAULT_TABS);
  const [tabsLoaded, setTabsLoaded] = useState(false);
  const [managingTabs, setManagingTabs] = useState(false);

  const sectionRef = useRef(null);
  const allRef     = useRef(null);

  // Load tab config from DB
  useEffect(() => {
    getKnowledge(TABS_KEY)
      .then(d => {
        if (d?.tabs?.length) setTabs(d.tabs);
        setTabsLoaded(true);
      })
      .catch(() => setTabsLoaded(true));
  }, [clientSlug]);

  const pathSegment = pathname.split('/').pop();
  const activeTab   = tabs.find(t => t.id === pathSegment) || null;

  // Redirect to first tab if path not found in tab list
  useEffect(() => {
    if (tabsLoaded && !activeTab && tabs.length) {
      navigate(`/w/${clientSlug}/${tabs[0].id}`, { replace: true });
    }
  }, [tabsLoaded, activeTab, tabs, clientSlug]); // eslint-disable-line

  // Update document title
  useEffect(() => {
    if (!activeTab) return;
    document.title = client?.name
      ? `Prism - ${client.name} - ${activeTab.name}`
      : `Prism - ${activeTab.name}`;
  }, [activeTab, client]);

  function saveTabsConfig(newTabs) {
    setTabs(newTabs);
    saveKnowledge(TABS_KEY, { tabs: newTabs }).catch(() => {});
  }

  function handleSaveTabs(newTabs) {
    const oldIds = new Set(tabs.map(t => t.id));
    const newTab = newTabs.find(t => !oldIds.has(t.id));
    saveTabsConfig(newTabs);
    setManagingTabs(false);
    if (newTab) navigate(`/w/${clientSlug}/${newTab.id}`);
  }

  if (!tabsLoaded) {
    return <div style={{ padding: 40, color: C.muted, textAlign: 'center' }}>Loading…</div>;
  }

  return (
    <div style={{ background: '#F4F7FB', minHeight: '100vh' }}>

      {/* tab bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <nav style={{ display: 'flex', gap: 2 }}>
            {tabs.map(tab => {
              const isActive = tab.id === pathSegment;
              return (
                <Link
                  key={tab.id}
                  to={`/w/${clientSlug}/${tab.id}`}
                  style={{
                    padding: '14px 18px', textDecoration: 'none', display: 'block',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.blue : C.muted,
                    borderBottom: isActive ? `2.5px solid ${C.blue}` : '2.5px solid transparent',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {tab.icon}{'  '}{tab.name}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {canEdit && (
              <button
                onClick={() => setManagingTabs(m => !m)}
                title="Manage tabs"
                style={{
                  ...btn(managingTabs ? C.blue : C.muted, managingTabs ? C.lightBlue : '#fff', C.border),
                  padding: '5px 11px', fontSize: 13,
                }}
              >⚙ Tabs</button>
            )}
            <button
              onClick={() => activeTab && downloadSection(sectionRef, activeTab.name)}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, background: '#fff', color: C.muted, cursor: 'pointer' }}
              title="Download current section as PDF"
            >⬇ Download Section</button>
            <button
              onClick={() => downloadSection(allRef, client?.name || 'Talent Intelligence')}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: `1px solid ${C.blue}`, background: C.lightBlue, color: C.blue, cursor: 'pointer' }}
              title="Download all sections as PDF"
            >⬇ Download All</button>
          </div>
        </div>
      </div>

      {/* tab management panel */}
      {canEdit && managingTabs && (
        <ManageTabsPanel
          tabs={tabs}
          onSave={handleSaveTabs}
          onCancel={() => setManagingTabs(false)}
        />
      )}

      {/* active tab content */}
      <div>
        {activeTab && <TabContent tab={activeTab} printRef={sectionRef} />}
      </div>

      {/* hidden all-tabs div for Download All */}
      <div ref={allRef} style={{ display: 'none' }}>
        {tabs.map(tab => (
          <TabContent key={tab.id} tab={tab} printRef={{ current: null }} />
        ))}
      </div>
    </div>
  );
}
