import type { City, ReachableCity } from '@hanse2go/shared';
import { distanceInMeters } from './distance.js';
import type { GameRepository } from './game-state.js';

export class DomainError extends Error {
  constructor(
    readonly code: 'CITY_NOT_FOUND' | 'CITY_OUT_OF_RANGE' | 'INVALID_POSITION',
    message: string,
    readonly statusCode: number,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class CityAccessService {
  constructor(private readonly repository: GameRepository) {}

  getReachability(): ReachableCity[] {
    const position = this.repository.getFleet().position;
    return this.repository.getCities().map((city) => {
      const distanceMeters = distanceInMeters(position, city.position);
      return {
        cityId: city.id,
        distanceMeters: Math.round(distanceMeters),
        // An epsilon avoids an IEEE-754 rounding artefact at the documented inclusive boundary.
        reachable: distanceMeters <= city.radiusMeters + 0.001,
      };
    });
  }

  requireReachable(cityId: string): { city: City; distanceMeters: number } {
    const city = this.repository.getCities().find((candidate) => candidate.id === cityId);
    if (!city) {
      throw new DomainError('CITY_NOT_FOUND', 'Die angeforderte Stadt existiert nicht.', 404, { cityId });
    }

    const position = this.repository.getFleet().position;
    const distanceMeters = distanceInMeters(position, city.position);
    if (distanceMeters > city.radiusMeters + 0.001) {
      throw new DomainError('CITY_OUT_OF_RANGE', 'Die Stadt ist nicht in Reichweite der Flotte.', 403, {
        cityId,
        distanceMeters: Math.round(distanceMeters),
        radiusMeters: city.radiusMeters,
      });
    }

    return { city, distanceMeters: Math.round(distanceMeters) };
  }
}
