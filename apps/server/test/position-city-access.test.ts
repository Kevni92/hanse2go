import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const coordinateNorthOf = (latitude: number, distanceMeters: number) => latitude + (distanceMeters / 6_371_000) * (180 / Math.PI);

describe('position and city access API', () => {
  let app = buildApp();

  afterEach(async () => {
    await app.close();
    app = buildApp();
  });

  it('stores only a server-confirmed debug position and returns its reachability', async () => {
    const response = await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.fleet.position).toMatchObject({ longitude: 8.07, latitude: 49.37 });
    expect(body.fleet.position.recordedAt).toEqual(expect.any(String));
    expect(body.reachableCities).toContainEqual(expect.objectContaining({ cityId: 'lambrecht', reachable: true, distanceMeters: 0 }));
  });

  it('rejects invalid coordinates without changing the stored fleet position', async () => {
    const before = await app.inject({ method: 'GET', url: '/api/fleet' });
    const response = await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 181, latitude: 49.37 } });
    const after = await app.inject({ method: 'GET', url: '/api/fleet' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'INVALID_POSITION' } });
    expect(after.json().position).toEqual(before.json().position);
  });

  it('allows city access within and exactly at the inclusive radius', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: coordinateNorthOf(49.37, 800) } });

    const response = await app.inject({ method: 'GET', url: '/api/cities/lambrecht' });

    expect(response.statusCode).toBe(200);
    expect(response.json().city).toMatchObject({ id: 'lambrecht', radiusMeters: 800 });
  });

  it('denies an out-of-range city on every access attempt', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.04, latitude: 49.4 } });

    const response = await app.inject({ method: 'GET', url: '/api/cities/lambrecht' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: { code: 'CITY_OUT_OF_RANGE' } });
  });
});
