import type { Feature, Polygon } from 'geojson';
import { z } from 'zod';

/**
 * A [longitude, latitude] pair in decimal degrees.
 */
const position = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

/**
 * The only part of the ORS answer we keep: the rings of the first polygon.
 */
const isochroneResponseSchema = z.object({
  features: z
    .array(
      z.object({
        geometry: z.object({
          type: z.literal('Polygon'),
          coordinates: z.array(z.array(position).min(4)).min(1),
        }),
      }),
    )
    .min(1),
});

/**
 * Validates the ORS body and rebuilds a bare polygon feature from its numbers, dropping everything else.
 */
export function parseIsochroneResponse(body: unknown): Feature<Polygon> {
  const { coordinates } = isochroneResponseSchema.parse(body).features[0].geometry;
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: coordinates.map((ring) =>
        ring.map(([longitude, latitude]) => [longitude, latitude]),
      ),
    },
  };
}
