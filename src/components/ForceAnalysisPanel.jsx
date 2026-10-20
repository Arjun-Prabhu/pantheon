import { useState } from 'react';

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

const AFFIL_FILTERS = ['All', 'Friendly', 'Hostile', 'Neutral', 'Unknown'];

export default function ForceAnalysisPanel({ pois = [], onPoiSelect, activePoi }) {
  const [affil, setAffil] = useState('All');

  const displayed = pois.filter(p =>
    affil === 'All' || p.affiliation === affil
  );

  const counts = {
    Friendly: pois.filter(p => p.affiliation === 'Friendly').length,
    Hostile:  pois.filter(p => p.affiliation === 'Hostile').length,
    Neutral:  pois.filter(p => p.affiliation === 'Neutral').length,
    Unknown:  pois.filter(p => p.affiliation === 'Unknown').length,
  };

  return (
    <div className="fa-panel">
      <div className="panel-head">
        <div className="panel-title">Points of Interest</div>
        <div className="panel-count">{pois.length} locations tracked</div>
      </div>

      <div className="fa-summary">
        {Object.entries(counts).map(([key, val]) => (
          <div key={key} className="fa-stat">
            <div className="fa-stat-label">{key}</div>
            <div className="fa-stat-value" style={{ color: AFFIL_COLOR[key] }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="fa-filter-bar">
        {AFFIL_FILTERS.map(f => (
          <button
            key={f}
            className={`fa-filter-btn${affil === f ? ' active' : ''}`}
            style={affil === f && f !== 'All' ? { color: AFFIL_COLOR[f], borderColor: AFFIL_COLOR[f], background: `${AFFIL_COLOR[f]}12` } : {}}
            onClick={() => setAffil(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="fa-list">
        {displayed.map(poi => {
          const color       = AFFIL_COLOR[poi.affiliation] ?? '#9b6dff';
          const statusColor = STATUS_COLOR[poi.status] ?? '#5c5c5c';
          const clsKey      = poi.classification.toLowerCase().replace(' ', '-');
          const isActive    = activePoi?.id === poi.id;

          return (
            <div
              key={poi.id}
              className={`poi-card${isActive ? ' poi-card-active' : ''}`}
              style={{ '--poi-color': color, borderLeftColor: color }}
              onClick={() => onPoiSelect?.(poi.id)}
            >
              <div className="poi-header">
                <div className="poi-header-main">
                  <div className="poi-type-row">
                    <span className="poi-type">{poi.type}</span>
                    <span className="poi-country-code">{poi.countryCode}</span>
                    <span className={`poi-cls poi-cls-${clsKey}`}>
                      {poi.classification === 'TOP SECRET' ? 'TS//NF' : poi.classification === 'SECRET' ? 'S' : 'U'}
                    </span>
                  </div>
                  <div className="poi-name">{poi.name}</div>
                  <div className="poi-location">{poi.location}</div>
                </div>
                <div className="poi-header-right">
                  <span className="poi-status-badge" style={{ color: statusColor, borderColor: statusColor, background: `${statusColor}18` }}>
                    {poi.status}
                  </span>
                  <span className="poi-expand-chevron">›</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
