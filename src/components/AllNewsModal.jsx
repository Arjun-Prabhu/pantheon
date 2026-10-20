import {useState, useEffect, useMemo} from 'react';
import closeIcon from '../assets/X--Streamline-Tabler.svg';
import {NEWS} from '../data/news.js';
import {FILTER_CHIPS, GROUPS} from '../utils/newsFilters.js';
import {LEVEL_LABELS, scoreColor, articleKey, sourceMeta} from '../utils/newsMeta.js';
import NewsDetail from './NewsDetail';

const SORTS = [
    {id: 'importance', label: 'Importance'},
    {id: 'newest',     label: 'Newest'},
    {id: 'region',     label: 'Region'},
];

export default function AllNewsModal({open, onClose, article, onSelect}) {
    const [tracked, setTracked] = useState(() => [...NEWS]);
    const [query, setQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState(new Set());
    const [sort, setSort] = useState('importance');

    /* NEWS is mutated in place by the ingest ticker — poll it so the modal
       always shows every currently tracked item, no refresh needed. */
    useEffect(() => {
        if (!open) return;
        setTracked([...NEWS]);
        const poll = setInterval(() => {
            setTracked(prev => prev.length === NEWS.length ? prev : [...NEWS]);
        }, 1000);
        return () => clearInterval(poll);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const list = useMemo(() => {
        const cats    = FILTER_CHIPS.filter(f => f.type === 'cat'    && activeFilters.has(f.id)).map(f => f.id);
        const levels  = FILTER_CHIPS.filter(f => f.type === 'level'  && activeFilters.has(f.id)).map(f => f.id);
        const regions = FILTER_CHIPS.filter(f => f.type === 'region' && activeFilters.has(f.id)).map(f => f.label);
        const q = query.trim().toLowerCase();

        let out = tracked.map((a, i) => ({...a, _pos: i}));
        if (cats.length)    out = out.filter(a => cats.includes(a.category));
        if (levels.length)  out = out.filter(a => levels.includes(a.level));
        if (regions.length) out = out.filter(a => regions.includes(a.region));
        if (q) out = out.filter(a =>
            `${a.headline} ${a.summary} ${a.source} ${a.region} ${a.category}`.toLowerCase().includes(q));

        if (sort === 'newest')      out.sort((a, b) => b._pos - a._pos);
        else if (sort === 'region') out.sort((a, b) => a.region.localeCompare(b.region) || b.importance - a.importance);
        else                        out.sort((a, b) => b.importance - a.importance);
        return out;
    }, [tracked, query, activeFilters, sort]);

    if (!open) return null;

    const selectedKey = articleKey(article);
    const breaking = list.filter(a => a.level === 'breaking').length;
    const high = list.filter(a => a.level === 'high').length;
    const regions = new Set(list.map(a => a.region)).size;
    const sources = new Set(list.map(a => a.source)).size;

    return (
        <div className="allnews-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="allnews-dialog" role="dialog" aria-modal="true" aria-label="All tracked feeds">
                <div className="allnews-head">
                    <div className="allnews-titles">
                        <div className="allnews-title">All Tracked Feeds</div>
                        <div className="allnews-sub">
                            <span className="live-dot"/>
                            <span>{tracked.length} tracked · {list.length} shown · {sources} sources</span>
                        </div>
                    </div>
                    <input
                        className="allnews-search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search headlines, sources, regions…"
                        autoFocus
                    />
                    <div className="modal-close-button" onClick={onClose}>
                        <img src={closeIcon} style={{width: '100%', margin: 0}} alt="close"/>
                    </div>
                </div>

                <div className="allnews-tools">
                    {GROUPS.map(g => (
                        <div key={g.type} className="allnews-tool-group">
                            <span className="allnews-tool-label">{g.label}</span>
                            {FILTER_CHIPS.filter(f => f.type === g.type).map(f => (
                                <button
                                    key={f.id}
                                    className={`fchip fchip-${f.id}${activeFilters.has(f.id) ? ' active' : ''}`}
                                    onClick={() => setActiveFilters(prev => {
                                        const next = new Set(prev);
                                        next.has(f.id) ? next.delete(f.id) : next.add(f.id);
                                        return next;
                                    })}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    ))}
                    <div className="allnews-tool-group allnews-sort">
                        <span className="allnews-tool-label">Sort</span>
                        {SORTS.map(s => (
                            <button
                                key={s.id}
                                className={`fchip${sort === s.id ? ' active fchip-sort-active' : ''}`}
                                onClick={() => setSort(s.id)}
                            >
                                {s.label}
                            </button>
                        ))}
                        {(activeFilters.size > 0 || query) && (
                            <button
                                className="filter-clear-all"
                                onClick={() => { setActiveFilters(new Set()); setQuery(''); }}
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                <div className="allnews-body">
                    <div className="allnews-list">
                        {list.length === 0 && <div className="allnews-empty">NO FEEDS MATCH THESE FILTERS</div>}
                        {list.map(a => {
                            const sc = scoreColor(a.importance);
                            const key = articleKey(a);
                            return (
                                <div
                                    key={`${key}|${a._pos}`}
                                    className={`ani cat-${a.category}${key === selectedKey ? ' selected' : ''}`}
                                    onClick={() => onSelect(a)}
                                >
                                    <div className="ani-meta">
                                        <span className={`badge b-${a.level}`}>{LEVEL_LABELS[a.level] || a.level}</span>
                                        <span className="ani-region">{a.region}</span>
                                        <span className="ani-time">{a.time}</span>
                                    </div>
                                    <div className="ani-headline">{a.headline}</div>
                                    <div className="ani-summary">{a.summary}</div>
                                    <div className="ani-foot">
                                        <span className="ani-source">{sourceMeta(a).domain}</span>
                                        <div className="score-track">
                                            <div className="score-fill" style={{width: `${a.importance * 10}%`, background: sc}}/>
                                        </div>
                                        <span className="score-num" style={{color: sc}}>{a.importance}/10</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="allnews-detail">
                        {article
                            ? <NewsDetail article={article} variant="pane"/>
                            : <div className="allnews-detail-empty">
                                <div className="allnews-detail-empty-mark">◈</div>
                                <p>Select a feed to load its bias, accuracy, source, and AI summary.</p>
                              </div>}
                    </div>
                </div>

                <div className="allnews-foot">
                    <div className="pstat">
                        <div className="pstat-l">Breaking</div>
                        <div className="pstat-v" style={{color: 'var(--breaking)'}}>{breaking}</div>
                    </div>
                    <div className="pstat">
                        <div className="pstat-l">High</div>
                        <div className="pstat-v" style={{color: 'var(--high)'}}>{high}</div>
                    </div>
                    <div className="pstat">
                        <div className="pstat-l">Regions</div>
                        <div className="pstat-v">{regions}</div>
                    </div>
                    <div className="pstat">
                        <div className="pstat-l">Sources</div>
                        <div className="pstat-v">{sources}</div>
                    </div>
                    <div className="allnews-foot-hint">ESC to close · selection stays synced with the feed panel</div>
                </div>
            </div>
        </div>
    );
}
