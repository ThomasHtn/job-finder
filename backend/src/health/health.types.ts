/**
 * Body of the probes, the same UP/DOWN body as our other apps, so one uptime-kuma keyword fits all.
 */
export interface ProbeReport {
  /**
   * "UP" when the probe passes, "DOWN" otherwise.
   */
  status: 'UP' | 'DOWN';
}
