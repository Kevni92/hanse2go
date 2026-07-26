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
    const goods: Good[] = this.config.goods.map(({ id, name, category, basePrice, targetStock }) => ({ id, name, category, basePrice, targetStock }));
    const cities: City[] = this.config.cities.map((city) => ({
      id: city.id, name: city.name, position: { ...city.position, recordedAt: world.startTimestamp }, radiusMeters: city.radiusMeters,
      population: city.population, prosperity: city.prosperity, popularity: city.popularity, hasKontor: false,
      productionFocus: [...city.productionFocus], stock: { ...city.stock },
    }));
    const startStatus = reputationStatus(this.config.reputation, 0);
    const reputations: Reputation[] = cities.map((city) => ({ cityId: city.id, value: 0, status: startStatus }));
    return {
      player: { id: player.id, name: player.name, gold: player.startingGold, activeFleetId: fleet.id },
      fleet: { id: fleet.id, capacity: fleet.capacity, cargo: {}, position: { ...fleet.startPosition, recordedAt: world.startTimestamp } },
      goods, cities,
      world: { tickNumber: 0, simulatedHour: 0 }, reputations, concessions: [], buildings: [], kontors: {},
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
