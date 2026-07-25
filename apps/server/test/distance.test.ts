import { describe, expect, it } from 'vitest';
import type { Position } from '@hanse2go/shared';
import { distanceInMeters } from '../src/distance.js';

const position = (longitude: number, latitude: number): Position => ({ longitude, latitude, recordedAt: '2026-01-01T00:00:00.000Z' });

describe('distanceInMeters', () => {
  it('calculates zero for an identical position', () => {
    const lambrecht = position(8.07, 49.37);
    expect(distanceInMeters(lambrecht, lambrecht)).toBe(0);
  });

  it('calculates a geographic distance in meters', () => {
    const lambrecht = position(8.07, 49.37);
    const neustadt = position(8.14, 49.4);

    expect(distanceInMeters(lambrecht, neustadt)).toBeGreaterThan(5_900);
    expect(distanceInMeters(lambrecht, neustadt)).toBeLessThan(6_100);
  });
});
