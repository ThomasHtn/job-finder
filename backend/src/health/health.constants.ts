/**
 * Probe routes, served outside the /api prefix: a monitor reaches them without knowing the API.
 */
export const PROBE_PATHS = ['livez', 'readyz'];
