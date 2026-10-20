import { useMemo } from 'react';
import tank        from '../assets/units/tank.png?raw';
import infantry    from '../assets/units/infantry.png?raw';
import artillery   from '../assets/units/tubeArty.png?raw';
import naval       from '../assets/units/ship.png?raw';
import csg     from '../assets/units/csg.png?raw';
// import marinesSvg     from '../assets/units/marines.svg?raw';
import jetSvg         from '../assets/units/jet.jpg?raw';
// import sfSvg          from '../assets/units/special-forces.svg?raw';
// import engineeringSvg from '../assets/units/engineering.svg?raw';

const AFFIL_COLOR = {
  Friendly: '#1a50a0',
  Hostile:  '#c8102e',
  Neutral:  '#806000',
  Unknown:  '#5828b8',
};

const UNIT_SVGS = {
  Armor:            tank,
  Infantry:         infantry,
  Artillery:        artillery,
  Naval:            naval,
  Marines:          infantry,
  'Air Force':      jetSvg,
  Aviation:         jetSvg,
  'Special Forces': infantry,
  Engineering:      infantry,
};

const ECHELON = {
  Squad:       [{ t: 'dot', x: 0 }],
  Platoon:     [{ t: 'dot', x: -7 }, { t: 'dot', x: 0 }, { t: 'dot', x: 7 }],
  Company:     [{ t: 'bar', x: 0 }],
  Battalion:   [{ t: 'bar', x: -5 }, { t: 'bar', x: 5 }],
  Brigade:     [{ t: 'bar', x: -9 }, { t: 'bar', x: 0 }, { t: 'bar', x: 9 }],
  Division:    [{ t: 'x', x: 0 }],
  Corps:       [{ t: 'x', x: -9 }, { t: 'x', x: 9 }],
  Army:        [{ t: 'x', x: -13 }, { t: 'x', x: 0 }, { t: 'x', x: 13 }],
  'Task Force':[{ t: 'tf', x: 0 }],
  Fleet:       [{ t: 'x', x: -9 }, { t: 'x', x: 0 }, { t: 'x', x: 9 }],
};

export default function UnitSymbol({ unit, size = 200 }) {
  const color = AFFIL_COLOR[unit.affiliation] ?? '#9b6dff';

  const cx = size / 2;
  const cy = size / 2 + size * 0.06;
  const fw = size * 0.56;
  const fh = size * 0.34;
  const fx = cx - fw / 2;
  const fy = cy - fh / 2;
  const gs = size / 9;
  const sw = 2;
  const uid = `usym-${unit.id}`;

  const isCSG = unit.type === 'Naval' && unit.size === 'Task Force';
  const rawSvg = isCSG ? csg : (UNIT_SVGS[unit.type] ?? tank);

  const iconDataUrl = useMemo(() => {
    const colored = rawSvg.replaceAll('UNIT_COLOR', color);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(colored)}`;
  }, [rawSvg, color]);

  function Frame() {
    const fill = `${color}22`;
    if (unit.domain === 'Sea') {
      const hw = fw / 2, hh = fh / 2;
      return (
        <path
          d={`M ${cx} ${cy - hh * 1.45} L ${cx + hw} ${cy} L ${cx} ${cy + hh * 1.45} L ${cx - hw} ${cy} Z`}
          fill={fill} stroke={color} strokeWidth={sw}
        />
      );
    }
    if (unit.domain === 'Air') {
      return <circle cx={cx} cy={cy} r={fw * 0.46} fill={fill} stroke={color} strokeWidth={sw} />;
    }
    return <rect x={fx} y={fy} width={fw} height={fh} fill={fill} stroke={color} strokeWidth={sw} />;
  }

  function Echelon() {
    const marks = ECHELON[unit.size];
    if (!marks) return null;
    const ey  = fy - size * 0.065;
    const bh  = size * 0.065;
    const xd  = size * 0.038;
    return (
      <g>
        {marks.map((m, i) => {
          const mx = cx + m.x;
          if (m.t === 'dot')
            return <circle key={i} cx={mx} cy={ey} r={2.5} fill={color} />;
          if (m.t === 'bar')
            return <line key={i} x1={mx} y1={ey - bh / 2} x2={mx} y2={ey + bh / 2} stroke={color} strokeWidth={2} />;
          if (m.t === 'x')
            return (
              <g key={i}>
                <line x1={mx - xd} y1={ey - xd} x2={mx + xd} y2={ey + xd} stroke={color} strokeWidth={1.6} />
                <line x1={mx + xd} y1={ey - xd} x2={mx - xd} y2={ey + xd} stroke={color} strokeWidth={1.6} />
              </g>
            );
          if (m.t === 'tf')
            return (
              <path key={i} d={`M ${mx} ${ey - xd} L ${mx + xd} ${ey} L ${mx} ${ey + xd} L ${mx - xd} ${ey} Z`}
                fill="none" stroke={color} strokeWidth={1.6} />
            );
          return null;
        })}
      </g>
    );
  }

  const pad = fw * 0.1;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="unit-symbol-svg">
      <defs>
        <pattern id={`${uid}-grid`} width={gs} height={gs} patternUnits="userSpaceOnUse">
          <path d={`M ${gs} 0 L 0 0 0 ${gs}`} fill="none" stroke={color} strokeWidth="0.4" opacity="0.12" />
        </pattern>
        <clipPath id={`${uid}-clip`}>
          <Frame />
        </clipPath>
      </defs>
      <rect width={size} height={size} fill="#edf0f3" rx="3" />
      <rect width={size} height={size} fill={`url(#${uid}-grid)`} rx="3" />
      <Frame />
      <image
        href={iconDataUrl}
        x={fx + pad} y={fy + pad}
        width={fw - pad * 2} height={fh - pad * 2}
        clipPath={`url(#${uid}-clip)`}
      />
      <Echelon />
    </svg>
  );
}
