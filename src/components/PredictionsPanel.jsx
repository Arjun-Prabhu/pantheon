import { useState } from 'react';
import { PREDICTIONS } from '../data/predictions';

const THREAT_COLORS = {
  'Military Escalation':  '#ff2244',
  'Maritime Disruption':  '#0095d8',
  'Offensive Operation':  '#ff7020',
  'Cross-Border Incident':'#f5bc00',
  'Insurgency Expansion': '#cc22ff',
  'Territorial Incident': '#00c8a8',
};

const CONFIDENCE_META = {
  high:   { label: 'HIGH CONF',   color: '#ff2244' },
  medium: { label: 'MED CONF',    color: '#f5bc00' },
  low:    { label: 'LOW CONF',    color: '#29b6f6' },
};

function ProbabilityBar({ value }) {
  const color = value >= 70 ? '#ff2244' : value >= 50 ? '#f5bc00' : '#29b6f6';
  return (
    <div className="pred-prob-wrap">
      <div className="pred-prob-track">
        <div className="pred-prob-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="pred-prob-pct" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function PredictionsPanel({ onLocationSelect }) {
  const [expanded, setExpanded] = useState(null);

  const toggle = (pred) => {
    const next = expanded === pred.id ? null : pred.id;
    setExpanded(next);
    if (next) onLocationSelect?.(pred.lat, pred.lon);
  };

  return (
    <div className="pred-panel">
      <div className="pred-panel-header">
        <div className="pred-ai-badge">
          <span className="pred-ai-dot" />
          AI ANALYSIS
        </div>
        <span className="pred-updated">
          {new Date().toUTCString().slice(17, 22)} UTC
        </span>
      </div>

      <div className="pred-disclaimer">
        Probabilistic assessments via OSINT, SIGINT pattern analysis &amp; multi-source fusion.
        Not a substitute for validated human intelligence.
      </div>

      <div className="pred-list">
        {PREDICTIONS.map(p => {
          const conf = CONFIDENCE_META[p.confidence];
          const threatColor = THREAT_COLORS[p.threat] ?? '#888888';
          const isOpen = expanded === p.id;

          return (
            <div
              key={p.id}
              className={`pred-card${isOpen ? ' pred-card--open' : ''}`}
              onClick={() => toggle(p)}
            >
              <div className="pred-card-row1">
                <div>
                  <div className="pred-location">{p.location}</div>
                  <div className="pred-region">{p.region}</div>
                </div>
                <div className="pred-meta-col">
                  <span
                    className="pred-conf-badge"
                    style={{ color: conf.color, borderColor: conf.color }}
                  >
                    {conf.label}
                  </span>
                  <span className="pred-horizon">{p.horizon}</span>
                </div>
              </div>

              <span
                className="pred-threat-tag"
                style={{ color: threatColor, borderColor: `${threatColor}55`, background: `${threatColor}11` }}
              >
                {p.threat}
              </span>

              <ProbabilityBar value={p.probability} />

              {isOpen && (
                <div className="pred-detail">
                  <p className="pred-summary">{p.summary}</p>
                  <div className="pred-drivers-head">KEY INDICATORS</div>
                  <ul className="pred-drivers">
                    {p.drivers.map((d, i) => (
                      <li key={i}>
                        <span className="pred-driver-dot" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="pred-classification">PREDICTION — AI GENERATED // NOT FOR DISSEMINATION</div>
                </div>
              )}

              <div className="pred-chevron">{isOpen ? '▲' : '▼'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
