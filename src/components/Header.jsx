import { useEffect, useRef, useState } from 'react';

function Highlight({ text, query }) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="h-sr-mark">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function Header({ news = [], onResultSelect }) {
  const [clock, setClock]         = useState('');
  const [query, setQuery]         = useState('');
  const [open, setOpen]           = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  useEffect(() => {
    const tick = () => {
      const n  = new Date();
      const hh = String(n.getUTCHours()).padStart(2, '0');
      const mm = String(n.getUTCMinutes()).padStart(2, '0');
      const ss = String(n.getUTCSeconds()).padStart(2, '0');
      setClock(`${hh}:${mm}:${ss} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setFocusedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = q.length >= 2
    ? news.filter(a =>
        a.headline.toLowerCase().includes(q) ||
        a.region.toLowerCase().includes(q) ||
        (a.summary ?? '').toLowerCase().includes(q) ||
        (a.source  ?? '').toLowerCase().includes(q)
      ).slice(0, 7)
    : [];

  const showDropdown = open && q.length >= 2;

  const handleSelect = (article) => {
    onResultSelect?.(article);
    setQuery('');
    setOpen(false);
    setFocusedIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'Escape') {
      setOpen(false); setQuery(''); setFocusedIdx(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      handleSelect(results[focusedIdx]);
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <svg className="logo-mark" viewBox="0 0 28 28" aria-hidden="true">
          <path d="M14 2.5 L26 9.5 H2 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <circle className="logo-oculus" cx="14" cy="7" r="1.3" />
          <rect x="3" y="11" width="22" height="1.6" fill="currentColor" />
          <rect x="5" y="14" width="2" height="8" fill="currentColor" />
          <rect x="10.3" y="14" width="2" height="8" fill="currentColor" />
          <rect x="15.7" y="14" width="2" height="8" fill="currentColor" />
          <rect x="21" y="14" width="2" height="8" fill="currentColor" />
          <rect x="2" y="23" width="24" height="1.6" fill="currentColor" />
          <rect x="1" y="25.6" width="26" height="1.4" fill="currentColor" />
        </svg>
        <div className="logo-wordmark">PAN<em>THEON</em></div>
      </div>
      <div className="h-sep" />
      <div className="h-label">Global Intelligence Feed</div>

      <div className="h-right">
        {/* Event search */}
        <div className="h-search" ref={containerRef}>
          <div className="h-search-icon">⌕</div>
          <input
            ref={inputRef}
            className="h-search-input"
            type="text"
            placeholder="SEARCH EVENTS..."
            value={query}
            autoComplete="off"
            spellCheck={false}
            onChange={e => { setQuery(e.target.value); setOpen(true); setFocusedIdx(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              className="h-search-clear"
              onClick={() => { setQuery(''); setOpen(false); setFocusedIdx(-1); inputRef.current?.focus(); }}
            >✕</button>
          )}

          {showDropdown && (
            <div className="h-search-dropdown">
              {results.length > 0 ? (
                results.map((a, i) => (
                  <div
                    key={a.id ?? i}
                    className={`h-search-result${i === focusedIdx ? ' focused' : ''}`}
                    onMouseEnter={() => setFocusedIdx(i)}
                    onClick={() => handleSelect(a)}
                  >
                    <span className={`badge b-${a.level}`}>{a.level}</span>
                    <div className="h-sr-body">
                      <div className="h-sr-region">{a.region}</div>
                      <div className="h-sr-headline">
                        <Highlight text={a.headline} query={query.trim()} />
                      </div>
                    </div>
                    <span className="h-sr-time">{a.time}</span>
                  </div>
                ))
              ) : (
                <div className="h-search-empty">NO MATCHES FOUND</div>
              )}
            </div>
          )}
        </div>

        <div className="h-sep" />
        <div className="live-pill">
          <div className="live-dot" />
          LIVE
        </div>
        <div className="clock">{clock}</div>
      </div>
    </header>
  );
}
