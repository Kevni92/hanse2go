import { loadGameConfig, type GameConfig } from '@hanse2go/config';
import type { City, Fleet, GameState, Good, Player, Position, Reputation } from '@hanse2go/shared';
import { reputationStatus } from './reputation.js';

export interface GameRepository {
  getState(): GameState;
  getPlayer(): Player;
  getFleet(): Fleet;
  getGoods(): Good[];
  getCities(): City[];
  reset(): void;
  setFleetPosition(position: Position): Fleet;
  runTransaction<T>(operation: (state: GameState) => T): T;
}
const clone = <T>(value: T): T => structuredClone(value);

/** Der deterministische Startzustand entsteht ausschließlich aus der zentralen Spielkonfiguration. */
export class InMemoryGameRepository implements GameRepository {
  private state: GameState;
  constructor(private readonly config: GameConfig = loadGameConfig()) { this.state = this.createInitialState(); }
  private createInitialState(): GameState {
    const { world, player, fleet } = this.config;
    const goods: Good[] = this.config.goods.map(({ id, category, basePrice, targetStock }) => ({ id, category, basePrice, targetStock }));
    const cities: City[] = this.config.cities.map((city) => ({
      id: city.id, position: { ...city.position, recordedAt: world.startTimestamp }, radiusMeters: city.radiusMeters,
      population: city.population, prosperity: city.prosperity, popularity: city.popularity, hasKontor: false,
      productionFocus: [...city.productionFocus], stock: { ...city.stock },
    }));
    const startStatus = reputationStatus(this.config.reputation, 0);
    const reputations: Reputation[] = cities.map((city) => ({ cityId: city.id, value: 0, status: startStatus }));
    const cityEconomies = Object.fromEntries(cities.map((city) => {
      const alpha3 = this.config.alpha3.cities[city.id]!;
      return [city.id, { baseHousing: alpha3.baseHousing, wealth: alpha3.wealth, consumptionRemainders: {}, productionRemainders: {}, wealthRemainder: 0, growthRemainder: 0 }];
    }));
    return {
      player: { id: player.id, name: player.name, gold: player.startingGold, activeFleetId: fleet.id },
      fleet: { id: fleet.id, capacity: fleet.capacity, cargo: {}, position: { ...fleet.startPosition, recordedAt: world.startTimestamp } },
      fleets: [{ fleetId: fleet.id, ownerId: player.id, customName: 'Möwe-Flotte', status: 'active', shipIds: ['ship-player-alpha-01'], position: { ...fleet.startPosition, recordedAt: world.startTimestamp }, cargoByGood: {}, createdAtTick: 0, fleetVersion: 1 }],
      ships: [
        { shipId: 'ship-player-alpha-01', shipTypeId: 'pinnace', customName: 'Möwe', ownerType: 'player', ownerId: player.id, locationType: 'fleet', fleetId: fleet.id, createdAtTick: 0, originType: 'world_seed', originCityId: 'lambrecht', shipVersion: 1 },
        { shipId: 'ship-market-lambrecht-01', shipTypeId: 'schnigge', customName: 'Waldwind', ownerType: 'system', ownerId: 'system-broker', locationType: 'port', portCityId: 'lambrecht', createdAtTick: 0, originType: 'world_seed', originCityId: 'lambrecht', shipVersion: 1 },
        { shipId: 'ship-market-neustadt-01', shipTypeId: 'pinnace', customName: 'Rebenläufer', ownerType: 'system', ownerId: 'system-broker', locationType: 'port', portCityId: 'neustadt', createdAtTick: 0, originType: 'world_seed', originCityId: 'neustadt', shipVersion: 1 },
        { shipId: 'ship-market-neustadt-02', shipTypeId: 'fluyt', customName: 'Haardtstern', ownerType: 'system', ownerId: 'system-broker', locationType: 'port', portCityId: 'neustadt', createdAtTick: 0, originType: 'world_seed', originCityId: 'neustadt', shipVersion: 1 },
        { shipId: 'ship-market-mannheim-01', shipTypeId: 'fluyt', customName: 'Rheingold', ownerType: 'system', ownerId: 'system-broker', locationType: 'port', portCityId: 'mannheim', createdAtTick: 0, originType: 'world_seed', originCityId: 'mannheim', shipVersion: 1 },
        { shipId: 'ship-market-mannheim-02', shipTypeId: 'caravel', customName: 'Kurpfalz', ownerType: 'system', ownerId: 'system-broker', locationType: 'port', portCityId: 'mannheim', createdAtTick: 0, originType: 'world_seed', originCityId: 'mannheim', shipVersion: 1 },
      ],
      shipyards: cities.map((city) => ({ cityId: city.id, shipyardVersion: 1, queuedBuildOrderIds: [] })), shipBuildOrders: [], shipMarketVersions: Object.fromEntries(cities.map((city) => [city.id, 1])),
      goods, cities,
      cityEconomies, world: { tickNumber: 0, simulatedHour: 0 }, reputations, concessions: [...player.startingConcessions], buildings: [], kontors: {},
    };
  }
  getState = (): GameState => clone(this.state);
  getPlayer = (): Player => clone(this.state.player);
  getFleet = (): Fleet => clone(this.state.fleet);
  getGoods = (): Good[] => clone(this.state.goods);
  getCities = (): City[] => clone(this.state.cities);
  reset = (): void => { this.state = this.createInitialState(); };
  setFleetPosition = (position: Position): Fleet => {
    this.state.fleet.position = clone(position);
    return this.getFleet();
  };
  runTransaction = <T>(operation: (state: GameState) => T): T => operation(this.state);
}
