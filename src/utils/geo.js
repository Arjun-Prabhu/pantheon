// TopoJSON decoder + equirectangular canvas renderer for the globe texture

export function topoFeature(topology, obj) {
  const { scale = [1, 1], translate = [0, 0] } = topology.transform || {};

  function decodeArc(idx) {
    const raw = topology.arcs[idx < 0 ? ~idx : idx];
    let x = 0, y = 0;
    const pts = raw
      .map(([dx, dy]) => [x += dx, y += dy])
      .map(([px, py]) => [px * scale[0] + translate[0], py * scale[1] + translate[1]]);
    if (idx < 0) pts.reverse();
    return pts;
  }

  function stitchRing(idxs) {
    const out = [];
    for (const i of idxs) {
      const a = decodeArc(i);
      if (out.length) a.shift();
      out.push(...a);
    }
    return out;
  }

  function geom(g) {
    if (!g) return null;
    if (g.type === 'Polygon')
      return { type: 'Polygon', coordinates: g.arcs.map(stitchRing) };
    if (g.type === 'MultiPolygon')
      return { type: 'MultiPolygon', coordinates: g.arcs.map(p => p.map(stitchRing)) };
    return null;
  }

  if (obj.type === 'GeometryCollection') {
    return {
      type: 'FeatureCollection',
      features: obj.geometries.map(g => ({ type: 'Feature', properties: {}, geometry: geom(g) })),
    };
  }
  return { type: 'Feature', properties: {}, geometry: geom(obj) };
}

export function drawGeoJSON(ctx, geojson, W, H) {
  function proj([lon, lat]) {
    return [(lon + 180) * (W / 360), (90 - lat) * (H / 180)];
  }
  function ring(coords) {
    if (!coords.length) return;
    const [x0, y0] = proj(coords[0]);
    ctx.moveTo(x0, y0);
    let prevX = x0;
    for (let i = 1; i < coords.length; i++) {
      const [x, y] = proj(coords[i]);
      if (Math.abs(x - prevX) > W / 2) {
        ctx.closePath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      prevX = x;
    }
    ctx.closePath();
  }
  function geometry(g) {
    if (!g) return;
    ctx.beginPath();
    if (g.type === 'Polygon') g.coordinates.forEach(ring);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(ring));
    ctx.fill();
    ctx.stroke();
  }
  if (geojson.type === 'FeatureCollection') geojson.features.forEach(f => geometry(f.geometry));
  else geometry(geojson.geometry || geojson);
}

// ── Noise helpers for procedural terrain ─────────────────────────────────────

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return (
    hash2(ix,     iy    ) * (1 - ux) * (1 - uy) +
    hash2(ix + 1, iy    ) * ux       * (1 - uy) +
    hash2(ix,     iy + 1) * (1 - ux) * uy       +
    hash2(ix + 1, iy + 1) * ux       * uy
  );
}

// 3-octave fractional Brownian motion → [0, 1]
function fbm(x, y) {
  return (
    smoothNoise(x * 4,  y * 4)  * 0.571 +
    smoothNoise(x * 8,  y * 8)  * 0.286 +
    smoothNoise(x * 16, y * 16) * 0.143
  );
}

// Longitude-seamless fbm: sampling noise around a circle of circumference `period`
// means x=0 and x=period land on the same point, so the map has no visible join at
// the antimeridian. Needed for any texture the globe wraps all the way around.
function fbmCyclic(u, y, period) {
  const th = u * 2 * Math.PI;
  const r  = period / (2 * Math.PI);
  const cx = r + r * Math.cos(th);
  const cy = r + r * Math.sin(th);
  return (
    smoothNoise(cx,       cy       + y)      * 0.52 +
    smoothNoise(cx * 2.3, cy * 2.3 + y * 2.3) * 0.28 +
    smoothNoise(cx * 5.1, cy * 5.1 + y * 5.1) * 0.20
  );
}

// ── Shared world-atlas cache (one fetch for all texture builders) ─────────────

let _worldCache = null;
async function fetchWorldAtlas() {
  if (!_worldCache) {
    _worldCache = await fetch(
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'
    ).then(r => r.json());
  }
  return _worldCache;
}

// ── Placeholder canvases (shown while async textures load) ───────────────────

export function buildPlaceholder() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#030c18';
  ctx.fillRect(0, 0, 2048, 1024);
  return c;
}

export function buildSpecularPlaceholder() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, 64, 32);
  return c;
}

export function buildBumpPlaceholder() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 64, 32);
  return c;
}

// ── Main color texture ────────────────────────────────────────────────────────
// Uses 50m-resolution geodata and a latitude gradient so polar ice, boreal
// forest, and equatorial jungle all read differently while keeping the base
// tactical-green tone.

export async function buildEarthTexture(landColor = '#41da17') {
  const W = 2048, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#030c18';
  ctx.fillRect(0, 0, W, H);

  try {
    const world    = await fetchWorldAtlas();
    const countries = topoFeature(world, world.objects.countries);

    // Latitude-based terrain gradient (y=0 → 90°N, y=H → 90°S in equirectangular)
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,    '#cce8f2'); // North Pole ice
    grad.addColorStop(0.09, '#8ccfa8'); // Arctic tundra
    grad.addColorStop(0.20, '#55c43c'); // Boreal / taiga
    grad.addColorStop(0.33, landColor); // Temperate (tactical green)
    grad.addColorStop(0.43, '#2dba18'); // Northern tropics
    grad.addColorStop(0.50, '#1ea00d'); // Equatorial dense canopy
    grad.addColorStop(0.57, '#2dba18'); // Southern tropics
    grad.addColorStop(0.67, landColor); // Southern temperate
    grad.addColorStop(0.80, '#55c43c'); // Sub-antarctic
    grad.addColorStop(0.91, '#8ccfa8'); // Antarctic fringe
    grad.addColorStop(1.0,  '#cce8f2'); // South Pole ice
    ctx.fillStyle = grad;

    // Thin coastline stroke for definition
    ctx.strokeStyle = 'rgba(0, 6, 18, 0.75)';
    ctx.lineWidth   = 0.7;
    drawGeoJSON(ctx, countries, W, H);

    // Antarctic south-pole strip (antimeridian artifact fix)
    ctx.fillStyle = '#cce8f2';
    ctx.fillRect(0, H - 32, W, 32);

    // Polar ice-cap gradient overlays
    const northIce = ctx.createLinearGradient(0, 0, 0, H * 0.09);
    northIce.addColorStop(0, 'rgba(215, 240, 255, 0.88)');
    northIce.addColorStop(1, 'rgba(215, 240, 255, 0)');
    ctx.fillStyle = northIce;
    ctx.fillRect(0, 0, W, H * 0.09);

    const southIce = ctx.createLinearGradient(0, H * 0.91, 0, H);
    southIce.addColorStop(0, 'rgba(215, 240, 255, 0)');
    southIce.addColorStop(1, 'rgba(215, 240, 255, 0.88)');
    ctx.fillStyle = southIce;
    ctx.fillRect(0, H * 0.91, W, H * 0.09);

  } catch (e) {
    console.warn('world-atlas fetch failed', e);
  }

  return c;
}

// ── Specular map ──────────────────────────────────────────────────────────────
// Ocean = bright (reflective), land = dark (matte), polar ice = semi-bright.
// Used as fallback if the three-globe water-mask CDN texture fails to load.

export async function buildSpecularMap() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#cccccc'; // ocean reflective
  ctx.fillRect(0, 0, W, H);

  try {
    const world    = await fetchWorldAtlas();
    const countries = topoFeature(world, world.objects.countries);

    ctx.fillStyle   = '#101010'; // land matte
    ctx.strokeStyle = '#101010';
    ctx.lineWidth   = 0;
    drawGeoJSON(ctx, countries, W, H);

    // Polar ice: semi-reflective overlay
    const ng = ctx.createLinearGradient(0, 0, 0, H * 0.11);
    ng.addColorStop(0, 'rgba(185,185,185,1)');
    ng.addColorStop(1, 'rgba(185,185,185,0)');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, W, H * 0.11);

    const sg = ctx.createLinearGradient(0, H * 0.89, 0, H);
    sg.addColorStop(0, 'rgba(185,185,185,0)');
    sg.addColorStop(1, 'rgba(185,185,185,1)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, H * 0.89, W, H * 0.11);

  } catch (e) {
    console.warn('specular map fetch failed', e);
  }

  return c;
}

// ── Cloud map ─────────────────────────────────────────────────────────────────
// Fallback for when the cloud composite can't be fetched. Earth's cloud cover is
// strongly banded by the Hadley/Ferrel circulation, so a flat noise field reads as
// wrong immediately. This weights fbm by latitude to reproduce the actual pattern:
// a dense ITCZ band on the equator, near-cloudless subtropical deserts around
// ±25°, mid-latitude storm tracks around ±55°, and hazy poles.

export function buildCloudMap() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  const img  = ctx.createImageData(W, H);
  const data = img.data;

  // Climatological cloud-cover fraction by |latitude|
  const bandAt = (lat) => {
    const a = Math.abs(lat);
    const itcz  = Math.exp(-((a - 2)  ** 2) / (2 * 7  ** 2)) * 0.95; // equatorial convection
    const storm = Math.exp(-((a - 55) ** 2) / (2 * 16 ** 2)) * 0.85; // mid-lat storm track
    const polar = Math.exp(-((a - 85) ** 2) / (2 * 14 ** 2)) * 0.55;
    return Math.min(1, 0.16 + itcz + storm + polar);
  };

  for (let py = 0; py < H; py++) {
    const lat  = (1 - py / H) * 180 - 90;
    const band = bandAt(lat);
    // Squeeze x-frequency toward the poles so cells stay round after the
    // equirectangular projection stretches them out.
    const conv = Math.max(0.2, Math.cos(lat * Math.PI / 180));
    for (let px = 0; px < W; px++) {
      const n = fbmCyclic(px / W, (py / H) * 9 / conv, 9 * conv);
      // Sharpen noise into discrete cloud masses rather than an even fog
      const v = Math.max(0, Math.min(1, (n * band * 2.15 - 0.42) * 1.9));
      const i = (py * W + px) * 4;
      // Density goes in ALPHA to match how real cloud composites are authored
      // (white pixels, alpha mask) — the shaders sample .a.
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(v * 255);
    }
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

// ── Bump map ──────────────────────────────────────────────────────────────────
// Procedural elevation: ocean = flat dark, land = fbm noise (60–220),
// polar caps = bright (glacial high). Used as fallback if CDN topology fails.

export async function buildBumpMap() {
  const W = 512, H = 256; // smaller canvas — per-pixel ops are still fast here
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  try {
    const world    = await fetchWorldAtlas();
    const countries = topoFeature(world, world.objects.countries);

    // White land mask
    ctx.fillStyle   = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 0;
    drawGeoJSON(ctx, countries, W, H);

    const imgData = ctx.getImageData(0, 0, W, H);
    const data    = imgData.data;

    for (let py = 0; py < H; py++) {
      const ny  = py / H;
      const lat = Math.abs((1 - ny) * 180 - 90);
      for (let px = 0; px < W; px++) {
        const i      = (py * W + px) * 4;
        const isLand = data[i] > 128;
        if (isLand) {
          const elev = fbm(px / W * 6, py / H * 6);
          let v = 60 + elev * 160; // 60–220
          // Polar ice adds height (glaciers / ice sheets)
          if (lat > 65) {
            const blend = Math.min(1, (lat - 65) / 15);
            v = v + (225 - v) * blend;
          }
          data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.round(v));
        } else {
          data[i] = data[i + 1] = data[i + 2] = 8; // ocean: near-flat
        }
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

  } catch (e) {
    console.warn('bump map build failed', e);
  }

  return c;
}
