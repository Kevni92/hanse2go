import { describe, expect, it } from 'vitest';
import { loadGameConfig } from '@hanse2go/config';
import { InMemoryGameRepository } from '../src/game-state.js';

describe('Alpha 5 economic foundation', () => {
  it('initializes the seven covered accounts and exact money supply', () => {
    const repository = new InMemoryGameRepository();
    const state = repository.getState();

    expect(state.moneySupply).toBe(170_717_000);
    expect(state.accounts['player:player-alpha']).toMatchObject({ availableMoney: 10_000_000, reservedMoney: 0, totalMoney: 10_000_000 });
    expect(state.accounts['city:lambrecht']).toMatchObject({ availableMoney: 20_490_000, totalMoney: 20_490_000 });
    expect(state.accounts['population:mannheim']).toMatchObject({ availableMoney: 48_960_000, totalMoney: 48_960_000 });
    expect(Object.keys(state.accounts)).toHaveLength(7);
  });

  it('migrates every configured city stock into hundredth-ton warehouse units', () => {
    const repository = new InMemoryGameRepository();
    const state = repository.getState();
    const config = loadGameConfig();

    for (const city of config.cities) {
      for (const good of config.goods) {
        const warehouse = state.cityWarehouses[city.id]![good.id]!;
        expect(warehouse).toMatchObject({ availableUnits: city.stock[good.id]! * 100, reservedUnits: 0, totalUnits: city.stock[good.id]! * 100 });
      }
    }
  });

  it('does not commit a failed transaction', () => {
    const repository = new InMemoryGameRepository();
    const before = repository.getState();

    expect(() => repository.runTransaction((state) => {
      state.accounts['player:player-alpha']!.availableMoney = -1;
      throw new Error('synthetic rollback');
    })).toThrow('synthetic rollback');

    expect(repository.getState()).toEqual(before);
  });
});
