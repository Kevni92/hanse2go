import type { Alpha4Config } from '@hanse2go/config';
import type { ManagedFleet, Ship } from '@hanse2go/shared';
import { CityAccessService, DomainError } from './city-access.js';
import type { GameRepository } from './game-state.js';

export class HarborService {
  constructor(private readonly repository: GameRepository, private readonly cityAccess: CityAccessService, private readonly alpha4: Alpha4Config) {}

  fleets() { return this.repository.getState().fleets; }
  overview(cityId: string) {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => this.stateFor(state, cityId));
  }
  buy(cityId: string, shipId: string, expectedVersion: number) {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      if (state.shipMarketVersions[cityId] !== expectedVersion) throw new DomainError('SHIP_MARKET_VERSION_CONFLICT', 'Das Hafenangebot wurde aktualisiert.', 409);
      const ship = state.ships.find((entry) => entry.shipId === shipId);
      if (!ship) throw new DomainError('SHIP_NOT_FOUND', 'Das Schiff wurde nicht gefunden.', 404);
      if (ship.ownerType !== 'system' || ship.portCityId !== cityId) throw new DomainError('SHIP_NOT_FOR_SALE', 'Das Schiff steht nicht mehr zum Kauf.', 409);
      const type = this.type(ship);
      if (state.player.gold < type.purchasePrice) throw new DomainError('INSUFFICIENT_GOLD', 'Es ist nicht genug Gold vorhanden.', 409);
      state.player.gold -= type.purchasePrice; ship.ownerType = 'player'; ship.ownerId = state.player.id; ship.shipVersion += 1; state.shipMarketVersions[cityId] += 1;
      return this.stateFor(state, cityId);
    });
  }
  renameShip(shipId: string, customName: string) {
    const name = validName(customName, 'INVALID_SHIP_NAME');
    return this.repository.runTransaction((state) => {
      const ship = state.ships.find((entry) => entry.shipId === shipId);
      if (!ship) throw new DomainError('SHIP_NOT_FOUND', 'Das Schiff wurde nicht gefunden.', 404);
      if (ship.ownerId !== state.player.id) throw new DomainError('SHIP_NOT_OWNED', 'Das Schiff gehört dir nicht.', 403);
      ship.customName = name; ship.shipVersion += 1; return ship;
    });
  }
  createFleet(cityId: string, shipId: string, customName?: string) {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      const ship = this.ownPortShip(state.ships, state.player.id, cityId, shipId);
      const fleetId = `fleet-${state.fleets.length + 1}`;
      const fleet: ManagedFleet = { fleetId, ownerId: state.player.id, customName: customName ? validName(customName, 'INVALID_FLEET_NAME') : `Fleet ${fleetId.slice(-6)}`, status: 'in_port', portCityId: cityId, shipIds: [shipId], cargoByGood: {}, createdAtTick: state.world.tickNumber, fleetVersion: 1 };
      ship.locationType = 'fleet'; ship.fleetId = fleetId; delete ship.portCityId; ship.shipVersion += 1; state.fleets.push(fleet); return this.stateFor(state, cityId);
    });
  }
  private stateFor(state: ReturnType<GameRepository['getState']>, cityId: string) {
    const local = state.fleets.filter((fleet) => fleet.status === 'in_port' && fleet.portCityId === cityId);
    const active = state.fleets.find((fleet) => fleet.status === 'active');
    return { player: state.player, activeFleetId: state.player.activeFleetId, activeFleet: active, fleets: local, ships: state.ships.filter((ship) => ship.locationType === 'port' && ship.portCityId === cityId), marketVersion: state.shipMarketVersions[cityId], shipyard: state.shipyards.find((entry) => entry.cityId === cityId), shipTypes: this.alpha4.shipTypes, kontorInventory: state.kontors[cityId] ?? {} };
  }
  private type(ship: Ship) { const type = this.alpha4.shipTypes.find((entry) => entry.id === ship.shipTypeId); if (!type) throw new DomainError('SHIP_NOT_FOUND', 'Der Schiffstyp wurde nicht gefunden.', 404); return type; }
  private ownPortShip(ships: Ship[], ownerId: string, cityId: string, shipId: string) { const ship = ships.find((entry) => entry.shipId === shipId); if (!ship) throw new DomainError('SHIP_NOT_FOUND', 'Das Schiff wurde nicht gefunden.', 404); if (ship.ownerId !== ownerId) throw new DomainError('SHIP_NOT_OWNED', 'Das Schiff gehört dir nicht.', 403); if (ship.locationType !== 'port' || ship.portCityId !== cityId) throw new DomainError('SHIP_NOT_FOR_SALE', 'Das Schiff liegt nicht im Hafen.', 409); return ship; }
}

function validName(name: string, code: 'INVALID_SHIP_NAME' | 'INVALID_FLEET_NAME') { const trimmed = name.trim(); if (trimmed.length < 1 || trimmed.length > 40 || [...trimmed].some((character) => character.codePointAt(0)! < 32)) throw new DomainError(code, 'Der Name ist ungültig.', 400); return trimmed; }
