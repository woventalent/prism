import React, { useRef, useEffect, useCallback } from 'react';

const COLORS = ['#1E293B', '#00259C', '#DC2626', '#16A34A', '#B45309', '#7C3AED'];

export default function RichTextEditor({ value, onChange, minHeight = 80 }) {
  const editorRef = useRef(null);

  // Initialise once
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, []); // eslint-disable-line

  function exec(cmd, arg = null) {
    editorRef.current.focus();
    document.execCommand(cmd, false, arg);
    onChange(editorRef.current.innerHTML);
  }

  function onInput() {
    onChange(editorRef.current.innerHTML);
  }

  const toolBtn = (onClick, content, title, active = false) => (
    <button
      key={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        padding: '3px 7px', borderRadius: 4, border: '1px solid #E2E8F0',
        background: active ? '#E8EDFB' : '#fff', cursor: 'pointer',
        fontSize: 12, fontWeight: 700, color: '#1E293B', lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 26, height: 24,
      }}
    >
      {content}
    </button>
  );

  return (
    <div style={{ border: '1.5px solid #00259C', borderRadius: 7, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 8px', background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
        {toolBtn(() => exec('bold'),              <b>B</b>,   'Bold')}
        {toolBtn(() => exec('italic'),            <i>I</i>,   'Italic')}
        {toolBtn(() => exec('underline'),         <u>U</u>,   'Underline')}
        <div style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 2px' }} />
        {toolBtn(() => exec('insertUnorderedList'), '•≡', 'Bullet list')}
        {toolBtn(() => exec('insertOrderedList'),  '1≡', 'Numbered list')}
        <div style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 2px' }} />
        {/* Color swatches */}
        {COLORS.map(c => (
          <button
            key={c}
            onMouseDown={e => { e.preventDefault(); exec('foreColor', c); }}
            title={`Text color: ${c}`}
            style={{ width: 18, height: 18, borderRadius: 3, background: c, border: '1.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', flexShrink: 0 }}
          />
        ))}
        <div style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 2px' }} />
        {toolBtn(() => exec('removeFormat'), '✕ fmt', 'Clear formatting')}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        style={{
          padding: '10px 12px', minHeight, fontSize: 13, lineHeight: 1.7,
          color: '#1E293B', outline: 'none', fontFamily: 'inherit',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      />
    </div>
  );
}

/** Render saved HTML (or plain text) safely in view mode */
export function RichTextView({ content, style = {} }) {
  if (!content) return null;
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    return (
      <div
        style={{ fontSize: 13, lineHeight: 1.7, color: '#1E293B', ...style }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#1E293B', whiteSpace: 'pre-wrap', ...style }}>
      {content}
    </p>
  );
}
