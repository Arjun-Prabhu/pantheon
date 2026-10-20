const LAYER_DEFS = [
    {id: 'newsMarkers', label: 'News Events',      color: '#c8102e'},
    {id: 'poiMarkers',  label: 'Points of Interest', color: '#1a50a0'},
    {id: 'labels',      label: 'Country Labels',   color: '#806000'},
    {id: 'grid',        label: 'Grid Lines',        color: '#5828b8'},
];

export default function LayerToggle({layers, onChange}) {
    return (
        <div className="layer-toggle">
            <div className="lt-header">LAYERS</div>
            {LAYER_DEFS.map(def => {
                const on = layers[def.id] !== false;
                return (
                    <div
                        key={def.id}
                        className={`lt-row${on ? ' active' : ''}`}
                        onClick={() => onChange({...layers, [def.id]: !on})}
                    >
                        <div
                            className="lt-pip"
                            style={on
                                ? {background: def.color, borderColor: def.color}
                                : {background: 'transparent', borderColor: 'var(--border-mid)'}
                            }
                        />
                        <span className="lt-row-label">{def.label}</span>
                        <span className="lt-toggle">{on ? 'ON' : 'OFF'}</span>
                    </div>
                );
            })}
        </div>
    );
}
