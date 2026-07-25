import type { Position } from '@hanse2go/shared';

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => degrees * (Math.PI / 180);

/** Calculates the great-circle distance between two normalized WGS84 positions. */
export function distanceInMeters(from: Position, to: Position): number {
  const latitudeDifference = toRadians(to.latitude - from.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const a = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDifference / 2) ** 2;

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
