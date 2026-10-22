import type { ConfigService } from '@nestjs/config';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Env } from '../shared/config/env.schema.js';
import { IngestionHeartbeatService } from './ingestion-heartbeat.service.js';

/**
 * Heartbeat configured with the given push URL.
 */
function heartbeat(url: string | undefined) {
  return new IngestionHeartbeatService({ get: () => url } as unknown as ConfigService<Env, true>);
}

/**
 * Push of each run to the uptime-kuma monitor.
 */
describe('IngestionHeartbeatService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('stays silent without a monitor', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    await heartbeat(undefined).send({ status: 'up', msg: 'ok' }, 10);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('pushes the status, message and duration', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await heartbeat('https://status.example/api/push/token').send(
      { status: 'down', msg: '1 of 7 sources failed: APEC (timeout)' },
      1234.6,
    );

    const url = new URL(String((fetch.mock.calls[0] as unknown[])[0]));
    expect(url.origin + url.pathname).toBe('https://status.example/api/push/token');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      status: 'down',
      msg: '1 of 7 sources failed: APEC (timeout)',
      ping: '1235',
    });
  });

  it('never throws when the monitor is unreachable or refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('ENOTFOUND'))),
    );
    await expect(
      heartbeat('https://status.example/push').send({ status: 'up', msg: 'ok' }, 1),
    ).resolves.toBeUndefined();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 })),
    );
    await expect(
      heartbeat('https://status.example/push').send({ status: 'up', msg: 'ok' }, 1),
    ).resolves.toBeUndefined();
  });
});
