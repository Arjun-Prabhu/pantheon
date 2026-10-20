import {useState, useEffect} from 'react';
import {NEWS} from '../data/news.js';
import {parseMinutes} from '../utils/time.js';

const LEVEL_COLOR = {
    breaking: 'var(--breaking)',
    high:     'var(--high)',
    medium:   'var(--medium)',
    low:      'var(--low)',
};

const CAT_COLOR = {
    politics: 'var(--politics)',
    conflict: 'var(--conflict)',
    business: 'var(--business)',
};

function TimeGroup({label}) {
    return (
        <div className="tl-group">
            <span>{label}</span>
        </div>
    );
}

export default function TimelinePanel({activeRegion, onRegionSelect, maxAge}) {
    const [items, setItems] = useState(() =>
        [...NEWS].sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time))
    );

    useEffect(() => {
        const iv = setInterval(() => {
            setItems([...NEWS].sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time)));
        }, 2000);
        return () => clearInterval(iv);
    }, []);

    const filtered = (maxAge != null && maxAge < 300)
        ? items.filter(a => parseMinutes(a.time) <= maxAge)
        : items;

    const breaking = filtered.filter(a => a.level === 'breaking').length;
    const high     = filtered.filter(a => a.level === 'high').length;

    // Insert time-group markers
    const rendered = [];
    let lastBucket = null;
    for (const item of filtered) {
        const mins = parseMinutes(item.time);
        const bucket =
            mins === 0     ? 'JUST NOW' :
            mins < 15      ? 'WITHIN 15 MIN' :
            mins < 60      ? 'WITHIN 1 HOUR' :
            mins < 120     ? '1 – 2 HOURS AGO' :
                             '2+ HOURS AGO';
        if (bucket !== lastBucket) {
            rendered.push({type: 'group', label: bucket, key: `g-${bucket}`});
            lastBucket = bucket;
        }
        rendered.push({type: 'item', data: item, key: item._key ?? item.id});
    }

    return (
        <aside className="panel" id="timeline-panel">
            <div className="panel-head">
                <div className="panel-title">Event Timeline</div>
                <div className="panel-count">{filtered.length} events</div>
            </div>

            <div className="tl-feed">
                {rendered.map(r => {
                    if (r.type === 'group') return <TimeGroup key={r.key} label={r.label}/>;

                    const item = r.data;
                    const levelColor = LEVEL_COLOR[item.level] ?? 'var(--text-dim)';
                    const catColor   = CAT_COLOR[item.category]  ?? 'var(--text-dim)';
                    const isActive   = activeRegion === item.region;

                    return (
                        <div
                            key={r.key}
                            className={`tl-item${isActive ? ' tl-active' : ''}`}
                            onClick={() => onRegionSelect?.(item.region, item.lat, item.lon)}
                        >
                            <div className="tl-dot" style={{background: levelColor}}/>
                            <div className="tl-row">
                                <span className="tl-time">{item.time}</span>
                                <span className="tl-badge" style={{color: levelColor, borderColor: levelColor}}>
                                    {item.level}
                                </span>
                                <span className="tl-badge" style={{color: catColor, borderColor: catColor}}>
                                    {item.category}
                                </span>
                            </div>
                            <div className="tl-headline">{item.headline}</div>
                            <div className="tl-meta">{item.region} · {item.source}</div>
                        </div>
                    );
                })}
            </div>

            <div className="panel-stats">
                <div className="pstat">
                    <div className="pstat-l">Breaking</div>
                    <div className="pstat-v" style={{color: 'var(--breaking)'}}>{breaking}</div>
                </div>
                <div className="pstat">
                    <div className="pstat-l">High</div>
                    <div className="pstat-v" style={{color: 'var(--high)'}}>{high}</div>
                </div>
                <div className="pstat">
                    <div className="pstat-l">Total</div>
                    <div className="pstat-v">{filtered.length}</div>
                </div>
            </div>
        </aside>
    );
}
