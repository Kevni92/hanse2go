import type { City, Fleet, GameState, Good, Player, Position } from '@hanse2go/shared';
import { createAlphaConfig, type AlphaConfig } from './config.js';

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
export class InMemoryGameRepository implements GameRepository {
  private state: GameState;
  constructor(private readonly config: AlphaConfig = createAlphaConfig()) { this.state = this.createInitialState(); }
  private createInitialState(): GameState { return { player: { ...clone(this.config.player), activeFleetId: this.config.fleet.id }, fleet: { ...clone(this.config.fleet), cargo: {} }, goods: clone(this.config.goods), cities: clone(this.config.cities) }; }
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
