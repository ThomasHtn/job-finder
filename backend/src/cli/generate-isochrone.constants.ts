/**
 * OpenRouteService endpoint answering the area reachable by car.
 */
export const ISOCHRONE_URL = 'https://api.openrouteservice.org/v2/isochrones/driving-car';

/**
 * ORS takes distance ranges in metres.
 */
export const METERS_PER_KM = 1000;

/**
 * ORS smoothing factor (0 to 100): evens out the spiky raw output without meaningfully changing coverage.
 */
export const ISOCHRONE_SMOOTHING = 15;
