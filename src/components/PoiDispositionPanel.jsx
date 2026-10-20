import { useEffect, useRef, useState } from 'react';

const AFFIL_COLOR = {
  Friendly: '#1a50a0',
  Hostile:  '#c8102e',
  Neutral:  '#806000',
  Unknown:  '#5828b8',
};

const STATUS_COLOR = {
  Active:   '#0a7038',
  Elevated: '#c8102e',
  Standby:  '#806000',
  Unknown:  '#5c5c5c',
};

function formatCoords(lat, lon) {
  const la = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(lon).toFixed(3)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${la}  ${lo}`;
}

function DataRow({ label, value, style }) {
  return (
    <div className="fdp-row">
      <span className="fdp-row-label">{label}</span>
      <span className="fdp-row-value" style={style}>{value}</span>
    </div>
  );
}

export default function PoiDispositionPanel({ poi, onClose }) {
  const color       = AFFIL_COLOR[poi.affiliation] ?? '#9b6dff';
  const statusColor = STATUS_COLOR[poi.status] ?? '#5c5c5c';
  const clsKey      = poi.classification.toLowerCase().replace(' ', '-');

  const [pos, setPos] = useState(() => ({
    x: Math.max(0, window.innerWidth  - 420),
    y: Math.max(0, 80),
  }));

  const drag = useRef({ active: false, startX: 0, startY: 0, initX: 0, initY: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current.active) return;
      setPos({
        x: drag.current.initX + (e.clientX - drag.current.startX),
        y: drag.current.initY + (e.clientY - drag.current.startY),
      });
    };
    const onUp = () => { drag.current.active = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const onDragStart = (e) => {
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, initX: pos.x, initY: pos.y };
    e.preventDefault();
  };

  return (
    <div
      className="fdp poi-fdp"
      style={{ '--fdp-color': color, position: 'fixed', left: pos.x, top: pos.y, zIndex: 120 }}
    >
      <div className={`fdp-classbar fdp-class-${clsKey}`}>
        {poi.classification}{poi.classification === 'TOP SECRET' ? '//NOFORN' : ''}
      </div>

      <div className="fdp-header poi-fdp-header" onMouseDown={onDragStart}>
        <span className="poi-fdp-drag-hint">⠿</span>
        <span className="fdp-title">{poi.type.toUpperCase()}</span>
        <div className="fdp-badges">
          <span className="fdp-affil" style={{ color, borderColor: color }}>{poi.affiliation}</span>
          <span
            className="fdp-status"
            style={{ color: statusColor, borderColor: `${statusColor}80`, background: `${statusColor}12` }}
          >
            {poi.status}
          </span>
        </div>
        <button className="fdp-close" onClick={onClose}>✕</button>
      </div>

      <div className="fdp-symbol-area" style={{ padding: '12px 14px 10px', gap: 0 }}>
        <div className="fdp-ident" style={{ flex: 1 }}>
          <div className="fdp-desig" style={{ fontSize: 11, marginBottom: 3 }}>{poi.countryCode} · {poi.country}</div>
          <div className="fdp-name" style={{ fontSize: 18, lineHeight: 1.2, marginBottom: 6 }}>{poi.name}</div>
          <div className="fdp-country" style={{ fontSize: 10 }}>{poi.location}</div>
        </div>
      </div>

      <div className="fdp-data">
        <DataRow label="COORDINATES" value={formatCoords(poi.lat, poi.lon)} />
        <DataRow label="AFFILIATION" value={poi.affiliation} style={{ color }} />
        <DataRow label="STATUS"      value={poi.status}      style={{ color: statusColor }} />
        {poi.estimatedPersonnel != null && (
          <DataRow label="EST. PERSONNEL" value={`~${poi.estimatedPersonnel.toLocaleString()} PAX`} />
        )}
      </div>

      {poi.observedAssets.length > 0 && (
        <div className="fdp-section">
          <div className="fdp-section-label">Observed Assets</div>
          <div className="fdp-equip-list">
            {poi.observedAssets.map((a, i) => (
              <span key={i} className="fdp-equip-tag">{a}</span>
            ))}
          </div>
        </div>
      )}

      {poi.activityIndicators?.length > 0 && (
        <div className="fdp-section">
          <div className="fdp-section-label">Activity Indicators</div>
          <div className="poi-indicators">
            {poi.activityIndicators.map((ind, i) => (
              <div key={i} className="poi-indicator">▸ {ind}</div>
            ))}
          </div>
        </div>
      )}

      {poi.notes && (
        <div className="fdp-notes">
          <span className="fdp-notes-prefix">ANALYST NOTE —</span> {poi.notes}
        </div>
      )}

      <div className="fdp-footer">
        <span>SRC: IMINT/SIGINT FUSION</span>
        <span>UPD: {poi.lastUpdated.replace('T', ' ')}</span>
      </div>
    </div>
  );
}
