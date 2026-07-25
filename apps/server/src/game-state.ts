import type { City, Fleet, GameState, Good, Player } from '@hanse2go/shared';
import { createAlphaConfig, type AlphaConfig } from './config.js';

export interface GameRepository { getState(): GameState; getPlayer(): Player; getFleet(): Fleet; getGoods(): Good[]; getCities(): City[] }
const clone = <T>(value: T): T => structuredClone(value);
export class InMemoryGameRepository implements GameRepository {
  private readonly state: GameState;
  constructor(config: AlphaConfig = createAlphaConfig()) { this.state = { player: { ...clone(config.player), activeFleetId: config.fleet.id }, fleet: { ...clone(config.fleet), cargo: {} }, goods: clone(config.goods), cities: clone(config.cities) }; }
  getState = (): GameState => clone(this.state);
  getPlayer = (): Player => clone(this.state.player);
  getFleet = (): Fleet => clone(this.state.fleet);
  getGoods = (): Good[] => clone(this.state.goods);
  getCities = (): City[] => clone(this.state.cities);
}
