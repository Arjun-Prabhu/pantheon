import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  buildPlaceholder, buildSpecularPlaceholder, buildBumpPlaceholder,
  buildEarthTexture, buildSpecularMap, buildBumpMap, buildCloudMap,
} from '../utils/geo';
import {NEWS} from "../data/news.js";
import {parseMinutes} from '../utils/time.js';

const LAND_COLOR = '#5a5a5a';

// sz: 0–1 relative size by land area (log-scaled). Controls zoom fade threshold:
// large countries stay visible when zoomed out; tiny ones only appear when zoomed in.
const COUNTRIES = [
  // ── North America ──────────────────────────────────────
  { name: 'Canada',           lat: 60,   lon: -96,  sz: 0.92 },
  { name: 'USA',              lat: 38,   lon: -97,  sz: 0.91 },
  { name: 'Mexico',           lat: 23,   lon: -102, sz: 0.68 },
  { name: 'Greenland',        lat: 72,   lon: -42,  sz: 0.70 },
  { name: 'Guatemala',        lat: 15,   lon: -90,  sz: 0.25 },
  { name: 'Belize',           lat: 17,   lon: -89,  sz: 0.14 },
  { name: 'Honduras',         lat: 15,   lon: -87,  sz: 0.25 },
  { name: 'El Salvador',      lat: 14,   lon: -89,  sz: 0.10 },
  { name: 'Nicaragua',        lat: 12,   lon: -85,  sz: 0.27 },
  { name: 'Costa Rica',       lat: 10,   lon: -84,  sz: 0.18 },
  { name: 'Panama',           lat: 9,    lon: -80,  sz: 0.20 },
  { name: 'Cuba',             lat: 22,   lon: -79,  sz: 0.28 },
  { name: 'Haiti',            lat: 19,   lon: -73,  sz: 0.12 },
  { name: 'Dominican Rep.',   lat: 19,   lon: -70,  sz: 0.18 },
  { name: 'Jamaica',          lat: 18,   lon: -78,  sz: 0.08 },
  // ── South America ──────────────────────────────────────
  { name: 'Venezuela',        lat: 8,    lon: -66,  sz: 0.56 },
  { name: 'Guyana',           lat: 5,    lon: -59,  sz: 0.34 },
  { name: 'Suriname',         lat: 4,    lon: -56,  sz: 0.30 },
  { name: 'Colombia',         lat: 4,    lon: -73,  sz: 0.59 },
  { name: 'Ecuador',          lat: -2,   lon: -77,  sz: 0.39 },
  { name: 'Peru',             lat: -10,  lon: -76,  sz: 0.62 },
  { name: 'Brazil',           lat: -10,  lon: -51,  sz: 0.90 },
  { name: 'Bolivia',          lat: -17,  lon: -65,  sz: 0.59 },
  { name: 'Paraguay',         lat: -23,  lon: -58,  sz: 0.44 },
  { name: 'Chile',            lat: -35,  lon: -71,  sz: 0.50 },
  { name: 'Argentina',        lat: -34,  lon: -64,  sz: 0.73 },
  { name: 'Uruguay',          lat: -33,  lon: -56,  sz: 0.32 },
  // ── Europe ─────────────────────────────────────────────
  { name: 'Iceland',          lat: 65,   lon: -18,  sz: 0.29 },
  { name: 'Ireland',          lat: 53,   lon: -8,   sz: 0.22 },
  { name: 'UK',               lat: 54,   lon: -3,   sz: 0.37 },
  { name: 'Portugal',         lat: 39,   lon: -8,   sz: 0.22 },
  { name: 'Spain',            lat: 40,   lon: -4,   sz: 0.47 },
  { name: 'France',           lat: 46,   lon: 2,    sz: 0.51 },
  { name: 'Belgium',          lat: 50,   lon: 4,    sz: 0.10 },
  { name: 'Netherlands',      lat: 52,   lon: 5,    sz: 0.10 },
  { name: 'Luxembourg',       lat: 50,   lon: 6,    sz: 0.05 },
  { name: 'Switzerland',      lat: 47,   lon: 8,    sz: 0.12 },
  { name: 'Germany',          lat: 51,   lon: 10,   sz: 0.44 },
  { name: 'Denmark',          lat: 56,   lon: 10,   sz: 0.16 },
  { name: 'Norway',           lat: 65,   lon: 13,   sz: 0.44 },
  { name: 'Sweden',           lat: 62,   lon: 16,   sz: 0.46 },
  { name: 'Finland',          lat: 64,   lon: 26,   sz: 0.42 },
  { name: 'Estonia',          lat: 59,   lon: 25,   sz: 0.12 },
  { name: 'Latvia',           lat: 57,   lon: 25,   sz: 0.18 },
  { name: 'Lithuania',        lat: 56,   lon: 24,   sz: 0.18 },
  { name: 'Poland',           lat: 52,   lon: 20,   sz: 0.44 },
  { name: 'Czech Rep.',       lat: 50,   lon: 15,   sz: 0.20 },
  { name: 'Slovakia',         lat: 48,   lon: 19,   sz: 0.15 },
  { name: 'Austria',          lat: 47,   lon: 13,   sz: 0.21 },
  { name: 'Hungary',          lat: 47,   lon: 19,   sz: 0.22 },
  { name: 'Slovenia',         lat: 46,   lon: 15,   sz: 0.09 },
  { name: 'Croatia',          lat: 45,   lon: 16,   sz: 0.15 },
  { name: 'Bosnia',           lat: 44,   lon: 17,   sz: 0.13 },
  { name: 'Serbia',           lat: 44,   lon: 21,   sz: 0.21 },
  { name: 'Montenegro',       lat: 43,   lon: 19,   sz: 0.06 },
  { name: 'Albania',          lat: 41,   lon: 20,   sz: 0.08 },
  { name: 'North Macedonia',  lat: 41,   lon: 22,   sz: 0.07 },
  { name: 'Kosovo',           lat: 42,   lon: 21,   sz: 0.05 },
  { name: 'Italy',            lat: 42,   lon: 12,   sz: 0.40 },
  { name: 'Malta',            lat: 36,   lon: 14,   sz: 0.03 },
  { name: 'Greece',           lat: 39,   lon: 22,   sz: 0.27 },
  { name: 'Cyprus',           lat: 35,   lon: 33,   sz: 0.06 },
  { name: 'Bulgaria',         lat: 43,   lon: 25,   sz: 0.25 },
  { name: 'Romania',          lat: 46,   lon: 25,   sz: 0.36 },
  { name: 'Moldova',          lat: 47,   lon: 29,   sz: 0.09 },
  { name: 'Ukraine',          lat: 49,   lon: 31,   sz: 0.50 },
  { name: 'Belarus',          lat: 53,   lon: 28,   sz: 0.34 },
  { name: 'Russia',           lat: 61,   lon: 105,  sz: 1.00 },
  { name: 'Georgia',          lat: 42,   lon: 43,   sz: 0.13 },
  { name: 'Armenia',          lat: 40,   lon: 45,   sz: 0.08 },
  { name: 'Azerbaijan',       lat: 40,   lon: 48,   sz: 0.21 },
  // ── Middle East ────────────────────────────────────────
  { name: 'Turkey',           lat: 39,   lon: 35,   sz: 0.54 },
  { name: 'Syria',            lat: 35,   lon: 38,   sz: 0.33 },
  { name: 'Lebanon',          lat: 34,   lon: 36,   sz: 0.07 },
  { name: 'Israel',           lat: 31,   lon: 35,   sz: 0.07 },
  { name: 'Palestine(de facto)',        lat: 32,   lon: 35,   sz: 0.04 },
  { name: 'Jordan',           lat: 31,   lon: 36,   sz: 0.22 },
  { name: 'Iraq',             lat: 33,   lon: 44,   sz: 0.46 },
  { name: 'Kuwait',           lat: 29,   lon: 48,   sz: 0.08 },
  { name: 'Saudi Arabia',     lat: 24,   lon: 45,   sz: 0.71 },
  { name: 'Bahrain',          lat: 26,   lon: 50,   sz: 0.03 },
  { name: 'Qatar',            lat: 25,   lon: 51,   sz: 0.07 },
  { name: 'UAE',              lat: 24,   lon: 54,   sz: 0.21 },
  { name: 'Oman',             lat: 22,   lon: 57,   sz: 0.47 },
  { name: 'Yemen',            lat: 15,   lon: 48,   sz: 0.48 },
  { name: 'Iran',             lat: 32,   lon: 53,   sz: 0.65 },
  // ── Africa ─────────────────────────────────────────────
  { name: 'Morocco',          lat: 32,   lon: -6,   sz: 0.46 },
  { name: 'Algeria',          lat: 28,   lon: 2,    sz: 0.71 },
  { name: 'Tunisia',          lat: 34,   lon: 9,    sz: 0.22 },
  { name: 'Libya',            lat: 25,   lon: 17,   sz: 0.68 },
  { name: 'Egypt',            lat: 27,   lon: 30,   sz: 0.58 },
  { name: 'Mauritania',       lat: 20,   lon: -11,  sz: 0.58 },
  { name: 'Mali',             lat: 17,   lon: -2,   sz: 0.60 },
  { name: 'Niger',            lat: 17,   lon: 8,    sz: 0.62 },
  { name: 'Chad',             lat: 15,   lon: 19,   sz: 0.62 },
  { name: 'Sudan',            lat: 15,   lon: 30,   sz: 0.68 },
  { name: 'Eritrea',          lat: 15,   lon: 39,   sz: 0.18 },
  { name: 'Djibouti',         lat: 12,   lon: 43,   sz: 0.08 },
  { name: 'Somalia',          lat: 6,    lon: 46,   sz: 0.51 },
  { name: 'Senegal',          lat: 14,   lon: -14,  sz: 0.34 },
  { name: 'Gambia',           lat: 13,   lon: -16,  sz: 0.05 },
  { name: 'Guinea-Bissau',    lat: 12,   lon: -15,  sz: 0.11 },
  { name: 'Guinea',           lat: 11,   lon: -11,  sz: 0.37 },
  { name: 'Sierra Leone',     lat: 8,    lon: -12,  sz: 0.19 },
  { name: 'Liberia',          lat: 6,    lon: -9,   sz: 0.25 },
  { name: 'Ivory Coast',      lat: 7,    lon: -6,   sz: 0.41 },
  { name: 'Ghana',            lat: 8,    lon: -1,   sz: 0.37 },
  { name: 'Burkina Faso',     lat: 12,   lon: -2,   sz: 0.38 },
  { name: 'Togo',             lat: 8,    lon: 1,    sz: 0.13 },
  { name: 'Benin',            lat: 10,   lon: 2,    sz: 0.25 },
  { name: 'Nigeria',          lat: 9,    lon: 8,    sz: 0.56 },
  { name: 'Cameroon',         lat: 6,    lon: 12,   sz: 0.47 },
  { name: 'Eq. Guinea',       lat: 2,    lon: 10,   sz: 0.11 },
  { name: 'Gabon',            lat: -1,   lon: 12,   sz: 0.38 },
  { name: 'Rep. Congo',       lat: -1,   lon: 15,   sz: 0.42 },
  { name: 'DR Congo',         lat: -4,   lon: 24,   sz: 0.70 },
  { name: 'Cent. Afr. Rep.',  lat: 7,    lon: 21,   sz: 0.51 },
  { name: 'South Sudan',      lat: 7,    lon: 30,   sz: 0.51 },
  { name: 'Ethiopia',         lat: 9,    lon: 40,   sz: 0.59 },
  { name: 'Uganda',           lat: 1,    lon: 32,   sz: 0.37 },
  { name: 'Rwanda',           lat: -2,   lon: 30,   sz: 0.08 },
  { name: 'Burundi',          lat: -3,   lon: 30,   sz: 0.09 },
  { name: 'Kenya',            lat: 1,    lon: 38,   sz: 0.50 },
  { name: 'Tanzania',         lat: -6,   lon: 35,   sz: 0.56 },
  { name: 'Angola',           lat: -12,  lon: 18,   sz: 0.60 },
  { name: 'Zambia',           lat: -14,  lon: 28,   sz: 0.54 },
  { name: 'Malawi',           lat: -13,  lon: 34,   sz: 0.22 },
  { name: 'Mozambique',       lat: -18,  lon: 35,   sz: 0.54 },
  { name: 'Zimbabwe',         lat: -19,  lon: 29,   sz: 0.44 },
  { name: 'Botswana',         lat: -22,  lon: 24,   sz: 0.50 },
  { name: 'Namibia',          lat: -22,  lon: 17,   sz: 0.55 },
  { name: 'South Africa',     lat: -29,  lon: 25,   sz: 0.60 },
  { name: 'Lesotho',          lat: -29,  lon: 28,   sz: 0.09 },
  { name: 'Eswatini',         lat: -26,  lon: 31,   sz: 0.06 },
  { name: 'Madagascar',       lat: -20,  lon: 47,   sz: 0.50 },
  // ── Central & South Asia ───────────────────────────────
  { name: 'Afghanistan',      lat: 33,   lon: 65,   sz: 0.51 },
  { name: 'Pakistan',         lat: 30,   lon: 69,   sz: 0.56 },
  { name: 'India',            lat: 20,   lon: 77,   sz: 0.76 },
  { name: 'Nepal',            lat: 28,   lon: 84,   sz: 0.29 },
  { name: 'Bhutan',           lat: 27,   lon: 90,   sz: 0.12 },
  { name: 'Bangladesh',       lat: 24,   lon: 90,   sz: 0.29 },
  { name: 'Sri Lanka',        lat: 8,    lon: 81,   sz: 0.16 },
  { name: 'Kazakhstan',       lat: 48,   lon: 68,   sz: 0.73 },
  { name: 'Uzbekistan',       lat: 41,   lon: 64,   sz: 0.46 },
  { name: 'Turkmenistan',     lat: 40,   lon: 59,   sz: 0.47 },
  { name: 'Tajikistan',       lat: 39,   lon: 71,   sz: 0.18 },
  { name: 'Kyrgyzstan',       lat: 41,   lon: 75,   sz: 0.20 },
  // ── East & Southeast Asia ──────────────────────────────
  { name: 'Mongolia',         lat: 46,   lon: 105,  sz: 0.65 },
  { name: 'China',            lat: 35,   lon: 103,  sz: 0.91 },
  { name: 'North Korea',      lat: 40,   lon: 127,  sz: 0.23 },
  { name: 'South Korea',      lat: 37,   lon: 127,  sz: 0.20 },
  { name: 'Japan',            lat: 36,   lon: 138,  sz: 0.43 },
  { name: 'Taiwan',           lat: 24,   lon: 121,  sz: 0.13 },
  { name: 'Myanmar',          lat: 17,   lon: 96,   sz: 0.52 },
  { name: 'Laos',             lat: 18,   lon: 103,  sz: 0.36 },
  { name: 'Thailand',         lat: 15,   lon: 101,  sz: 0.48 },
  { name: 'Vietnam',          lat: 16,   lon: 108,  sz: 0.43 },
  { name: 'Cambodia',         lat: 12,   lon: 105,  sz: 0.32 },
  { name: 'Malaysia',         lat: 4,    lon: 109,  sz: 0.43 },
  { name: 'Singapore',        lat: 1,    lon: 104,  sz: 0.04 },
  { name: 'Indonesia',        lat: -5,   lon: 120,  sz: 0.68 },
  { name: 'Timor-Leste',      lat: -9,   lon: 126,  sz: 0.08 },
  { name: 'Philippines',      lat: 13,   lon: 122,  sz: 0.40 },
  { name: 'Brunei',           lat: 5,    lon: 115,  sz: 0.07 },
  // ── Oceania ────────────────────────────────────────────
  { name: 'Papua New Guinea', lat: -6,   lon: 145,  sz: 0.46 },
  { name: 'Australia',        lat: -27,  lon: 133,  sz: 0.88 },
  { name: 'New Zealand',      lat: -41,  lon: 174,  sz: 0.38 },
  { name: 'Fiji',             lat: -18,  lon: 178,  sz: 0.08 },
];

// Sun's LOCAL position in earthGroup space for the current subsolar longitude.
// Sun lives as a child of earthGroup so the terminator is fixed to the geography —
// rotating the globe never moves the day/night line.
// ll3 mapping: lon=0→local+x, lon=90E→local-z, lon=90W→local+z
function getSunLocalPosition() {
  const now = new Date();
  const h   = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const lon = (12 - h) * 15; // subsolar longitude in degrees
  const lr  = lon * Math.PI / 180;
  return { x: 5 * Math.cos(lr), y: getSunY(), z: -5 * Math.sin(lr) };
}

// Sun Y offset accounting for current solar declination (±23.5° axial tilt)
function getSunY() {
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return Math.sin((2 * Math.PI / 365) * (doy - 81)) * 2.17; // 2.17 = 5*tan(23.45°)
}

// Small amber pip shown when a label is blocked by overlap at max zoom-in
function makePip(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 160; canvas.height = 24;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 9px B612, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 4;
  ctx.fillStyle = 'rgba(240, 240, 240, 0.95)';
  ctx.fillText('▾ ' + name, 80, 12); // ▾ + name
  return canvas;
}

function makeLabel(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 56;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 14px B612, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(220, 220, 220, 0.92)';
  ctx.fillText(name, 128, 28);
  return canvas;
}


function ll3(lat, lon, r = 1.015) {
  const phi = (90 - lat) * Math.PI / 180;
  const th  = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(th),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(th)
  );
}

// Ray-casting point-in-polygon over a [lon,lat] ring
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function pointInCountry(lon, lat, country) {
  return country.polys.some(p =>
    pointInRing(lon, lat, p.outer) && !p.holes.some(h => pointInRing(lon, lat, h)));
}

// ── Airspace altitude model ────────────────────────────────────────────────
// The airspace is a volume from the ground shell up to a ceiling, with altitude
// (in METERS) mapped linearly — but visually exaggerated — onto sphere radius so
// ADS-B tracks (lat, lon, alt) can be plotted directly inside the volume.
const R_GROUND   = 1.004;            // ground shell radius (just above wireframe overlay)
const AIR_CEIL_M = 14000;            // airspace ceiling altitude in meters (~FL460)
const AIR_THICK  = 0.06;            // ceiling radius offset (visual exaggeration)
const ALT_EXAGG  = AIR_THICK / AIR_CEIL_M;   // sphere-radius units per meter
const R_CEIL     = R_GROUND + AIR_THICK;

// (lat, lon, altitudeMeters) → world position in earthGroup space. Use this for
// every ADS-B point so traces sit at the correct altitude inside the volume.
function llaToVec3(lat, lon, altM = 0) {
  return ll3(lat, lon, R_GROUND + Math.max(0, altM) * ALT_EXAGG);
}

// Triangulate a country footprint onto a sphere shell of the given radius.
// Subdivides each triangle so the flat faces follow the curvature instead of
// chording through the globe. Returns a flat position array (or []).
function triangulateCountry(country, radius) {
  const mid = (a, b) => new THREE.Vector2((a.x + b.x) / 2, (a.y + b.y) / 2);
  const positions = [];
  const SUBDIV = 2;
  for (const poly of country.polys) {
    let lo = 180, hi = -180;
    for (const [x] of poly.outer) { if (x < lo) lo = x; if (x > hi) hi = x; }
    if (hi - lo > 180) continue; // skip antimeridian-spanning artifacts

    const contour = poly.outer.map(p => new THREE.Vector2(p[0], p[1]));
    const holes   = poly.holes.map(h => h.map(p => new THREE.Vector2(p[0], p[1])));
    let faces;
    try { faces = THREE.ShapeUtils.triangulateShape(contour, holes); }
    catch { continue; }
    const verts = contour.concat(...holes);
    for (const f of faces) {
      let tris = [[verts[f[0]], verts[f[1]], verts[f[2]]]];
      for (let s = 0; s < SUBDIV; s++) {
        const next = [];
        for (const [a, b, c] of tris) {
          const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
          next.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
        }
        tris = next;
      }
      for (const [a, b, c] of tris) for (const v of [a, b, c]) {
        const p = ll3(v.y, v.x, radius);
        positions.push(p.x, p.y, p.z);
      }
    }
  }
  return positions;
}

// Vertical wall quads extruded from the border rings between two radii.
function wallPositions(country, rFloor, rCeil) {
  const pos = [];
  for (const poly of country.polys) {
    for (const ring of [poly.outer, ...poly.holes]) {
      let lo = 180, hi = -180;
      for (const [x] of ring) { if (x < lo) lo = x; if (x > hi) hi = x; }
      if (hi - lo > 180) continue;
      for (let i = 0; i < ring.length; i++) {
        const A = ring[i], B = ring[(i + 1) % ring.length];
        const a0 = ll3(A[1], A[0], rFloor), a1 = ll3(A[1], A[0], rCeil);
        const b0 = ll3(B[1], B[0], rFloor), b1 = ll3(B[1], B[0], rCeil);
        pos.push(a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, b1.x, b1.y, b1.z);
        pos.push(a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, a1.x, a1.y, a1.z);
      }
    }
  }
  return pos;
}

function airMesh(positions, color, base) {
  if (!positions.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
  }));
  m.userData.air = { base };
  m.renderOrder = ORDER.airspace;
  return m;
}

function airRing(ring, radius, color, base) {
  let lo = 180, hi = -180;
  for (const [x] of ring) { if (x < lo) lo = x; if (x > hi) hi = x; }
  if (hi - lo > 180) return null;
  const pts = ring.map(([loN, laN]) => ll3(laN, loN, radius));
  const m = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }),
  );
  m.userData.air = { base };
  m.renderOrder = ORDER.airspace;
  return m;
}

// Build a country's airspace as a translucent extruded VOLUME: floor + ceiling
// fills, vertical walls, crisp border outlines top & bottom, and (for the target
// country) intermediate flight-level reference rings. The hollow, low-opacity
// interior is meant to be flown through by ADS-B tracks.
function buildCountryVolume(country, color, isHome) {
  const g = new THREE.Group();
  const dim = isHome ? 1 : 0.55;
  const add = (m) => { if (m) g.add(m); };

  add(airMesh(triangulateCountry(country, R_GROUND), color, 0.05 * dim)); // floor
  add(airMesh(triangulateCountry(country, R_CEIL),   color, 0.05 * dim)); // ceiling
  add(airMesh(wallPositions(country, R_GROUND, R_CEIL), color, (isHome ? 0.10 : 0.05))); // walls

  for (const poly of country.polys) {
    for (const ring of [poly.outer, ...poly.holes]) {
      add(airRing(ring, R_GROUND, color, isHome ? 0.7 : 0.32)); // ground border
      add(airRing(ring, R_CEIL,   color, isHome ? 0.5 : 0.24)); // ceiling border
    }
  }

  if (isHome) { // intermediate flight-level reference rings on the outer boundary
    const BANDS = 3;
    for (let b = 1; b <= BANDS; b++) {
      const r = R_GROUND + (R_CEIL - R_GROUND) * b / (BANDS + 1);
      for (const poly of country.polys) add(airRing(poly.outer, r, color, 0.16));
    }
  }
  return g;
}

// renderOrder is per-object and is ignored on Groups, so push it to every
// descendant that actually gets drawn.
function setOrder(root, order) {
  root.traverse(o => { if (o.isMesh || o.isLine || o.isPoints || o.isSprite) o.renderOrder = order; });
}

function levelColor(importance) {
  if (importance >= 9) return 0xff2244;
  if (importance >= 7) return 0xff7020;
  if (importance >= 5) return 0xf5bc00;
  return 0x29b6f6;
}

const AFFIL_HEX = {
  Friendly: 0x2b8fff,
  Hostile:  0xff2244,
  Neutral:  0xf5bc00,
  Unknown:  0x9b6dff,
};

const PRED_COLOR = 0xd9d9d9;

// ── Draw order for the concentric transparent shells ────────────────────────
// Every layer below is a mesh centered on the earth's origin, so three's painter
// sort computes the SAME projected depth for all of them and falls through to its
// last tiebreaker: scene-insertion order. That is why country borders went grey —
// the land fill is appended inside the country-data .then(), landing after the
// border lines in earthGroup.children and painting over them. Pinning explicit
// render orders to physical radius makes the stack deterministic.
// Camera distance at which each tile zoom level starts. Also the reference for
// the coarsening hysteresis, so the two can never drift apart.
const ZOOM_EDGE = { 13: 1.008, 12: 1.016, 11: 1.032, 10: 1.06, 9: 1.13, 8: 1.28, 7: 1.5, 6: Infinity };

const ORDER = {
  atmosphere: -100,
  tileBase:    -50,   // + zoom level, preserving cross-zoom ordering
  grid:          0,
  wfOcean:       1,   // 1.003
  landFill:      2,   // 1.0038
  borders:       3,   // 1.005
  clouds:        4,   // 1.007
  airspace:      5,   // 1.004 – 1.064
  adsb:          6,
  markers:       7,   // 1.012
  labels:       10,   // 1.07
  pips:         11,   // 1.09
};

// ── Planet shading ──────────────────────────────────────────────────────────
// The globe used MeshPhongMaterial: one Blinn lobe over a flat ambient term,
// uniform across land and sea. That is precisely the response of moulded
// plastic, which is why it read as a toy. These shaders replace it with the
// cues the eye actually uses to identify a photographed planet — a specular
// lobe that only fires on water, a terminator softened and reddened by
// atmospheric scattering, relief-shaded land, clouds that shadow the ground,
// city lights confined to the night side, and a limb that glows blue.
//
// Tone mapping is applied per-surface rather than on the renderer, so the
// planet gets a photographic highlight rolloff while the UI marker colors
// (which carry meaning: affiliation, importance) pass through untouched.

const GLSL_COMMON = /* glsl */`
  const float PI = 3.141592653589793;

  vec3 filmic(vec3 x) {                       // Narkowicz ACES fit
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }
  // Surface curve: the ACES fit's toe roughly halves everything under ~0.05
  // linear — which is the entire ocean in the Blue Marble — crushing it to
  // near-black and stripping its blue. Stay linear through the shadows and only
  // hand over to the filmic shoulder in the mids and highlights.
  vec3 surfaceTone(vec3 x) {
    x = max(x, vec3(0.0));
    return mix(x, filmic(x), smoothstep(0.0, 0.35, x));
  }
  vec3 toSRGB(vec3 c) {
    c = max(c, vec3(0.0));
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  }
  // Night-side fill. Physically the unlit face is near-black, but zoomed in
  // that leaves the dark side as a featureless void — this is roughly a
  // moonlit exposure, cool and dim, so terrain stays legible under the city
  // lights. Shared by the planet and the close-up tiles so they match.
  const vec3 MOONLIGHT = vec3(0.062, 0.068, 0.088);
  float nightSide(float NdL) { return 1.0 - smoothstep(-0.10, 0.10, NdL); }
  // East/north tangent frame matching three's equirectangular sphere UVs.
  // Lets the shader step across the texture in real angular units.
  void tangentFrame(vec3 n, out vec3 e, out vec3 nr) {
    e = cross(vec3(0.0, 1.0, 0.0), n);
    float l = length(e);
    e  = l > 1e-4 ? e / l : vec3(1.0, 0.0, 0.0);
    nr = cross(n, e);
  }
`;

const SPHERE_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNrm;
  varying vec3 vPos;
  void main() {
    vUv  = uv;
    vNrm = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const EARTH_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uDay, uNight, uWater, uTopo, uCloud;
  uniform vec3  uSunDir, uCamPos;
  uniform vec2  uCloudOff;
  uniform float uCloudAmt, uCloudGain, uNightAmt, uBump, uExposure;
  varying vec2 vUv;
  varying vec3 vNrm;
  varying vec3 vPos;
${GLSL_COMMON}
  void main() {
    vec3 N = normalize(vNrm);
    vec3 V = normalize(uCamPos - vPos);
    vec3 L = normalize(uSunDir);
    vec3 east, north;
    tangentFrame(N, east, north);

    float water = texture2D(uWater, vUv).r;

    // Relief: central-difference the topography map into a normal perturbation.
    // Land only — bumped ocean would sparkle against the specular lobe below.
    float d  = 0.0016;
    float hx = texture2D(uTopo, vUv + vec2(d, 0.0)).r - texture2D(uTopo, vUv - vec2(d, 0.0)).r;
    float hy = texture2D(uTopo, vUv + vec2(0.0, d)).r - texture2D(uTopo, vUv - vec2(0.0, d)).r;
    vec3  Nb = normalize(N - (east * hx + north * hy) * uBump * (1.0 - water));

    float NdL  = dot(N,  L);
    float NdLb = dot(Nb, L);
    float NdV  = clamp(dot(N, V), 0.0, 1.0);

    // Cloud shadow: walk toward the sun by deckHeight / tan(elevation), converting
    // radians into equirectangular UV (u compresses toward the poles).
    float cosLat   = max(sqrt(max(1.0 - N.y * N.y, 0.0)), 0.08);
    vec2  uvPerRad = vec2(1.0 / (2.0 * PI * cosLat), 1.0 / PI);
    vec2  sunT     = vec2(dot(L, east), dot(L, north));
    vec2  shOff    = clamp(sunT * uvPerRad * (0.011 / max(NdL, 0.22)), vec2(-0.03), vec2(0.03));
    // Cloud density lives in the map's ALPHA channel — the composite is white
    // pixels masked by alpha, and its RGB is a dithered palette that reads as
    // hard speckle if sampled directly.
    float cover    = min(texture2D(uCloud, vUv + uCloudOff).a * uCloudGain, 1.0) * uCloudAmt;
    float shadow   = min(texture2D(uCloud, vUv + uCloudOff + shOff).a * uCloudGain, 1.0) * uCloudAmt;

    // Sunlight reddens as it grazes. This is what makes the terminator read as a
    // lit atmosphere instead of a hard painted line.
    vec3 sunCol = mix(vec3(1.20, 0.58, 0.28), vec3(1.0, 0.97, 0.92), smoothstep(0.0, 0.17, NdL));

    vec3 albedo = texture2D(uDay, vUv).rgb;
    // ── Continental shelf ───────────────────────────────────────────────────
    // The source imagery paints shelf water a vivid turquoise that reads as a
    // wide neon halo around every landmass. Shelf is identified as bright water,
    // and its vibrance is held back except within a band of the shoreline —
    // proximity measured by ring-sampling the land/water mask at a fixed angular
    // radius, so the band stays an even width at every latitude.
    float coast = 0.0;
    for (int k = 0; k < 6; k++) {
      float ang = float(k) * 1.0471976;                   // 6 taps, 60° apart
      vec2  off = vec2(cos(ang), sin(ang)) * uvPerRad * 0.010;
      coast = max(coast, 1.0 - texture2D(uWater, vUv + off).r);
    }
    float lum   = dot(albedo, vec3(0.299, 0.587, 0.114));
    float shelf = water * smoothstep(0.085, 0.26, lum) * (1.0 - coast);

    albedo = mix(albedo, albedo * vec3(0.50, 0.80, 1.35), water * 0.40 * (1.0 - shelf));
    // Off-shore shelf: pull toward a muted deep tone instead of the neon cyan
    vec3 sunk = mix(albedo, vec3(lum) * vec3(0.46, 0.66, 0.96), 0.72) * 0.70;
    albedo = mix(albedo, sunk, shelf * 0.85);

    // Wrapped diffuse — a little light bleeds past the geometric terminator.
    float wrap    = clamp((NdLb + 0.09) / 1.09, 0.0, 1.0);
    vec3  diffuse = albedo * sunCol * wrap * (1.0 - 0.34 * shadow);

    // GGX glint. Water is near-mirror, roughened by waves; land barely responds.
    // The moving sun-glint is the single strongest "this is a real sphere" cue.
    vec3  H   = normalize(L + V);
    float NdH = clamp(dot(Nb, H), 0.0, 1.0);
    float VdH = clamp(dot(V, H), 0.0, 1.0);
    float rgh = mix(0.80, 0.26, water);
    float a2  = pow(rgh, 4.0);
    float dn  = NdH * NdH * (a2 - 1.0) + 1.0;
    float D   = a2 / (PI * dn * dn + 1e-7);
    float F   = 0.02 + 0.98 * pow(1.0 - VdH, 5.0);
    float k   = rgh * rgh * 0.5;
    float lit = clamp(NdLb, 0.0, 1.0);
    float G   = (NdV / (NdV * (1.0 - k) + k)) * (lit / (lit * (1.0 - k) + k));
    vec3  spec = sunCol * (D * F * G) * mix(0.08, 1.0, water) * (1.0 - shadow * 0.85);

    // Rayleigh: blue haze thickens toward the limb, plus skylight over lit ground.
    // Rim carries around onto the unlit limb so the edge stays described there
    float fres = pow(1.0 - NdV, 5.0);
    vec3  rim  = vec3(0.24, 0.44, 1.0) * fres * (0.08 + 0.92 * smoothstep(-0.70, 0.30, NdL)) * 0.55;
    vec3  sky  = albedo * vec3(0.05, 0.08, 0.14) * wrap;
    // Rayleigh in-scatter over the whole lit disc, not just the limb. This is
    // what makes the ocean read blue from orbit — the Blue Marble ocean is a
    // near-black navy (~0.02 linear), so lighting it alone leaves it black.
    // Path length grows toward the limb; land gets the same faint haze.
    vec3  haze = vec3(0.016, 0.040, 0.095) * wrap * (0.75 + 0.5 * (1.0 - NdV)) * mix(0.30, 1.0, water);

    // City lights: night side only, occluded by cloud, warm sodium cast, dense
    // cores pushed harder so metros separate from sprawl.
    vec3  nite = texture2D(uNight, vUv).rgb;
    float nlum = dot(nite, vec3(0.299, 0.587, 0.114));
    vec3  city = nite * vec3(1.30, 0.88, 0.48) * (0.45 + 1.7 * nlum * nlum)
               * (1.0 - smoothstep(-0.08, 0.12, NdL)) * (1.0 - cover * 0.75) * uNightAmt;

    // Earthshine only just off zero. The unlit face no longer needs lifting to
    // stay visible: the black ring that used to appear around it came from the
    // halo's alpha, not from the surface being dark, and the atmosphere now
    // describes the limb on its own. Keeping this low lets the city lights carry
    // the night side.
    vec3 col = diffuse + sky + haze + spec + rim + city
             + albedo * mix(vec3(0.010, 0.013, 0.022), MOONLIGHT, nightSide(NdL))
             + vec3(0.0035, 0.0050, 0.0090) * (1.0 - wrap);
    gl_FragColor = vec4(toSRGB(surfaceTone(col * uExposure)), 1.0);
  }
`;

// Back-face shell around the planet. -dot(N,V) grows from 0 at the shell's own
// silhouette toward the planet's limb, so the glow hugs the horizon and falls
// off into space without needing any screen-space math.
const ATMO_FRAG = /* glsl */`
  precision highp float;
  uniform vec3  uSunDir, uCamPos;
  uniform float uOpacity, uExposure;
  varying vec2 vUv;
  varying vec3 vNrm;
  varying vec3 vPos;
${GLSL_COMMON}
  void main() {
    vec3 N = normalize(vNrm);
    vec3 V = normalize(uCamPos - vPos);
    vec3 L = normalize(uSunDir);
    float NdL = dot(N, L);

    float band = pow(clamp(-dot(N, V), 0.0, 1.0), 3.2) * 3.4;
    // Wide falloff so the limb glow wraps continuously around the night side and
    // dims into space, instead of cutting off at the terminator and leaving the
    // planet's dark edge reading as a hole punched in the background.
    float sun  = smoothstep(-0.85, 0.40, NdL);
    float fwd  = pow(clamp(dot(-V, L), 0.0, 1.0), 3.0);  // forward scattering toward the sun

    // Blue everywhere except a narrow warm arc riding the terminator, where the
    // sightline through the atmosphere is long enough to redden.
    float term = smoothstep(0.45, 0.0, abs(NdL));
    vec3  col  = mix(vec3(0.32, 0.56, 1.0), vec3(1.0, 0.45, 0.16), term * 0.75);
    // Night floor keeps a faint cold rim all the way round the dark limb.
    // Kept low — lifted much past this it stops reading as atmosphere and
    // becomes a grey fog ring sitting on the background.
    float i    = band * (0.030 + 0.97 * sun) * (1.0 + 0.35 * fwd) * uOpacity;

    // The canvas is alpha:true, and AdditiveBlending uses blendDstAlpha = One —
    // so emitting alpha 1.0 turned this whole shell opaque, including the night
    // side where it contributes no color, punching an opaque black ring through
    // the page background. Carry the glow's own strength in alpha instead and
    // un-premultiply the color, which leaves the additive RGB result identical.
    vec3  rgb = toSRGB(filmic(col * i * uExposure));
    float a   = clamp(max(rgb.r, max(rgb.g, rgb.b)), 0.0, 1.0);
    gl_FragColor = vec4(a > 0.0 ? rgb / a : rgb, a);
  }
`;

// Close-up satellite tiles. Same diffuse + skylight + earthshine terms and the
// same filmic curve as the planet surface, so tiles fading in over the base map
// land at matching brightness instead of blowing out.
const TILE_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uMap;
  uniform vec3  uSunDir;
  uniform float uOpacity, uExposure;
  varying vec2 vUv;
  varying vec3 vNrm;
  varying vec3 vPos;
${GLSL_COMMON}
  void main() {
    vec3  N   = normalize(vNrm);
    float NdL = dot(N, normalize(uSunDir));
    vec3  sunCol = mix(vec3(1.30, 0.50, 0.18), vec3(1.0, 0.97, 0.92), smoothstep(0.0, 0.32, NdL));
    float wrap   = clamp((NdL + 0.09) / 1.09, 0.0, 1.0);
    vec3  albedo = texture2D(uMap, vUv).rgb;
    vec3  amb = mix(vec3(0.014, 0.018, 0.030), MOONLIGHT, nightSide(NdL));
    vec3  col = albedo * (sunCol * wrap + vec3(0.05, 0.075, 0.13) * wrap + amb);
    gl_FragColor = vec4(toSRGB(surfaceTone(col * uExposure)), uOpacity);
  }
`;

// Starfield. PointsMaterial draws every star as an identically-sized hard-edged
// square, which is what makes it read as scattered dots rather than a sky. These
// give each star its own magnitude, radius and scintillation phase, and a soft
// radial profile — a tight core inside a faint halo, the way a point source
// actually lands on a sensor.
const STAR_VERT = /* glsl */`
  attribute vec3  aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime, uPixelRatio;
  varying vec3  vCol;
  varying float vMag;
  void main() {
    float tw = 0.80 + 0.20 * sin(uTime * 1.6 + aPhase);
    vCol = aColor;
    vMag = tw;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.92 + 0.08 * tw);
  }
`;

const STAR_FRAG = /* glsl */`
  precision highp float;
  varying vec3  vCol;
  varying float vMag;
  void main() {
    float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (r > 1.0) discard;
    float f = 1.0 - r;
    // Falloff kept gentle: at 2-3 px across, a steep core lands mostly on the
    // faint tail of the profile and the star vanishes entirely.
    float i = (pow(f, 3.5) + 0.45 * pow(f, 1.4)) * vMag;
    // Intensity goes in alpha, not 1.0 — see the note in ATMO_FRAG. Additive
    // blending multiplies rgb by alpha, so this yields the same vCol * i while
    // leaving the transparent canvas transparent between and around stars.
    gl_FragColor = vec4(vCol, clamp(i, 0.0, 1.0));
  }
`;

// Night-lights tiles (NASA VIIRS via GIBS), drawn additively over the day tile.
// Zoomed in past the terminator the day imagery is shaded almost to black, so
// without this the dark side just goes empty as you approach it.
const NIGHT_TILE_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uMap;
  uniform vec3  uSunDir;
  uniform float uOpacity, uExposure;
  varying vec2 vUv;
  varying vec3 vNrm;
  varying vec3 vPos;
${GLSL_COMMON}
  void main() {
    float NdL   = dot(normalize(vNrm), normalize(uSunDir));
    float night = 1.0 - smoothstep(-0.14, 0.16, NdL);
    if (night <= 0.002 || uOpacity <= 0.002) discard;

    vec3  lights = texture2D(uMap, vUv).rgb;
    float lum    = dot(lights, vec3(0.299, 0.587, 0.114));
    vec3  rgb    = toSRGB(surfaceTone(lights * vec3(1.28, 0.90, 0.55)
                                 * (0.55 + 1.5 * lum) * uExposure));
    // Additive blending multiplies rgb by alpha, so carry the strength in alpha
    // and un-premultiply — same reasoning as ATMO_FRAG.
    float m = max(rgb.r, max(rgb.g, rgb.b));
    float a = clamp(m * night * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(m > 0.0 ? rgb / m : rgb, a);
  }
`;

const CLOUD_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uCloud;
  uniform vec3  uSunDir, uCamPos;
  uniform vec2  uCloudOff;
  uniform float uOpacity, uExposure, uCloudGain;
  varying vec2 vUv;
  varying vec3 vNrm;
  varying vec3 vPos;
${GLSL_COMMON}
  void main() {
    // Density is in alpha, gained to match the source composite's distribution
    float c = min(texture2D(uCloud, vUv + uCloudOff).a * uCloudGain, 1.0);
    if (c <= 0.002 || uOpacity <= 0.002) discard;

    vec3 N = normalize(vNrm);
    vec3 V = normalize(uCamPos - vPos);
    vec3 L = normalize(uSunDir);
    float NdL = dot(N, L);
    float lit = smoothstep(-0.24, 0.16, NdL);

    // Sunlit tops, blue shadow on the unlit side, warm rim through the terminator
    vec3 col = mix(vec3(0.04, 0.06, 0.11), vec3(1.02, 1.00, 0.98), lit);
    col = mix(col, vec3(1.25, 0.58, 0.28), smoothstep(0.34, 0.0, abs(NdL)) * 0.6);

    float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0); // edge-on cloud is thicker
    float a   = clamp(c * (0.10 + 0.90 * lit) * (1.0 + 0.55 * rim), 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(toSRGB(filmic(col * uExposure)), a);
  }
`;

// Auto-spin and dragging let rotY wind up without bound, so a freshly computed
// target can sit many full turns away. Pick the equivalent angle nearest the
// current one so the globe takes the short way round.
const nearestTurn = (target, current) =>
  target + 2 * Math.PI * Math.round((current - target) / (2 * Math.PI));

export default function Globe({ news, pois = [], predictions = [], activeRegion, activeCoords, activePrediction, activePoi, adsbTracks = [], onRegionSelect, onPoiSelect, layersRef, scrubberRef }) {
  const wrapRef   = useRef();
  const canvasRef = useRef();
  const onSelectRef = useRef(onRegionSelect);
  useEffect(() => { onSelectRef.current = onRegionSelect; }, [onRegionSelect]);
  const onPoiSelectRef = useRef(onPoiSelect);
  useEffect(() => { onPoiSelectRef.current = onPoiSelect; }, [onPoiSelect]);

  // Wireframe mode — ref drives animation loop, state drives button appearance
  const [isWireframe, setIsWireframe] = useState(false);
  const wireRef    = useRef(false);
  const wfProgress = useRef(0);

  const T = useRef({
    targetRotY: 0.3, targetRotX: 0,
    curRotY: 0.3,    curRotX: 0,
    targetZ: 3,      curZ: 0.1,
    targetTilt: 0,   curTilt: 0,       // 0 = top-down, π/2 = horizon
    targetAzimuth: 0, curAzimuth: 0,   // camera orbit angle in xy-plane
    targetFov: 42,   curFov: 42,       // perspective FOV; wider in 3D mode for depth
    airTarget: 0,    airOpacity: 0,    // POI airspace fade (0 hidden, 1 shown)
    airFillGroup: null,                // THREE.Group of country airspace volumes
    adsbGroup: null,                   // THREE.Group of ADS-B track polylines
    countriesGeo: null,                // decoded country polygons (lon/lat) for fills
    poiMode: false,                    // when true, drag orbits the POI not the globe
    // Pan: offset applied to both camera position and lookAt target
    targetPanX: 0, targetPanY: 0, targetPanZ: 0,
    curPanX: 0,    curPanY: 0,    curPanZ: 0,
    // Camera basis vectors (updated each frame, read by pan handler)
    camDist: 3,
    camRX: 1, camRY: 0, camRZ: 0,
    camUX: 0, camUY: 1, camUZ: 0,
    autoSpin: true,
    isDragging: false,      dragMoved: false, prevX: 0,  prevY: 0,
    isPanDrag: false,
    isDraggingMiddle: false,            prevXM: 0, prevYM: 0,
    isDraggingRight: false,             prevXR: 0, prevYR: 0,
  });

  // ── Three.js init ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    const t      = T.current;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 3;

    // The sun is no longer a light source in the classic sense — the planet,
    // clouds, tiles, and halo all shade themselves from uSunDir. It stays a
    // DirectionalLight because it is the single authority on where the sun is:
    // parented to earthGroup below, its world position tracks the globe's
    // rotation, which is what pins the terminator to the geography.
    const sun = new THREE.DirectionalLight(0xfff5e0, 2.4);
    const sp = getSunLocalPosition();
    sun.position.set(sp.x, sp.y, sp.z);

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroup.add(sun); // sun co-rotates with earth — terminator stays fixed on geography

    // ── Starfield — parented to earthGroup so it rotates with the planet ──
    // A real sky is mostly faint dust with a few bright anchors, so magnitudes
    // follow a steep power law and drive both brightness and radius. Spectral
    // spread runs blue-white → amber.
    const starN   = 3200;
    const starPos = new Float32Array(starN * 3);
    const starCol = new Float32Array(starN * 3);
    const starSz  = new Float32Array(starN);
    const starPh  = new Float32Array(starN);
    for (let i = 0; i < starN; i++) {
      const u = Math.random(), v = Math.random();
      const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1), r = 80;
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);

      const mag = Math.pow(Math.random(), 2.6);          // 0 = faint, 1 = brilliant
      const b   = 0.30 + 0.70 * mag;
      const w   = Math.random();
      starCol[i * 3]     = b * (0.74 + 0.26 * w);
      starCol[i * 3 + 1] = b * (0.84 + 0.06 * w);
      starCol[i * 3 + 2] = b * (1.00 - 0.26 * w);
      starSz[i] = 2.4 + 4.0 * mag;
      starPh[i] = Math.random() * Math.PI * 2;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    starGeo.setAttribute('aColor',   new THREE.Float32BufferAttribute(starCol, 3));
    starGeo.setAttribute('aSize',    new THREE.Float32BufferAttribute(starSz,  1));
    starGeo.setAttribute('aPhase',   new THREE.Float32BufferAttribute(starPh,  1));
    const starUniforms = {
      uTime:       { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
    };
    const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({
      uniforms: starUniforms, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    stars.renderOrder = ORDER.atmosphere - 1;
    earthGroup.add(stars);

    // ── Earth mesh ────────────────────────────────────────
    const loader   = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // Equirect maps need RepeatWrapping so the shader's cloud-shadow and drift
    // offsets stay continuous across the antimeridian seam. Anisotropy keeps the
    // surface sharp at the grazing angles that dominate near the limb.
    const prepMap = (tex, srgb = false) => {
      tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.wrapS      = THREE.RepeatWrapping;
      tex.anisotropy = maxAniso;
      tex.needsUpdate = true;
      return tex;
    };

    const earthTex = prepMap(new THREE.CanvasTexture(buildPlaceholder()), true);
    const specTex  = prepMap(new THREE.CanvasTexture(buildSpecularPlaceholder()));
    const bumpTex  = prepMap(new THREE.CanvasTexture(buildBumpPlaceholder()));
    // 1×1 transparent black stands in until the night / cloud maps arrive: reads
    // as zero through both .rgb (no city lights) and .a (no cloud), so the shader
    // degrades to a clear-sky daylit planet rather than a fully overcast one.
    const blackTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    blackTex.needsUpdate = true;

    // Uniforms shared across the earth, cloud, and atmosphere materials so all
    // three agree on where the sun is and how far the cloud deck has drifted.
    const uSunDir   = { value: new THREE.Vector3(1, 0, 0) };
    const uCamPos   = { value: new THREE.Vector3() };
    const uCloudOff = { value: new THREE.Vector2(0, 0) };
    const uCloudTex = { value: blackTex };
    const uExposure = { value: 1.25 };
    // Gain onto the cloud alpha. The NASA composite is a thin-cover day (mean
    // alpha ≈ 0.15), so it needs lifting; the procedural fallback is authored at
    // full range and does not. Shared so cloud and cloud-shadow always agree.
    const uCloudGain = { value: 1.0 };

    const earthUniforms = {
      uDay: { value: earthTex }, uNight: { value: blackTex },
      uWater: { value: specTex }, uTopo: { value: bumpTex },
      uCloud: uCloudTex, uCloudOff, uSunDir, uCamPos, uExposure, uCloudGain,
      uCloudAmt: { value: 0 },
      uNightAmt: { value: 1.0 },
      uBump:     { value: 2.6 },
    };
    const earthMat = new THREE.ShaderMaterial({
      uniforms: earthUniforms, vertexShader: SPHERE_VERT, fragmentShader: EARTH_FRAG,
    });
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 256, 256), earthMat);
    earthGroup.add(earthMesh);

    // ── Atmosphere halo ──────────────────────────────────
    // Back-face shell: the earth's own depth clips it to the annulus outside the
    // silhouette, so only the limb glow survives. Additive, no depth write, drawn
    // ahead of every other transparent object so markers and labels sit on top.
    const atmoUniforms = { uSunDir, uCamPos, uExposure, uOpacity: { value: 1 } };
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.13, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: atmoUniforms, vertexShader: SPHERE_VERT, fragmentShader: ATMO_FRAG,
        side: THREE.BackSide, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    atmosphere.renderOrder = ORDER.atmosphere;
    earthGroup.add(atmosphere);

    // ── Texture loading ───────────────────────────────────

    // Satellite base map. This used to lead with a direct NASA eoimages.gsfc URL,
    // but that host sends no Access-Control-Allow-Origin, so it could never load
    // in a browser — every session silently fell through to earth-day.jpg, which
    // is only 1600 × 800 and was a large part of why the surface looked soft.
    // Leading with the CORS-clean 4096 × 2048 Blue Marble instead.
    const satChain = [
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      'https://unpkg.com/three-globe/example/img/earth-day.jpg',
    ];
    const loadSat = (i) => {
      if (i >= satChain.length) {
        buildEarthTexture(LAND_COLOR).then(c => { earthTex.image = c; earthTex.needsUpdate = true; });
        return;
      }
      loader.load(satChain[i],
        tex => { earthUniforms.uDay.value = prepMap(tex, true); },
        undefined,
        () => loadSat(i + 1)
      );
    };
    loadSat(0);

    // City lights (NASA Black Marble). Fed to the shader rather than used as an
    // emissiveMap — Phong adds emissive uniformly, which lit up cities in broad
    // daylight and flattened the day side. Here they exist only past the terminator.
    loader.load('https://unpkg.com/three-globe/example/img/earth-night.jpg', tex => {
      earthUniforms.uNight.value = prepMap(tex, true);
    });

    // Water mask (drives ocean roughness + glint): three-globe CDN → procedural
    loader.load(
      'https://unpkg.com/three-globe@2/example/img/earth-water.png',
      tex => { earthUniforms.uWater.value = prepMap(tex); },
      undefined,
      () => buildSpecularMap().then(c => { specTex.image = c; specTex.needsUpdate = true; })
    );

    // Bump/elevation map: three-globe CDN → procedural
    loader.load(
      'https://unpkg.com/three-globe@2/example/img/earth-topology.png',
      tex => { earthUniforms.uTopo.value = prepMap(tex); },
      undefined,
      () => buildBumpMap().then(c => { bumpTex.image = c; bumpTex.needsUpdate = true; })
    );

    // Grid lines (hidden by default; color/opacity driven by wireframe transition)
    const gridMat = new THREE.LineBasicMaterial({ color: 0x5a5a5a, transparent: true, opacity: 0, depthWrite: false });
    const addLat = (lat) => {
      const pts = [];
      for (let lo = 0; lo <= 360; lo += 3) {
        const phi = (90 - lat) * Math.PI / 180, th = (lo + 180) * Math.PI / 180;
        pts.push(new THREE.Vector3(-1.003 * Math.sin(phi) * Math.cos(th), 1.003 * Math.cos(phi), 1.003 * Math.sin(phi) * Math.sin(th)));
      }
      const gl = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat);
      gl.renderOrder = ORDER.grid;
      earthGroup.add(gl);
    };
    const addLon = (lon) => {
      const pts = [];
      for (let la = -90; la <= 90; la += 3) {
        const phi = (90 - la) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
        pts.push(new THREE.Vector3(-1.003 * Math.sin(phi) * Math.cos(th), 1.003 * Math.cos(phi), 1.003 * Math.sin(phi) * Math.sin(th)));
      }
      const gl = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat);
      gl.renderOrder = ORDER.grid;
      earthGroup.add(gl);
    };
    for (let la = -60; la <= 60; la += 30) addLat(la);
    for (let lo = 0; lo < 360; lo += 30)  addLon(lo);

    // Wireframe overlay: sphere fades in to mask satellite texture. Tinted a deep
    // cool teal so it reads as OCEAN in wireframe mode (land is filled separately).
    const wfOverlay = new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x141414, transparent: true, opacity: 0, depthWrite: false })
    );
    wfOverlay.renderOrder = ORDER.wfOcean;
    earthGroup.add(wfOverlay);

    // Land fill — all country footprints in a dark warm tone, drawn over the ocean
    // overlay so land/sea separate in wireframe. Geometry filled once data loads.
    const landFillMat = new THREE.MeshBasicMaterial({
      color: 0x1c1c1c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
    });
    let landMesh = null;

    // Color constants for wireframe transition interpolation
    const realisticGridColor = new THREE.Color(0x5a5a5a);
    const wireframeGridColor = new THREE.Color(0xbdbdbd);

    // Country border lines — decoded from Natural Earth TopoJSON, shown in wireframe mode
    const countryLinesGroup = new THREE.Group();
    earthGroup.add(countryLinesGroup);
    const wfBorderMat = new THREE.LineBasicMaterial({
      color: 0xd9d9d9, transparent: true, opacity: 0, depthWrite: false,
    });

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topo => {
        const { scale, translate } = topo.transform;
        const topoArcs = topo.arcs;

        // Decode a TopoJSON arc (handles negative = reversed index)
        const decodeArc = (idx) => {
          const raw = topoArcs[idx < 0 ? ~idx : idx];
          let x = 0, y = 0;
          const pts = raw.map(d => {
            x += d[0]; y += d[1];
            return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
          });
          return idx < 0 ? pts.reverse() : pts;
        };

        // Convert a ring of arc indices → 3D line on the globe surface
        const addBorder = (ring) => {
          const pts = [];
          for (const arcIdx of ring) {
            for (const [lon, lat] of decodeArc(arcIdx)) pts.push(ll3(lat, lon, 1.005));
          }
          if (pts.length < 2) return;
          const bl = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wfBorderMat);
          bl.renderOrder = ORDER.borders;
          countryLinesGroup.add(bl);
        };

        // Decode a ring of arc indices → flat [lon,lat] point list
        const decodeRing = (arcRing) => {
          const pts = [];
          for (const arcIdx of arcRing) for (const ll of decodeArc(arcIdx)) pts.push(ll);
          return pts;
        };

        const countriesGeo = [];
        for (const geom of topo.objects.countries.geometries) {
          // Border outlines (existing behavior)
          if (geom.type === 'Polygon') addBorder(geom.arcs[0]);
          else if (geom.type === 'MultiPolygon') geom.arcs.forEach(poly => addBorder(poly[0]));

          // Full polygons (outer + holes) for airspace fills
          const polys = [];
          const arcSet = new Set(); // normalized arc ids → used for adjacency
          const pushPoly = (rings) => {
            polys.push({ outer: decodeRing(rings[0]), holes: rings.slice(1).map(decodeRing) });
            for (const ring of rings) for (const idx of ring) arcSet.add(idx < 0 ? ~idx : idx);
          };
          if (geom.type === 'Polygon') pushPoly(geom.arcs);
          else if (geom.type === 'MultiPolygon') geom.arcs.forEach(pushPoly);

          let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
          for (const p of polys) for (const [lo, la] of p.outer) {
            if (lo < minLon) minLon = lo; if (lo > maxLon) maxLon = lo;
            if (la < minLat) minLat = la; if (la > maxLat) maxLat = la;
          }
          countriesGeo.push({ id: geom.id, polys, arcs: arcSet, center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2] });
        }
        t.countriesGeo = countriesGeo;

        // Merge every country footprint into one land-fill mesh (sits just above
        // the ocean overlay, below the border lines and POI airspace floor).
        const parts = countriesGeo.map(c => triangulateCountry(c, 1.0038));
        const total = parts.reduce((n, p) => n + p.length, 0);
        if (total) {
          const arr = new Float32Array(total);
          let off = 0;
          for (const p of parts) { arr.set(p, off); off += p.length; }
          const lg = new THREE.BufferGeometry();
          lg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
          landMesh = new THREE.Mesh(lg, landFillMat);
          landMesh.renderOrder = ORDER.landFill;
          earthGroup.add(landMesh);
        }
        // If a POI is already focused before the data arrived, build its fills now
        t.rebuildAirspace?.();
      })
      .catch(() => {}); // fall back to grid-only wireframe on network failure

    // Cloud layer — NASA cloud composite. Radius dropped from 1.014 to 1.007:
    // 1.4% of Earth's radius is a ~90 km cloud deck, and the parallax gap it left
    // between cloud and ground was a large part of the "shell over a ball" read.
    const cloudUniforms = {
      uCloud: uCloudTex, uCloudOff, uSunDir, uCamPos, uExposure, uCloudGain,
      uOpacity: { value: 0 },
    };
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: cloudUniforms, vertexShader: SPHERE_VERT, fragmentShader: CLOUD_FRAG,
      transparent: true, depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.007, 128, 128), cloudMat);
    cloudMesh.renderOrder = ORDER.clouds;
    earthGroup.add(cloudMesh);

    // One texture feeds both the cloud shell and the earth's shadow lookup, so
    // shadows always track the deck as it drifts.
    const setClouds = (tex, base, gain) => {
      uCloudTex.value = prepMap(tex);
      uCloudGain.value = gain;
      cloudMesh.userData.baseOpacity = base;
    };
    // Same CORS story as the base map: the NASA cloud composite never loaded, and
    // the old fallback reused earth-topology.png as an alpha map — a smooth global
    // elevation field, which draped the planet in uniform haze instead of clouds.
    // Now a real 4096 × 2048 composite, with a banded procedural map behind it.
    loader.load(
      'https://unpkg.com/globe.gl/example/clouds/clouds.png',
      tex => setClouds(tex, 0.52, 1.1),
      undefined,
      () => setClouds(new THREE.CanvasTexture(buildCloudMap()), 0.42, 0.85)
    );

    // ── High-res tile overlay ────────────────────────────
    // Two pyramids over the same view: ESRI daytime imagery, and NASA VIIRS
    // night lights composited additively on the unlit side. Each keeps its own
    // cache and zoom ceiling — GIBS only publishes city lights to zoom 8, so it
    // pins there and stretches while the day layer keeps sharpening.
    const tileGroup = new THREE.Group();
    earthGroup.add(tileGroup);
    const nightTileGroup = new THREE.Group();
    earthGroup.add(nightTileGroup);

    const TILE_LAYERS = [
      {
        name: 'day', group: tileGroup, cache: new Map(), texCache: new Map(), pending: new Map(), maxZoom: 19,
        radius: 1.0015, orderBase: 0, frag: TILE_FRAG, blending: THREE.NormalBlending,
        url: (z, x, y) =>
          `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
      },
      {
        name: 'night', group: nightTileGroup, cache: new Map(), texCache: new Map(), pending: new Map(), maxZoom: 8,
        radius: 1.0016, orderBase: 20, frag: NIGHT_TILE_FRAG, blending: THREE.AdditiveBlending,
        url: (z, x, y) =>
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012` +
          `/default/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpg`,
      },
    ];
    const tileCache = TILE_LAYERS[0].cache;

    function lonLatToTile(lon, lat, zoom) {
      const z = 1 << zoom;
      const x = Math.floor((lon + 180) / 360 * z);
      const latRad = Math.max(-Math.PI / 2 + 1e-6, Math.min(Math.PI / 2 - 1e-6, lat * Math.PI / 180));
      const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * z);
      return { x: ((x % z) + z) % z, y: Math.max(0, Math.min(z - 1, y)) };
    }

    // Loaded tile textures outlive their meshes. Zooming back and forth used to
    // re-download every tile each pass (GIBS sends no-store, so the browser cache
    // never helped), and a level only appeared once its fetches came back.
    // Insertion-ordered Map as an LRU; live tiles are a small fraction of the cap.
    const TEX_CACHE_MAX = 600;
    function fetchTileTex(layer, zoom, tx, ty, onLoad, onError) {
      const key = `${zoom}/${tx}/${ty}`;
      const hit = layer.texCache.get(key);
      if (hit) {
        layer.texCache.delete(key); layer.texCache.set(key, hit);   // touch
        onLoad?.(hit);
        return;
      }
      const waiting = layer.pending.get(key);
      if (waiting) { waiting.push([onLoad, onError]); return; }
      layer.pending.set(key, [[onLoad, onError]]);
      loader.load(
        layer.url(zoom, tx, ty),
        tex => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAniso;
          layer.texCache.set(key, tex);
          for (const [k, old] of layer.texCache) {
            if (layer.texCache.size <= TEX_CACHE_MAX) break;
            if (layer.cache.get(k)?.material?.map === old) continue;     // still on screen
            old.dispose(); layer.texCache.delete(k);
          }
          for (const [ok] of layer.pending.get(key) ?? []) ok?.(tex);
          layer.pending.delete(key);
        },
        undefined,
        () => {
          for (const [, err] of layer.pending.get(key) ?? []) err?.();
          layer.pending.delete(key);
        }
      );
    }

    function createTile(layer, zoom, tx, ty) {
      const key = `${zoom}/${tx}/${ty}`;
      if (layer.cache.has(key)) return;
      layer.cache.set(key, null); // mark loading

      const N = 16, z = 1 << zoom;
      const pos = [], uvs = [], idx = [];
      for (let j = 0; j <= N; j++) {
        for (let i = 0; i <= N; i++) {
          const u = i / N, v = j / N;
          const lon = (tx + u) / z * 360 - 180;
          const mercY = (1 - 2 * (ty + v) / z) * Math.PI;
          const lat = Math.atan(Math.sinh(mercY)) * 180 / Math.PI;
          const p = ll3(lat, lon, layer.radius);
          pos.push(p.x, p.y, p.z);
          uvs.push(u, 1 - v);
        }
      }
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = j * (N + 1) + i, b = a + 1, c = a + (N + 1), d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();

      // Shares the planet's lighting model so a tile fading in matches the base
      // map underneath it. `mat.opacity` stays the JS-side source of truth for the
      // fade below and is mirrored into uOpacity each frame; `mat.map` is kept in
      // sync purely so the load/evict bookkeeping can test and dispose it.
      const mat = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: blackTex }, uSunDir, uExposure, uOpacity: { value: 0 } },
        vertexShader: SPHERE_VERT, fragmentShader: layer.frag,
        transparent: true, depthWrite: false, blending: layer.blending,
      });
      mat.opacity = 0;
      mat.map = null;
      const mesh = new THREE.Mesh(geo, mat);
      // Below the wireframe stack and the clouds, but still ordered among
      // themselves: coarser levels sit under finer ones so a partially-loaded
      // level always has its predecessor showing through underneath. The night
      // layer gets its own band above every day level — it tops out at zoom 8,
      // so ordering it by zoom alone buried it under the opaque finer day tiles
      // and the city lights vanished as soon as you zoomed past it.
      mesh.renderOrder = ORDER.tileBase + zoom + layer.orderBase;
      layer.group.add(mesh);
      layer.cache.set(key, mesh);

      fetchTileTex(layer, zoom, tx, ty,
        tex => { mat.uniforms.uMap.value = tex; mat.map = tex; },
        () => {
          if (layer.cache.get(key) !== mesh) return;   // already evicted
          layer.group.remove(mesh); geo.dispose(); mat.dispose(); layer.cache.set(key, 'failed');
        }
      );
    }

    // Markers — one per article so every event has its own pin
    const markerMeshes = [];
    const markerGroup  = new THREE.Group();
    earthGroup.add(markerGroup);

    news.forEach(article => {
      const pos = ll3(article.lat, article.lon, 1.012);
      const col = levelColor(article.importance);
      const sz  = 0.7 + article.importance * 0.05;

      const ag = new THREE.Group();
      ag.userData.ageMinutes = parseMinutes(article.time);
      markerGroup.add(ag);

      const spike = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.009, 0.055, 6),
        new THREE.MeshBasicMaterial({ color: col })
      );
      spike.position.copy(pos);
      spike.lookAt(new THREE.Vector3(0, 0, 0));
      spike.rotateX(Math.PI / 2);
      spike.scale.setScalar(sz);
      spike.userData = { id: article._key ?? article.id, region: article.region, lat: article.lat, lon: article.lon, baseScale: sz };
      markerMeshes.push(spike);
      ag.add(spike);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.022, 0.032, 32),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.position.copy(pos.clone().multiplyScalar(1.003));
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.userData = { pulse: true, phase: Math.random() * Math.PI * 2 };
      ag.add(ring);

      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.01, 16),
        new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })
      );
      dot.position.copy(pos.clone().multiplyScalar(1.004));
      dot.lookAt(new THREE.Vector3(0, 0, 0));
      ag.add(dot);
    });
    setOrder(markerGroup, ORDER.markers);

    // POI markers — circle rings + clickable center dots
    const poiMarkerMeshes = [];
    const poiMarkerGroup  = new THREE.Group();
    earthGroup.add(poiMarkerGroup);

    pois.forEach(poi => {
      const pos = ll3(poi.lat, poi.lon, 1.012);
      const col = AFFIL_HEX[poi.affiliation] ?? 0x9b6dff;

      // Outer glow ring
      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.040, 0.054, 32),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
      );
      outerRing.position.copy(pos.clone().multiplyScalar(1.002));
      outerRing.lookAt(new THREE.Vector3(0, 0, 0));
      outerRing.userData = { poiPulse: true, phase: Math.random() * Math.PI * 2, speed: 0.65 };
      poiMarkerGroup.add(outerRing);

      // Inner ring
      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.022, 0.030, 32),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false })
      );
      innerRing.position.copy(pos.clone().multiplyScalar(1.003));
      innerRing.lookAt(new THREE.Vector3(0, 0, 0));
      innerRing.userData = { poiPulse: true, phase: Math.random() * Math.PI * 2 + 0.9, speed: 1.0 };
      poiMarkerGroup.add(innerRing);

      // Center dot — also the raycaster hit target
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.009, 16),
        new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })
      );
      dot.position.copy(pos.clone().multiplyScalar(1.004));
      dot.lookAt(new THREE.Vector3(0, 0, 0));
      dot.userData = { isPoiMarker: true, poiId: poi.id };
      poiMarkerMeshes.push(dot);
      poiMarkerGroup.add(dot);
    });
    setOrder(poiMarkerGroup, ORDER.markers);

    // ── Airspace fills — translucent country footprints raised into a shell.
    // Rebuilt onto the active POI's region: the POI's country is tinted with its
    // affiliation color, surrounding visible countries a dull grey. Lives in
    // earthGroup so the fills stay glued to geography as the globe rotates.
    const airFillGroup = new THREE.Group();
    airFillGroup.visible = false;
    earthGroup.add(airFillGroup);
    t.airFillGroup = airFillGroup;

    // ADS-B tracks live in their own group so they can be re-rendered independently
    // of the airspace volume. Plotted with llaToVec3 so they sit at true altitude.
    const adsbGroup = new THREE.Group();
    earthGroup.add(adsbGroup);
    t.adsbGroup = adsbGroup;
    t.renderAdsb?.(); // draw any tracks supplied before init finished

    // Prediction hotspot markers — hexagonal rings
    const predMarkerGroup = new THREE.Group();
    earthGroup.add(predMarkerGroup);

    predictions.forEach(pred => {
      const pos = ll3(pred.lat, pred.lon, 1.012);

      // Outer hexagonal glow ring
      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.042, 0.056, 6),
        new THREE.MeshBasicMaterial({ color: PRED_COLOR, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
      );
      outerRing.position.copy(pos.clone().multiplyScalar(1.002));
      outerRing.lookAt(new THREE.Vector3(0, 0, 0));
      outerRing.userData = { predPulse: true, phase: Math.random() * Math.PI * 2, speed: 0.65 };
      predMarkerGroup.add(outerRing);

      // Middle hexagonal ring
      const midRing = new THREE.Mesh(
        new THREE.RingGeometry(0.026, 0.036, 6),
        new THREE.MeshBasicMaterial({ color: PRED_COLOR, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
      );
      midRing.position.copy(pos.clone().multiplyScalar(1.003));
      midRing.lookAt(new THREE.Vector3(0, 0, 0));
      midRing.userData = { predPulse: true, phase: Math.random() * Math.PI * 2 + 1.1, speed: 0.9 };
      predMarkerGroup.add(midRing);

      // Inner hexagonal solid
      const innerHex = new THREE.Mesh(
        new THREE.CircleGeometry(0.01, 6),
        new THREE.MeshBasicMaterial({ color: PRED_COLOR, side: THREE.DoubleSide })
      );
      innerHex.position.copy(pos.clone().multiplyScalar(1.004));
      innerHex.lookAt(new THREE.Vector3(0, 0, 0));
      predMarkerGroup.add(innerHex);

      // Spike
      const spike = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.007, 0.048, 6),
        new THREE.MeshBasicMaterial({ color: PRED_COLOR })
      );
      spike.position.copy(pos);
      spike.lookAt(new THREE.Vector3(0, 0, 0));
      spike.rotateX(Math.PI / 2);
      predMarkerGroup.add(spike);
    });
    setOrder(predMarkerGroup, ORDER.markers);

    // Country labels — Sprites rotate with earthGroup but always face the camera
    const labelSprites = [];
    COUNTRIES.forEach(({ name, lat, lon, sz }) => {
      const tex = new THREE.CanvasTexture(makeLabel(name));
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(ll3(lat, lon, 1.07));
      // scale preserves canvas aspect ratio (256 × 56)
      sprite.scale.set(0.44, 0.44 * 56 / 256, 1);
      sprite.renderOrder = ORDER.labels;
      sprite.userData.sz = sz;
      earthGroup.add(sprite);
      labelSprites.push(sprite);
    });

    // Pip sprites: compact amber fallback shown when a label is crowded out at max zoom
    const pipSprites = [];
    COUNTRIES.forEach(({ name, lat, lon }) => {
      const tex = new THREE.CanvasTexture(makePip(name));
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const pip = new THREE.Sprite(mat);
      pip.position.copy(ll3(lat, lon, 1.09));
      pip.scale.set(0.28, 0.28 * 24 / 160, 1);
      pip.renderOrder = ORDER.pips;
      pip.visible = false;
      earthGroup.add(pip);
      pipSprites.push(pip);
    });

    // ── Raycaster ────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    let shiftDown = false;
    const onKeyDown = e => { if (e.key === 'Shift') { shiftDown = true; canvas.style.cursor = 'move'; } };
    const onKeyUp   = e => { if (e.key === 'Shift') { shiftDown = false; canvas.style.cursor = t.isDragging ? 'grabbing' : 'grab'; } };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);

    // ── Event handlers ───────────────────────────────────
    const onMouseDown = e => {
      if (e.button === 0) {
        t.isDragging = true; t.dragMoved = false;
        t.isPanDrag = shiftDown;
        t.prevX = e.clientX; t.prevY = e.clientY;
        t.autoSpin = false;
      } else if (e.button === 1) {
        e.preventDefault();
        t.isDraggingMiddle = true;
        t.prevXM = e.clientX; t.prevYM = e.clientY;
        t.autoSpin = false;
      } else if (e.button === 2) {
        t.isDraggingRight = true;
        t.prevXR = e.clientX; t.prevYR = e.clientY;
      }
      canvas.style.cursor = 'grabbing';
    };

    const onMouseUp = e => {
      if (e.button === 0) {
        if (t.isDragging && !t.dragMoved) {
          const rect = canvas.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
          mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);

          const poiHits = raycaster.intersectObjects(poiMarkerMeshes);
          if (poiHits.length > 0) {
            onPoiSelectRef.current?.(poiHits[0].object.userData.poiId);
            t.isDragging = false;
            canvas.style.cursor = 'grab';
            return;
          }

          const hits = raycaster.intersectObjects(markerMeshes)
            .filter(h => h.object.parent?.visible !== false);
          if (hits.length > 0) {
            const {id} = hits[0].object.userData;
            onSelectRef.current(NEWS[NEWS.findIndex((val) => val._key == id)]);
          }
        }
        t.isDragging = false;
      } else if (e.button === 1) {
        t.isDraggingMiddle = false;
      } else if (e.button === 2) {
        t.isDraggingRight = false;
      }
      canvas.style.cursor = shiftDown ? 'move' : 'grab';
    };

    // Screen-space drag → rotation gain. The ground under the cursor sits
    // (camDist − 1) from the eye, not camDist, so apparent motion per radian
    // scales with that gap — it collapses to nearly zero as the camera settles
    // onto the surface. Scaling by camDist alone only ever fell to a third of
    // full sensitivity, which is why the globe stayed twitchy when zoomed in.
    // Normalised so the default view (camDist 3) keeps its existing feel.
    const dragGain = () => Math.max(0.012, t.camDist - 1) / 2;

    const applyPan = (dx, dy) => {
      // Convert screen-space delta to world-space pan using stored camera basis
      const scale = 2 * t.curZ * Math.tan(t.curFov / 2 * Math.PI / 180) / canvas.clientHeight;
      t.targetPanX -= (t.camRX * dx - t.camUX * dy) * scale;
      t.targetPanY -= (t.camRY * dx - t.camUY * dy) * scale;
      t.targetPanZ -= (t.camRZ * dx - t.camUZ * dy) * scale;
      // Clamp pan so the pivot stays near the globe surface
      const mag = Math.sqrt(t.targetPanX ** 2 + t.targetPanY ** 2 + t.targetPanZ ** 2);
      if (mag > 0.85) {
        const f = 0.85 / mag;
        t.targetPanX *= f; t.targetPanY *= f; t.targetPanZ *= f;
      }
    };

    const onMouseMove = e => {
      if (t.isDragging) {
        const dx = e.clientX - t.prevX, dy = e.clientY - t.prevY;
        if (Math.abs(dx) + Math.abs(dy) > 2) t.dragMoved = true;
        if (t.isPanDrag || shiftDown) {
          // Shift + left-drag: pan the orbit pivot
          applyPan(dx, dy);
        } else if (t.poiMode) {
          // POI mode: orbit the camera around the POI pivot (not the globe center),
          // so the site stays put. Azimuth circles it; tilt clamped to a band.
          const ts = dragGain();
          t.targetAzimuth += dx * 0.006 * ts;
          t.targetTilt    += dy * 0.006 * ts;
          t.targetTilt = Math.max(0.45, Math.min(1.45, t.targetTilt));
        } else {
          // Left-drag: rotate globe — sensitivity proportional to zoom distance
          const rs = dragGain();
          t.targetRotY += dx * 0.005 * rs;
          t.targetRotX += dy * 0.005 * rs;
          t.targetRotX = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, t.targetRotX));
        }
        t.prevX = e.clientX; t.prevY = e.clientY;
      }
      if (t.isDraggingMiddle) {
        // Middle-drag: pan the orbit pivot
        const dx = e.clientX - t.prevXM, dy = e.clientY - t.prevYM;
        applyPan(dx, dy);
        t.prevXM = e.clientX; t.prevYM = e.clientY;
      }
      if (t.isDraggingRight) {
        const dx = e.clientX - t.prevXR, dy = e.clientY - t.prevYR;
        const ts = dragGain();
        t.targetAzimuth += dx * 0.006 * ts;
        t.targetTilt    += dy * 0.006 * ts;
        t.targetTilt = Math.max(0, Math.min(Math.PI - 0.04, t.targetTilt));
        t.prevXR = e.clientX; t.prevYR = e.clientY;
      }
    };

    const onWheel = e => {
      e.preventDefault();
      // POI mode allows diving inside the airspace (and pulling back to see the box)
      if (t.poiMode) {
        t.targetZ = Math.max(0.04, Math.min(1.3, t.targetZ * Math.exp(e.deltaY * 0.001)));
        return;
      }
      // Scale altitude, not distance from the centre. Scaling distance made each
      // notch near the surface a 10x jump in height (1.01 → 1.11), so zoom
      // lurched close in and crawled far out.
      const alt = Math.max(0.003, Math.min(3, (t.targetZ - 1) * Math.exp(e.deltaY * 0.0015)));
      t.targetZ = 1 + alt;
    };

    const onContextMenu = e => e.preventDefault();

    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); }, { passive: false });
    window.addEventListener('mouseup', onMouseUp);

    // ── Resize ───────────────────────────────────────────
    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // Reused vectors to avoid GC pressure in animation loop
    const worldVec = new THREE.Vector3();
    const sunVec   = new THREE.Vector3();

    // ── Animation loop ───────────────────────────────────
    let elapsed = 0, lastFrame = performance.now(), rafId, lastTileCheck = 0;
    let lastZLevel = null;   // drives the tile-level hysteresis

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt  = (now - lastFrame) / 1000;
      lastFrame = now;
      elapsed  += dt;

      if (t.autoSpin) t.targetRotY += dt * -0.2; // set > 0 to auto-rotate

      t.curRotY    += (t.targetRotY    - t.curRotY)    * 0.06;
      t.curRotX    += (t.targetRotX    - t.curRotX)    * 0.06;
      // Ease altitude in log space so the approach decelerates evenly all the way
      // down instead of covering the last few hundred km in a single frame.
      if (!t.poiMode && t.curZ > 1.0005 && t.targetZ > 1.0005) {
        const la = Math.log(t.curZ - 1);
        t.curZ = 1 + Math.exp(la + (Math.log(t.targetZ - 1) - la) * 0.08);
      } else {
        t.curZ += (t.targetZ - t.curZ) * 0.06;
      }
      t.curTilt    += (t.targetTilt    - t.curTilt)    * 0.08;
      t.curAzimuth += (t.targetAzimuth - t.curAzimuth) * 0.08;

      earthGroup.rotation.y = t.curRotY;
      earthGroup.rotation.x = t.curRotX;

      // Smooth pan offset
      t.curPanX += (t.targetPanX - t.curPanX) * 0.08;
      t.curPanY += (t.targetPanY - t.curPanY) * 0.08;
      t.curPanZ += (t.targetPanZ - t.curPanZ) * 0.08;

      // Spherical camera: tilt from zenith, azimuth around z-axis, offset by pan
      camera.position.set(
        Math.sin(t.curTilt) * Math.cos(t.curAzimuth) * t.curZ + t.curPanX,
        Math.sin(t.curTilt) * Math.sin(t.curAzimuth) * t.curZ + t.curPanY,
        Math.cos(t.curTilt) * t.curZ + t.curPanZ,
      );
      // Compute true distance first — used for near plane and tile selection
      const camDist = camera.position.length();
      t.camDist = camDist;
      camera.near = Math.max(0.0005, (camDist - 1.0) * 0.35);
      t.curFov += (t.targetFov - t.curFov) * 0.06;
      camera.fov = t.curFov;
      camera.lookAt(t.curPanX, t.curPanY, t.curPanZ);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);

      // Store camera right/up vectors for pan gesture (column-major matrixWorld)
      t.camRX = camera.matrixWorld.elements[0];
      t.camRY = camera.matrixWorld.elements[1];
      t.camRZ = camera.matrixWorld.elements[2];
      t.camUX = camera.matrixWorld.elements[4];
      t.camUY = camera.matrixWorld.elements[5];
      t.camUZ = camera.matrixWorld.elements[6];

      // ── Planet shader uniforms ──────────────────────────
      // The sun is a child of earthGroup, so its world position already carries
      // the globe's rotation — reading it here keeps the terminator locked to
      // geography for the shader exactly as it is for the scene lights.
      sun.getWorldPosition(sunVec);
      uSunDir.value.copy(sunVec).normalize();
      uCamPos.value.copy(camera.position);
      // Slow relative drift of the cloud deck over the ground. Shadows follow it.
      uCloudOff.value.x = (uCloudOff.value.x + dt * 0.0004) % 1;
      starUniforms.uTime.value = elapsed;


      // ── Tile overlay ────────────────────────────────────
      const TILE_THRESH = 1.75;
      // No satellite tiles in wireframe mode — they'd flash in before being masked
      if (camDist < TILE_THRESH && !wireRef.current) {
        for (const L of TILE_LAYERS) L.group.visible = true;
        const nowMs = performance.now();
        if (nowMs - lastTileCheck > 400) {
          lastTileCheck = nowMs;
          // Camera direction un-rotated through earth → gives true focus lat/lon
          const camNorm = camera.position.clone().normalize();
          const invQ = earthGroup.quaternion.clone(); invQ.invert();
          camNorm.applyQuaternion(invQ);
          const lonCenter = Math.atan2(camNorm.z, -camNorm.x) * 180 / Math.PI - 180;
          const latCenter = Math.max(-85, Math.min(85, Math.asin(Math.max(-1, Math.min(1, camNorm.y))) * 180 / Math.PI));

          let zLevel = camDist < 1.008 ? 13
                     : camDist < 1.016 ? 12
                     : camDist < 1.032 ? 11
                     : camDist < 1.06  ? 10
                     : camDist < 1.13  ?  9
                     : camDist < 1.28  ?  8
                     : camDist < 1.5   ?  7
                     :                    6;
          // Hysteresis: hovering right on a threshold used to flip the level back
          // and forth, tearing down a pyramid and rebuilding it every half second.
          // Coarsening now needs the camera to pull meaningfully clear of the edge.
          if (lastZLevel !== null && zLevel < lastZLevel && camDist < ZOOM_EDGE[lastZLevel] * 1.10) {
            zLevel = lastZLevel;
          }
          lastZLevel = zLevel;

          for (const L of TILE_LAYERS) {
            const zl = Math.min(zLevel, L.maxZoom);
            // Wider radius for eager preloading: tiles are fetched before the edge reaches the viewport
            const R  = zl >= 12 ? 2 : zl >= 10 ? 3 : 4;
            const { x: cx, y: cy } = lonLatToTile(lonCenter, latCenter, zl);
            const zn = 1 << zl;

            for (let dy = -R; dy <= R; dy++) {
              for (let dx = -R; dx <= R; dx++) {
                const tx = ((cx + dx) % zn + zn) % zn;
                const ty = Math.max(0, Math.min(zn - 1, cy + dy));
                createTile(L, zl, tx, ty);
              }
            }

            // Zooming in: warm the next level's textures around the focus so
            // its tiles appear the moment the level switches over.
            if (t.targetZ < camDist - 0.002 && zl + 1 <= L.maxZoom) {
              const nz = zl + 1, nzn = 1 << nz;
              const { x: px, y: py } = lonLatToTile(lonCenter, latCenter, nz);
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  fetchTileTex(L, nz, ((px + dx) % nzn + nzn) % nzn, Math.max(0, Math.min(nzn - 1, py + dy)));
                }
              }
            }

            // Keep the two coarser levels resident underneath rather than evicting
            // them the moment this level covers. They cost little, load early, and
            // mean there is always a sharper-than-basemap layer showing through —
            // which is what removes the snap from high-res back to low-res.
            for (let back = 1; back <= 2; back++) {
              const fb = zl - back;
              if (fb < 5) break;
              const { x: fx, y: fy } = lonLatToTile(lonCenter, latCenter, fb);
              const fzn = 1 << fb;
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  const tx = ((fx + dx) % fzn + fzn) % fzn;
                  const ty = Math.max(0, Math.min(fzn - 1, fy + dy));
                  createTile(L, fb, tx, ty);
                }
              }
            }

            // Evict anything finer than needed, more than two levels coarser, or
            // that has drifted outside its level's working window.
            for (const [key, mesh] of L.cache) {
              if (!mesh || mesh === 'failed' || mesh.userData.evicting) continue;
              const [kz, kx, ky] = key.split('/').map(Number);
              const back = zl - kz;
              if (back < 0 || back > 2) { mesh.userData.evicting = true; continue; }
              const c = lonLatToTile(lonCenter, latCenter, kz);
              const kzn = 1 << kz;
              let ddx = Math.abs(kx - c.x);
              ddx = Math.min(ddx, kzn - ddx);           // longitude wraps
              const allow = back === 0 ? R + 2 : 4;
              if (ddx > allow || Math.abs(ky - c.y) > allow) mesh.userData.evicting = true;
            }
          }
        }

        // Per-frame: fade in loading tiles, fade out evicting ones, remove at 0.
        // Fade-out is slower than fade-in so an outgoing level is still partly
        // there while its replacement arrives — a cross-dissolve, not a cut.
        for (const L of TILE_LAYERS) {
          const dead = [];
          for (const [key, mesh] of L.cache) {
            if (!mesh || mesh === 'failed') continue;
            if (mesh.userData.evicting) {
              mesh.material.opacity = Math.max(0, mesh.material.opacity - dt * 0.9);
              if (mesh.material.opacity <= 0) dead.push(key);
            } else if (mesh.material.map && mesh.material.opacity < 1) {
              mesh.material.opacity = Math.min(1, mesh.material.opacity + dt * 1.6);
            }
            mesh.material.uniforms.uOpacity.value = mesh.material.opacity;
          }
          for (const key of dead) {
            const mesh = L.cache.get(key);
            L.group.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();               // texture stays in texCache
            L.cache.delete(key);
          }
        }
      } else if (TILE_LAYERS.some(L => L.cache.size > 0)) {
        // Zoomed back out — evict everything immediately
        for (const L of TILE_LAYERS) {
          for (const [, mesh] of L.cache) {
            if (mesh && mesh !== 'failed') { L.group.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
          }
          L.cache.clear();
          L.group.visible = false;
        }
        lastZLevel = null;
      }

      const ly     = layersRef?.current ?? {};
      const maxAge = scrubberRef?.current ?? 300;
      const showNews = ly.newsMarkers !== false;

      // Scale markers proportionally with camera distance so they stay small when zoomed in
      const mScale = Math.min(1.0, Math.max(0.04, (t.curZ - 1.0) * 0.65));

      markerGroup.children.forEach(ag => {
        ag.visible = showNews && ag.userData.ageMinutes <= maxAge;
        if (ag.visible) {
          ag.children.forEach(c => {
            if (c.userData.pulse) {
              const pulse = (Math.sin(elapsed * 2 + c.userData.phase) + 1) / 2;
              c.material.opacity = 0.15 + pulse * 0.65;
              const s = (1 + pulse * 0.55) * mScale;
              c.scale.set(s, s, 1);
            } else if (c.userData.baseScale !== undefined) {
              c.scale.setScalar(c.userData.baseScale * mScale);
            } else {
              c.scale.setScalar(mScale);
            }
          });
        }
      });

      // ── Wireframe mode transition ──────────────────────────
      const wfTarget = wireRef.current ? 1 : 0;
      wfProgress.current += (wfTarget - wfProgress.current) * 0.04;
      const wf = wfProgress.current;

      wfOverlay.material.opacity = wf * 0.97;
      wfOverlay.material.needsUpdate = true;
      landFillMat.opacity = wf * 0.92; // land fades in with wireframe

      // Grid dims in wireframe (country borders are the primary detail)
      const gridBase = ly.grid !== false ? 0.35 : 0;
      gridMat.opacity = gridBase * (1 - wf) + wf * 0.20;
      gridMat.color.lerpColors(realisticGridColor, wireframeGridColor, wf);
      gridMat.needsUpdate = true;

      // Country borders fade in
      wfBorderMat.opacity = wf * 0.88;
      wfBorderMat.needsUpdate = true;

      // Clouds (and the shadows they cast) retract with the wireframe transition
      // and thin out on approach: the deck is a 4096 px map, so up close it
      // turned into large soft blobs smeared over the sharp satellite tiles.
      const baseCloud = cloudMesh.userData.baseOpacity ?? 0;
      const cloudNear = THREE.MathUtils.smoothstep(camDist, 1.05, 1.30);
      cloudUniforms.uOpacity.value  = baseCloud * (1 - wf) * cloudNear;
      earthUniforms.uCloudAmt.value = (baseCloud > 0 ? 1 : 0) * (1 - wf) * cloudNear;

      // Atmosphere halo: fades out before the camera can pass inside the shell
      // (a back-face sphere seen from within would wash the whole frame blue),
      // and again in wireframe mode where the holographic look takes over.
      const atmo = THREE.MathUtils.clamp((camDist - 1.19) / 0.5, 0, 1) * (1 - wf);
      atmoUniforms.uOpacity.value = atmo;
      atmosphere.visible = atmo > 0.002;

      poiMarkerGroup.visible = ly.poiMarkers !== false;

      // POI markers — circle rings, pulsing
      if (poiMarkerGroup.visible) {
        poiMarkerGroup.children.forEach(c => {
          if (c.userData.poiPulse) {
            const pulse = (Math.sin(elapsed * c.userData.speed + c.userData.phase) + 1) / 2;
            c.material.opacity = 0.04 + pulse * 0.70;
            const s = (1 + pulse * 0.42) * mScale;
            c.scale.set(s, s, 1);
          } else {
            c.scale.setScalar(mScale);
          }
        });
      }

      // Airspace fills — fade country footprints in/out with the active POI
      t.airOpacity += (t.airTarget - t.airOpacity) * 0.07;
      if (t.airOpacity > 0.003) {
        airFillGroup.visible = true;
        airFillGroup.traverse(o => {
          if (o.userData.air) o.material.opacity = o.userData.air.base * t.airOpacity;
        });
      } else {
        airFillGroup.visible = false;
      }

      // Prediction markers pulse with hexagonal rings
      predMarkerGroup.children.forEach(c => {
        if (c.userData.predPulse) {
          const pulse = (Math.sin(elapsed * c.userData.speed + c.userData.phase) + 1) / 2;
          c.material.opacity = 0.08 + pulse * 0.68;
          const s = (1 + pulse * 0.45) * mScale;
          c.scale.set(s, s, 1);
        } else {
          c.scale.setScalar(mScale);
        }
      });

      // ── Label declutter ───────────────────────────────────
      // 1. Compute per-sprite opacity from hemisphere + zoom-size fade.
      // 2. Project to screen space and run a greedy overlap removal,
      //    largest country (sz) wins when two labels collide.
      const showLabels = ly.labels !== false;
      const sw = wrap.clientWidth, sh = wrap.clientHeight;
      if (!showLabels) {
        labelSprites.forEach(sp => { sp.userData.curOpacity = 0; sp.material.opacity = 0; sp.visible = false; });
        pipSprites.forEach(pip => { pip.userData.curOpacity = 0; pip.material.opacity = 0; pip.visible = false; });
      } else if (sw > 0 && sh > 0) {
        // Labels shrink as the user zooms in. World size drops FASTER than the
        // camera distance (exponent > 1) so on-screen size keeps decreasing instead
        // of bottoming out at a fixed pixel size. Low floor lets them get tiny.
        const lblW = 0.44 * THREE.MathUtils.clamp(Math.pow(t.curZ / 2.4, 1.7), 0.004, 1.1);
        const lblH = lblW * 56 / 256;
        labelSprites.forEach(sp => sp.scale.set(lblW, lblH, 1));

        // Sprite half-extents in pixels (42° FOV → 21° half-angle)
        const ppu = sh / (2 * t.curZ * Math.tan(21 * Math.PI / 180));
        const hw  = lblW / 2 * ppu * 1.15;          // half-width  + padding
        const hh  = lblH / 2 * ppu * 1.15;          // half-height + padding

        // First pass: visibility + opacity, collect screen-projected candidates
        const camDir = camera.position.clone().normalize();
        const candidates = [];
        labelSprites.forEach(sp => {
          sp.getWorldPosition(worldVec);
          const d         = worldVec.dot(camDir);   // positive = facing camera
          const fadeStart = 1.8 + sp.userData.sz * 2.2;
          const zoomFade  = 1 - Math.max(0, Math.min(1, (t.curZ - fadeStart) / 0.7));
          if (d > 0.05 && zoomFade > 0.01) {
            const opacity = Math.min(1, (d - 0.05) / 0.3) * zoomFade;
            worldVec.project(camera);               // converts to NDC in-place
            candidates.push({
              sp, opacity,
              cx: (worldVec.x + 1) / 2 * sw,
              cy: (1 - worldVec.y) / 2 * sh,
            });
          } else {
            sp.visible = false;
          }
        });

        // Sort so largest countries are placed first
        candidates.sort((a, b) => b.sp.userData.sz - a.sp.userData.sz);

        // Greedy placement: hide any label whose rect overlaps an already-placed one.
        // Track which sprites were blocked (vs hidden by hemisphere/zoom) for pip fallback.
        const placed = [];
        const blockedSet = new Set();
        candidates.forEach(({ sp, opacity, cx, cy }) => {
          const overlaps = placed.some(p =>
            Math.abs(cx - p.cx) < hw * 2 &&
            Math.abs(cy - p.cy) < hh * 2
          );
          if (overlaps) {
            blockedSet.add(sp);
            sp.userData.curOpacity = (sp.userData.curOpacity ?? 0) * 0.82;
          } else {
            sp.userData.curOpacity = (sp.userData.curOpacity ?? 0) + (opacity - (sp.userData.curOpacity ?? 0)) * 0.1;
            placed.push({ cx, cy });
          }
          sp.material.opacity = sp.userData.curOpacity;
          sp.visible = sp.userData.curOpacity > 0.01;
        });

        // Sprites hidden by hemisphere/zoom also need to fade out
        labelSprites.forEach(sp => {
          if (!candidates.find(c => c.sp === sp) && !blockedSet.has(sp)) {
            sp.userData.curOpacity = (sp.userData.curOpacity ?? 0) * 0.82;
            sp.material.opacity = sp.userData.curOpacity;
            sp.visible = sp.userData.curOpacity > 0.01;
          }
        });

        // Pips: fade in when blocked at near-max zoom, fade out otherwise
        const nearMaxZoom = t.curZ < 1.85;
        pipSprites.forEach((pip, i) => {
          const target = (nearMaxZoom && blockedSet.has(labelSprites[i])) ? 0.85 : 0;
          pip.userData.curOpacity = (pip.userData.curOpacity ?? 0) + (target - (pip.userData.curOpacity ?? 0)) * 0.1;
          pip.material.opacity = pip.userData.curOpacity;
          pip.visible = pip.userData.curOpacity > 0.01;
        });
      } else {
        pipSprites.forEach(pip => { pip.visible = false; });
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ──────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      labelSprites.forEach(sp => { sp.material.map.dispose(); sp.material.dispose(); });
      pipSprites.forEach(pip => { pip.material.map.dispose(); pip.material.dispose(); });
      poiMarkerMeshes.forEach(m => { m.material?.dispose(); });
      countryLinesGroup.children.forEach(m => { m.geometry?.dispose(); });
      wfBorderMat.dispose();
      landMesh?.geometry.dispose();
      landFillMat.dispose();
      for (const L of TILE_LAYERS) {
        L.group.children.forEach(m => { m.geometry?.dispose(); m.material?.dispose(); });
        L.cache.clear();
        for (const tex of L.texCache.values()) tex.dispose();
        L.texCache.clear();
      }
      airFillGroup.traverse(o => { if (o.geometry) { o.geometry.dispose(); o.material.dispose(); } });
      adsbGroup.traverse(o => { if (o.geometry) { o.geometry.dispose(); o.material.dispose(); } });
      stars.geometry.dispose(); stars.material.dispose();
      earthMesh.geometry.dispose(); earthMat.dispose();
      cloudMesh.geometry.dispose(); cloudMat.dispose();
      atmosphere.geometry.dispose(); atmosphere.material.dispose();
      for (const u of [earthUniforms.uDay, earthUniforms.uNight, earthUniforms.uWater,
                       earthUniforms.uTopo, uCloudTex]) u.value?.dispose();
      blackTex.dispose();
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Zoom to active POI, region, or prediction ─────────
  useEffect(() => {
    const t = T.current;
    const coords = activePrediction
      ? activePrediction
      : activeCoords
        ? activeCoords
        : (activeRegion ? news.find(a => a.region === activeRegion) : null);

    if (coords) {
      t.targetRotY = nearestTurn(Math.PI / 2 - (coords.lon + 180) * Math.PI / 180
                   + Math.atan(0.15 / t.targetZ) / Math.cos(coords.lat * Math.PI / 180), t.curRotY);
      t.targetRotX = coords.lat * Math.PI / 180;
      t.targetZ    = 1.95;
      t.autoSpin   = false;
      t.targetPanX = 0; t.targetPanY = 0; t.targetPanZ = 0;
    } else {
      t.autoSpin   = true;
      t.targetZ    = 3;
      t.targetRotX = 0;
      t.targetPanX = 0; t.targetPanY = 0; t.targetPanZ = 0;
    }
  }, [activeRegion, activeCoords, activePrediction, news]);

  // ── POI focus: cinematic swoop from orbital to oblique "site survey" view ──
  // Tilts the camera to an oblique angle and dives in close so the land reads in
  // 3D perspective with the highlighted airspace shells above it. Runs after the
  // zoom-to-coords effect above, so its camera targets win for a POI selection.
  useEffect(() => {
    const t = T.current;

    // Rebuild the country airspace fills for the active POI's region.
    const rebuildAirspace = () => {
      const g = t.airFillGroup;
      if (!g) return;
      g.traverse(o => { if (o.geometry) { o.geometry.dispose(); o.material.dispose(); } });
      g.clear();
      if (!activePoi || !t.countriesGeo) return;

      const { lat: plat, lon: plon } = activePoi;
      const affColor = AFFIL_HEX[activePoi.affiliation] ?? 0x9b6dff;
      const GREY     = 0x8a8a8a;   // dull grey for adjacent countries

      // Target country = the one containing the POI (nearest centroid as fallback)
      let home = t.countriesGeo.find(c => pointInCountry(plon, plat, c));
      if (!home) {
        let best = Infinity;
        for (const c of t.countriesGeo) {
          const d = (c.center[0] - plon) ** 2 + (c.center[1] - plat) ** 2;
          if (d < best) { best = d; home = c; }
        }
      }
      if (!home) return;

      // Adjacent = shares at least one border arc with the target country
      const sharesArc = (a, b) => {
        const [s, l] = a.size < b.size ? [a, b] : [b, a];
        for (const x of s) if (l.has(x)) return true;
        return false;
      };

      for (const c of t.countriesGeo) {
        const isHome = c === home;
        if (!isHome && !sharesArc(c.arcs, home.arcs)) continue; // only target + neighbors
        g.add(buildCountryVolume(c, isHome ? affColor : GREY, isHome));
      }
    };
    t.rebuildAirspace = rebuildAirspace; // let the async loader trigger a rebuild

    if (activePoi) {
      rebuildAirspace();
      t.airTarget = 1;
      t.poiMode   = true;

      // Auto-switch into the holographic wireframe look
      wireRef.current = true;
      setIsWireframe(true);

      // Bring the POI to the camera-facing point (+z), then orbit to an oblique angle.
      t.targetRotY    = nearestTurn(Math.PI / 2 - (activePoi.lon + 180) * Math.PI / 180, t.curRotY);
      t.targetRotX    = activePoi.lat * Math.PI / 180;
      t.targetTilt    = 1.22;          // ~70° off zenith — near-horizon, strong 3D
      t.targetAzimuth = -Math.PI / 2;  // orbit so the airspace reads "above" the land
      t.targetZ       = 0.12;          // dive in extremely close to the site
      t.targetFov     = 62;            // wide FOV → more perspective depth
      // Pivot on the POI surface point; small +x shift keeps it clear of the panel
      t.targetPanX = 0.05; t.targetPanY = 0; t.targetPanZ = 1.0;
      t.autoSpin   = false;
    } else {
      // Back to the orbital view (zoom-to-coords / clear effect handles rot & zoom)
      rebuildAirspace();             // clears the fills
      t.poiMode       = false;
      t.airTarget     = 0;
      t.targetTilt    = 0;
      t.targetAzimuth = 0;
      t.targetFov     = 42;
      t.targetPanX = 0; t.targetPanY = 0; t.targetPanZ = 0;
      wireRef.current = false;
      setIsWireframe(false);
    }
  }, [activePoi]);

  // ── ADS-B tracks ───────────────────────────────────────
  // Each track: { id?, color?, points: [[lat, lon, altMeters], ...] }. Drawn as a
  // 3D polyline at true (exaggerated) altitude plus a faint ground-track shadow.
  useEffect(() => {
    const t = T.current;
    const render = () => {
      const g = t.adsbGroup;
      if (!g) return;
      g.traverse(o => { if (o.geometry) { o.geometry.dispose(); o.material.dispose(); } });
      g.clear();
      for (const tr of adsbTracks) {
        const pts = tr?.points;
        if (!pts || pts.length < 2) continue;
        const color = tr.color ?? 0xcfcfcf;
        const air = pts.map(([la, lo, al]) => llaToVec3(la, lo, al ?? 0));
        g.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(air),
          new THREE.LineBasicMaterial({ color }),
        ));
        const ground = pts.map(([la, lo]) => llaToVec3(la, lo, 0));
        g.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(ground),
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false }),
        ));
      }
      setOrder(g, ORDER.adsb);
    };
    t.renderAdsb = render;
    render();
  }, [adsbTracks]);

  const resetView = () => {
    const t = T.current;
    t.targetRotY    = nearestTurn(0.3, t.curRotY);  t.targetRotX    = 0;
    t.targetZ       = 3;
    t.targetTilt    = 0;    t.targetAzimuth = 0;
    t.targetFov     = 42;
    t.targetPanX    = 0;    t.targetPanY    = 0;  t.targetPanZ = 0;
    t.airTarget     = 0;
    t.autoSpin      = true;
  };

  const toggleWireframe = () => {
    const next = !wireRef.current;
    wireRef.current = next;
    setIsWireframe(next);
  };

  return (
    <div ref={wrapRef} className="globe-wrap">
      <canvas ref={canvasRef} className="globe-canvas" />
      <button className="globe-reset-btn" onClick={resetView} title="Reset view">
        ↺ Reset View
      </button>
      <button
        className={`globe-wireframe-btn${isWireframe ? ' active' : ''}`}
        onClick={toggleWireframe}
        title="Toggle wireframe"
      >
        ◈ Wireframe
      </button>
    </div>
  );
}
