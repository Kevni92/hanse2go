import { describe, expect, it } from 'vitest';
import { loadGameConfig } from '@hanse2go/config';
import { InMemoryGameRepository } from '../src/game-state.js';

describe('Alpha 4 initial world', () => {
  it('uses the documented ship catalog and persistent seeded ships', () => {
    const config = loadGameConfig();
    expect(config.alpha4.shipTypes.map((ship) => ship.id)).toEqual(['pinnace', 'schnigge', 'fluyt', 'caravel']);
    expect(config.alpha4.shipTypes.map((ship) => ship.capacity)).toEqual([60, 100, 250, 400]);
    const state = new InMemoryGameRepository(config).getState();
    expect(state.fleets).toHaveLength(1);
    expect(state.fleets[0]).toMatchObject({ fleetId: 'fleet-alpha', customName: 'Möwe-Flotte', shipIds: ['ship-player-alpha-01'] });
    expect(state.ships.map((ship) => ship.shipId)).toEqual([
      'ship-player-alpha-01', 'ship-market-lambrecht-01', 'ship-market-neustadt-01', 'ship-market-neustadt-02', 'ship-market-mannheim-01', 'ship-market-mannheim-02',
    ]);
    expect(state.shipyards.every((shipyard) => shipyard.shipyardVersion === 1)).toBe(true);
  });
});
