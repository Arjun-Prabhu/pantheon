import UnitSymbol from './UnitSymbol';

const AFFIL_COLOR = {
  Friendly: '#1a50a0',
  Hostile:  '#c8102e',
  Neutral:  '#806000',
  Unknown:  '#5828b8',
};

function DataRow({ label, value, style }) {
  return (
    <div className="fdp-row">
      <span className="fdp-row-label">{label}</span>
      <span className="fdp-row-value" style={style}>{value}</span>
    </div>
  );
}

function formatCoords(lat, lon) {
  const la = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${la}  ${lo}`;
}

export default function ForceDispositionPanel({ unit, onClose }) {
  const color   = AFFIL_COLOR[unit.affiliation] ?? '#9b6dff';
  const clsKey  = unit.classification.toLowerCase().replace(' ', '-');
  const statKey = unit.status.toLowerCase().replace(' ', '-');

  return (
    <div className="fdp" style={{ '--fdp-color': color }}>
      {/* Classification banner */}
      <div className={`fdp-classbar fdp-class-${clsKey}`}>
        {unit.classification}{unit.classification === 'TOP SECRET' ? '//NOFORN' : ''}
      </div>

      {/* Header */}
      <div className="fdp-header">
        <span className="fdp-title">FORCE DISPOSITION</span>
        <div className="fdp-badges">
          <span className="fdp-affil" style={{ color, borderColor: color }}>{unit.affiliation}</span>
          <span className={`fdp-status fdp-status-${statKey}`}>{unit.status}</span>
        </div>
        <button className="fdp-close" onClick={onClose}>✕</button>
      </div>

      {/* Wireframe symbol + unit identity */}
      <div className="fdp-symbol-area">
        <UnitSymbol unit={unit} size={164} />
        <div className="fdp-ident">
          <div className="fdp-desig">{unit.designation}</div>
          <div className="fdp-name">{unit.name}</div>
          <div className="fdp-country">
            <span className="fdp-country-code">{unit.countryCode}</span>
            {unit.nationality}
          </div>
        </div>
      </div>

      {/* Data grid */}
      <div className="fdp-data">
        <DataRow label="TYPE"        value={`${unit.type} / ${unit.domain}`} />
        <DataRow label="SIZE"        value={unit.size ?? 'NOT SPECIFIED'} />
        <DataRow label="LOCATION"    value={unit.location} />
        <DataRow label="COORDINATES" value={formatCoords(unit.lat, unit.lon)} />
        {unit.strength != null && (
          <DataRow label="STRENGTH" value={`~${unit.strength.toLocaleString()} PAX`} />
        )}
      </div>

      {/* Equipment */}
      {unit.equipment.length > 0 && (
        <div className="fdp-section">
          <div className="fdp-section-label">EQUIPMENT MANIFEST</div>
          <div className="fdp-equip-list">
            {unit.equipment.map((e, i) => (
              <span key={i} className="fdp-equip-tag">{e}</span>
            ))}
          </div>
        </div>
      )}

      {/* Analyst note */}
      {unit.notes && (
        <div className="fdp-notes">
          <span className="fdp-notes-prefix">ANALYST NOTE —</span> {unit.notes}
        </div>
      )}

      {/* Footer */}
      <div className="fdp-footer">
        <span>SRC: IMINT/SIGINT FUSION</span>
        <span>UPD: {unit.lastUpdated.replace('T', ' ')}</span>
      </div>
    </div>
  );
}
