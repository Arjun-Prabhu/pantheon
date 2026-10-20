import {useState, useEffect} from 'react';

/* ── helpers ─────────────────────────────────────────────── */
function generateHistory(baseValue, points = 52, volatility = 0.005) {
    const data = [];
    let v = baseValue * (1 - volatility * (Math.random() * 4 + 4));
    for (let i = 0; i < points - 1; i++) {
        v = v * (1 + (Math.random() - 0.47) * volatility);
        data.push(+v.toFixed(4));
    }
    data.push(baseValue);
    return data;
}

function tickArr(arr, vol) {
    return arr.map(item => {
        const nv = +(item.value * (1 + (Math.random() - 0.5) * vol)).toFixed(4);
        const nc = +Math.max(-15, Math.min(15, item.change + (Math.random() - 0.5) * 0.12)).toFixed(2);
        return {...item, value: nv, change: nc, history: [...item.history.slice(-51), nv]};
    });
}

/* ── Sparkline ───────────────────────────────────────────── */
function Sparkline({id, data, height = 28, up, area = false}) {
    if (!data || data.length < 2) return null;
    const W = 200;
    const pad = 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || min * 0.001;
    const color = up ? '#0a7038' : '#c8102e';
    const pts = data.map((v, i) => [
        (i / (data.length - 1)) * (W - pad * 2) + pad,
        height - pad - ((v - min) / range) * (height - pad * 2),
    ]);
    const lineStr = pts.map(([x, y]) => `${x},${y}`).join(' ');
    const gid = `mkt-sg-${id}`;
    const areaStr = `M${pts[0][0]},${pts[0][1]} ` +
        pts.slice(1).map(([x, y]) => `L${x},${y}`).join(' ') +
        ` L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height}Z`;

    return (
        <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${W} ${height}`}
            preserveAspectRatio="none"
            style={{display: 'block'}}
        >
            {area && (
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
                    </linearGradient>
                </defs>
            )}
            {area && <path d={areaStr} fill={`url(#${gid})`}/>}
            <polyline
                points={lineStr}
                fill="none"
                stroke={color}
                strokeWidth={area ? 2 : 1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

function ChangeLabel({change, suffix = '%'}) {
    const up = change >= 0;
    return (
        <span className={up ? 'mkt-change-up' : 'mkt-change-down'}>
            {up ? '+' : ''}{change.toFixed(2)}{suffix}
        </span>
    );
}

/* ── data ────────────────────────────────────────────────── */
const RAW_INDICES = [
    {id: 'spx',  label: 'S&P 500',    value: 5847.32,  change:  0.54},
    {id: 'ndx',  label: 'NASDAQ',     value: 20614.88, change: -0.21},
    {id: 'djia', label: 'DOW',        value: 43228.15, change:  0.38},
    {id: 'rut',  label: 'RUSSEL 2K',  value: 2184.60,  change: -0.67},
    {id: 'vix',  label: 'VIX',        value: 18.42,    change:  6.30},
];

const RAW_EQUITIES = [
    {id: 'lmt',  ticker: 'LMT',  name: 'Lockheed Martin',  value: 512.80,  change:  1.44, sector: 'Defense'},
    {id: 'rtx',  ticker: 'RTX',  name: 'RTX Corp',          value: 148.20,  change:  0.92, sector: 'Defense'},
    {id: 'noc',  ticker: 'NOC',  name: 'Northrop Grumman',  value: 521.40,  change: -0.28, sector: 'Defense'},
    {id: 'gd',   ticker: 'GD',   name: 'General Dynamics',  value: 302.55,  change:  0.61, sector: 'Defense'},
    {id: 'xom',  ticker: 'XOM',  name: 'ExxonMobil',        value: 122.18,  change: -0.83, sector: 'Energy'},
    {id: 'nvda', ticker: 'NVDA', name: 'NVIDIA',             value: 924.60,  change:  2.34, sector: 'Tech'},
    {id: 'gs',   ticker: 'GS',   name: 'Goldman Sachs',      value: 528.40,  change:  0.47, sector: 'Finance'},
];

const RAW_COMMODITIES = [
    {id: 'gold', label: 'GOLD',    unit: 'oz',    value: 3284.20, change:  0.31},
    {id: 'oil',  label: 'WTI OIL', unit: 'bbl',   value: 82.45,   change: -1.08},
    {id: 'ng',   label: 'NAT GAS', unit: 'MMBtu', value: 3.12,    change:  2.84},
];

const INITIAL_FX = [
    {pair: 'EUR/USD', value: 1.0928, change: -0.14},
    {pair: 'USD/JPY', value: 152.44, change:  0.38},
    {pair: 'USD/CNY', value: 7.2312, change:  0.06},
    {pair: 'GBP/USD', value: 1.2748, change: -0.19},
];

const withHistory = arr => arr.map(x => ({...x, history: generateHistory(x.value)}));

/* ── component ───────────────────────────────────────────── */
export default function StockMarketPanel() {
    const [featured, setFeatured] = useState('spx');
    const [indices, setIndices] = useState(() => withHistory(RAW_INDICES));
    const [equities, setEquities] = useState(() => withHistory(RAW_EQUITIES));
    const [commodities, setCommodities] = useState(() => withHistory(RAW_COMMODITIES));
    const [fx, setFx] = useState(INITIAL_FX);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        const iv = setInterval(() => {
            setIndices(p => tickArr(p, 0.0003));
            setEquities(p => tickArr(p, 0.0004));
            setCommodities(p => tickArr(p, 0.0003));
            setFx(p => p.map(f => ({
                ...f,
                value: +(f.value * (1 + (Math.random() - 0.5) * 0.00015)).toFixed(4),
                change: +Math.max(-5, Math.min(5, f.change + (Math.random() - 0.5) * 0.06)).toFixed(2),
            })));
            setLastUpdate(new Date());
        }, 2800);
        return () => clearInterval(iv);
    }, []);

    const featIdx = indices.find(i => i.id === featured) ?? indices[0];
    const fmtVal = (v, dec = 2) => v.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});
    const fmtTime = d => d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}) + ' UTC';

    return (
        <div className="mkt-panel">
            <div className="panel-head">
                <div className="panel-title">Market Intelligence</div>
                <div className="panel-count">{fmtTime(lastUpdate)}</div>
            </div>

            {/* Featured chart */}
            <div className="mkt-featured">
                <div className="mkt-featured-meta">
                    <span className="mkt-featured-label">{featIdx.label}</span>
                    <span className="mkt-featured-value">{fmtVal(featIdx.value)}</span>
                    <span className="mkt-featured-change"><ChangeLabel change={featIdx.change}/></span>
                    <span className="mkt-featured-hint">click index to switch</span>
                </div>
                <Sparkline id={`feat-${featIdx.id}`} data={featIdx.history} height={68} up={featIdx.change >= 0} area/>
            </div>

            {/* Indices */}
            <div className="mkt-section">
                <div className="mkt-section-label">Major Indices</div>
                <div className="mkt-index-grid">
                    {indices.map(idx => (
                        <div
                            key={idx.id}
                            className={`mkt-index-card${featured === idx.id ? ' selected' : ''}`}
                            onClick={() => setFeatured(idx.id)}
                        >
                            <div className="mkt-index-label">{idx.label}</div>
                            <div className="mkt-index-value">{fmtVal(idx.value)}</div>
                            <div className="mkt-index-change"><ChangeLabel change={idx.change}/></div>
                            <div className="mkt-card-spark">
                                <Sparkline id={`idx-${idx.id}`} data={idx.history} height={22} up={idx.change >= 0}/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Equities */}
            <div className="mkt-section">
                <div className="mkt-section-label">Equities — Defense &amp; Key Sectors</div>
                {equities.map(eq => (
                    <div key={eq.id} className="mkt-equity-row">
                        <span className="mkt-ticker">{eq.ticker}</span>
                        <span className="mkt-eq-name">{eq.name}</span>
                        <span className="mkt-sector-tag">{eq.sector}</span>
                        <span className="mkt-price">${fmtVal(eq.value)}</span>
                        <span className="mkt-eq-change"><ChangeLabel change={eq.change}/></span>
                        <div className="mkt-eq-spark">
                            <Sparkline id={`eq-${eq.id}`} data={eq.history} height={18} up={eq.change >= 0}/>
                        </div>
                    </div>
                ))}
            </div>

            {/* Commodities */}
            <div className="mkt-section">
                <div className="mkt-section-label">Commodities</div>
                <div className="mkt-index-grid">
                    {commodities.map(c => (
                        <div key={c.id} className="mkt-index-card">
                            <div className="mkt-index-label">{c.label} <span style={{opacity: 0.55, fontSize: '8px'}}>/{c.unit}</span></div>
                            <div className="mkt-index-value">${fmtVal(c.value)}</div>
                            <div className="mkt-index-change"><ChangeLabel change={c.change}/></div>
                            <div className="mkt-card-spark">
                                <Sparkline id={`com-${c.id}`} data={c.history} height={22} up={c.change >= 0}/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FX */}
            <div className="mkt-section">
                <div className="mkt-section-label">Foreign Exchange</div>
                {fx.map(f => (
                    <div key={f.pair} className="mkt-equity-row">
                        <span className="mkt-ticker" style={{width: '72px'}}>{f.pair}</span>
                        <span style={{flex: 1}}/>
                        <span className="mkt-price">{f.value.toFixed(4)}</span>
                        <span className="mkt-eq-change"><ChangeLabel change={f.change}/></span>
                    </div>
                ))}
            </div>

            <div className="mkt-footer">
                <span>DATA: SIMULATED · 15-MIN DELAY</span>
                <span>NYSE · NASDAQ · CME</span>
            </div>
        </div>
    );
}
