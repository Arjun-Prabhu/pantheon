const MAX = 240;

const TICKS = [
    {val: 0, label: '4H'},
    {val: MAX - 120, label: '2H'},
    {val: MAX-60,  label: '1H'},
    {val: MAX-30,  label: '30M'},
    {val: MAX, label: 'ALL'},
];

function fmtVal(v) {
    if (v >= MAX) return 'ALL';
    if (v === 0)  return 'JUST NOW';
    if (v < 60)   return `${v}M AGO`;
    const h = Math.floor(v / 60), m = v % 60;
    return m ? `${h}H ${m}M AGO` : `${h}H AGO`;
}

export { MAX as SCRUBBER_MAX };

export default function ScrubberBar({value, onChange}) {
    const sliderVal = Math.min(value ?? MAX, MAX);

    return (
        <div className="scrubber-bar">
            <span className="scrubber-label">TIME FILTER</span>

            <div className="scrubber-track">
                <input
                    type="range"
                    className="scrubber-input"
                    min={0}
                    max={MAX}
                    step={5}
                    value={sliderVal}
                    onChange={e => onChange(parseInt(e.target.value))}
                />
                <div className="scrubber-ticks">
                    {TICKS.map(t => (
                        <span
                            key={t.label}
                            className={`scrubber-tick${sliderVal === t.val ? ' active' : ''}`}
                            style={{left: `${(t.val / MAX) * 100}%`}}
                            onClick={() => onChange(t.val)}
                        >
                            {t.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
