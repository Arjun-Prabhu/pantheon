import {useState, useEffect, useCallback, useRef} from 'react';
import NewsItem from './NewsItem';
import NewsDetail from './NewsDetail';
import AllNewsModal from './AllNewsModal';
import {NEWS} from "../data/news.js";
import {parseMinutes} from '../utils/time.js';
import {FILTER_CHIPS, GROUPS} from '../utils/newsFilters.js';

export default function NewsPanel({news, activeRegion, onRegionSelect, onRegionClear, expanded, setExpanded, newsItem, setNewsItem, maxAge}) {
    const keyIndex = useRef(0);
    const [allOpen, setAllOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState(new Set());
    const [filterOpen, setFilterOpen] = useState(false);
    const filterBtnRef = useRef(null);
    const filterPopRef = useRef(null);
    const [feed, setFeed] = useState([]);
    const [selected, setSelected] = useState(-1);
    const [newEvents, setNewEvents] = useState(0);
    const [unrendered, setUnrendered] = useState([]);
    const [viewedItems, setViewedItems] = useState(0);
    const filtered = useCallback((news) => {
        let list = [...news];
        let i = 0;
        for (i = 0; i < list.length; i++) {
            if (!list[i]._key) list[i]._key = keyIndex.current + i + 1;
        }
        keyIndex.current = keyIndex.current + i + 1;
        if (activeRegion) list = list.filter(a => a.region === activeRegion);
        if (maxAge != null && maxAge < 300) list = list.filter(a => parseMinutes(a.time) <= maxAge);
        const cats = FILTER_CHIPS.filter(f => f.type === 'cat' && activeFilters.has(f.id)).map(f => f.id);
        const levels = FILTER_CHIPS.filter(f => f.type === 'level' && activeFilters.has(f.id)).map(f => f.id);
        if (cats.length) list = list.filter(a => cats.includes(a.category));
        if (levels.length) list = list.filter(a => levels.includes(a.level));
        console.log(list.length)
        return list.sort((a, b) => b.importance - a.importance);
    }, [news, activeRegion, activeFilters, maxAge]);

    useEffect(() => {
        if (!filterOpen) return;
        const handler = (e) => {
            if (
                filterPopRef.current && !filterPopRef.current.contains(e.target) &&
                filterBtnRef.current && !filterBtnRef.current.contains(e.target)
            ) setFilterOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [filterOpen]);

    useEffect(() => {
        setFeed(filtered(news).slice(0, 15));
    }, [filtered]);

    useEffect(() => {
        const originalNews = filtered(news);
        setUnrendered(originalNews);
        setViewedItems(originalNews.length);
        const createMockData = () => {
            if (Math.random() > 0.35) {
                const article = NEWS[Math.floor(Math.random() * NEWS.length)];
                NEWS.push({
                    id: keyIndex.current,
                    headline: article.headline,
                    summary: article.summary,
                    category: article.category,
                    region: article.region,
                    lat: article.lat,
                    lon: article.lon,
                    importance: article.importance,
                    level: article.level,
                    source: article.source,
                    time: "just now",
                });
                keyIndex.current = keyIndex.current + 1;
            }
        };
        const mock = setInterval(createMockData, 4000);
        return () => clearInterval(mock);
    }, []);

    useEffect(() => {
        const pollData = () => {
            if (NEWS.length > unrendered?.length) {
                const newFeed = structuredClone(NEWS);
                newFeed.reverse();
                setNewEvents(NEWS.length - viewedItems);
                setUnrendered(newFeed);
            }
        };
        const poll = setInterval(pollData, 2000);
        return () => clearInterval(poll);
    }, [unrendered, viewedItems]);

    const refreshData = () => {
        setFeed(() => filtered(unrendered).slice(0, 15));
        setViewedItems(unrendered.length);
        setUnrendered([]);
        setNewEvents(0);
    };

    const breaking = feed.filter(a => a.level === 'breaking').length;
    const high = feed.filter(a => a.level === 'high').length;
    const regions = new Set(feed.map(a => a.region)).size;

    /* Drives the same newsItem/expanded state the feed items use, so the
       all-feeds modal and the detail popup always show the same article. */
    const selectArticle = (a) => {
        setSelected(a._key ?? a.id ?? -1);
        setNewsItem(a);
        setExpanded(true);
        onRegionSelect(a.region, a.lat, a.lon);
    };

    return (
        <>
            <div className="panel-head">
                <div className="panel-title">Quick Access</div>
                <div className="panel-count">Total: {NEWS.length} articles</div>
                <button className="panel-viewall" onClick={() => setAllOpen(true)}>
                    VIEW ALL
                    <span className="panel-viewall-count">{NEWS.length}</span>
                </button>
            </div>

            {activeRegion && (
                <div className="region-bar">
                    <div>
                        <div className="region-name">{activeRegion}</div>
                        <div className="region-evt">{feed.length} events</div>
                    </div>
                    <button className="btn-clear" onClick={onRegionClear}>✕ Clear</button>
                </div>
            )}

            {newEvents > 0 && (
                <div className="data-bar">
                    <div>
                        <div className="data-label">NEW DATA AVAILABLE</div>
                        <div className="data-value">{newEvents === 1 ? "1 new event" : `${newEvents} new events`}</div>
                    </div>
                    <button className="data-refresh" onClick={refreshData}>REFRESH ALL</button>
                </div>
            )}

            <div className="filter-bar">
                <button
                    ref={filterBtnRef}
                    className={`filter-toggle${filterOpen ? ' open' : ''}${activeFilters.size > 0 || activeRegion ? ' has-filters' : ''}`}
                    onClick={() => setFilterOpen(o => !o)}
                >
                    <span>FILTER</span>
                    {(activeFilters.size > 0 || activeRegion) && (
                        <span className="filter-count">{activeFilters.size + (activeRegion ? 1 : 0)}</span>
                    )}
                    <span className="filter-caret">{filterOpen ? '▲' : '▼'}</span>
                </button>
                {(activeFilters.size > 0 || activeRegion) && (
                    <button className="filter-clear-all" onClick={() => { setActiveFilters(new Set()); onRegionClear(); }}>Clear all</button>
                )}
                {filterOpen && (
                    <div className="filter-popup" ref={filterPopRef}>
                        {GROUPS.map(g => (
                            <div key={g.type} className="filter-group">
                                <div className="filter-group-label">{g.label}</div>
                                <div className="filter-group-chips">
                                    {FILTER_CHIPS.filter(f => f.type === g.type).map(f => {
                                        const isRegion = f.type === 'region';
                                        const isActive = isRegion ? f.label === activeRegion : activeFilters.has(f.id);
                                        return (
                                            <button
                                                key={f.id}
                                                className={`fchip fchip-${f.id}${isActive ? ' active' : ''}`}
                                                onClick={() => {
                                                    if (isRegion) {
                                                        isActive ? onRegionClear() : onRegionSelect(f.label, null, null);
                                                    } else {
                                                        setActiveFilters(prev => {
                                                            const next = new Set(prev);
                                                            next.has(f.id) ? next.delete(f.id) : next.add(f.id);
                                                            return next;
                                                        });
                                                    }
                                                }}
                                            >
                                                {f.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="news-feed">
                {feed.map((a) => (
                    <NewsItem
                        key={a._key}
                        article={a}
                        showScore={true}
                        activeRegion={activeRegion}
                        onRegionSelect={onRegionSelect}
                        onClick={() => {
                            setSelected(s => s === a._key ? -1 : a._key);
                            setExpanded(e => !e);
                            setNewsItem(a);
                            onRegionSelect(a.region, a.lat, a.lon);
                        }}
                    />
                ))}
            </div>

            <div className="side-bar-options" style={{
                left: "20%",
                top: "20%",
                opacity: expanded ? 1 : 0,
                width: expanded ? "60%" : "0",
                height: expanded ? "50%" : "0",
            }}>
                {expanded && newsItem && (
                    <NewsDetail article={newsItem} onClose={() => setExpanded(false)}/>
                )}
            </div>

            <AllNewsModal
                open={allOpen}
                onClose={() => setAllOpen(false)}
                article={newsItem}
                onSelect={selectArticle}
            />

            <div className="panel-stats-options">
                <div className="panel-stats-wrapper">
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
                </div>
                <div className={"panel-options-wrapper"}>
                    {/*<p className="pstat-l">Number of Display Items:</p>*/}
                    <p className="pstat-l">Number of Events:</p>
                    {unrendered.length}
                </div>


            </div>
        </>
    );
}
