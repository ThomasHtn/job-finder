/**
 * One-shot: asks OpenRouteService for the area reachable by car from the
 * configured centre within SEARCH_AREA_DRIVE_KM and freezes it in src/geo/.
 * Road distance rather than time: ORS caps time isochrones at 60 min, too short
 * to reach Caen or Rouen from Le Havre.
 * The API is never called at runtime.
 *
 *   ORS_API_KEY=... npm run geo:isochrone
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { validateEnv } from '../src/config/validate-env.js';
import { ISOCHRONE_FILENAME } from '../src/geo/commuting-area.js';

config({ path: '../../.env', quiet: true });

const env = validateEnv(process.env);
if (!env.ORS_API_KEY) {
  console.error(
    'ORS_API_KEY is missing. Get a free key at https://openrouteservice.org/dev',
  );
  process.exit(1);
}

const { center, driveKm } = env.searchProfile.area;
const response = await fetch(
  'https://api.openrouteservice.org/v2/isochrones/driving-car',
  {
    method: 'POST',
    headers: {
      Authorization: env.ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locations: [[center.longitude, center.latitude]],
      range: [driveKm * 1000],
      range_type: 'distance',
      /* Smooths the spiky raw output without meaningfully changing coverage. */
      smoothing: 15,
    }),
  },
);

if (!response.ok) {
  console.error(
    `OpenRouteService returned ${response.status}: ${await response.text()}`,
  );
  process.exit(1);
}

const geojson = await response.json();
const target = fileURLToPath(
  new URL(`../src/geo/${ISOCHRONE_FILENAME}`, import.meta.url),
);
writeFileSync(target, `${JSON.stringify(geojson)}\n`);

const points = geojson.features?.[0]?.geometry?.coordinates?.[0]?.length ?? 0;
console.log(
  `Wrote ${ISOCHRONE_FILENAME} (${driveKm} km, ${points} points) to ${target}`,
);
console.log(
  'Commit this file: the API now filters offers locally, with no network call.',
);
