import type { Building, BuildingCatalogEntry, BuildingOffer, BuildingRequirement, CityBuildingsOverview, GameState, TransferDirection } from '@hanse2go/shared';
import { CityAccessService, DomainError } from './city-access.js';
import type { GameRepository } from './game-state.js';
import { CONCESSION_PRICE, CONCESSION_REPUTATION, KONTOR_TYPE, findBuildingType, kontorEntry, productionCatalog } from './production.js';
import { ReputationService } from './reputation.js';

interface TransferInput { goodId: string; quantity: number; direction: TransferDirection }

export class BuildingService {
  constructor(private readonly repository: GameRepository, private readonly cityAccess: CityAccessService, private readonly reputation: ReputationService) {}

  getOverview(cityId: string): CityBuildingsOverview {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => this.overview(state, cityId));
  }

  buyConcession(cityId: string): CityBuildingsOverview {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      if (state.concessions.includes(cityId)) throw new DomainError('CONCESSION_ALREADY_OWNED', 'Für diese Stadt besteht bereits eine Baukonzession.', 409);
      const reputation = this.reputation.get(state, cityId);
      if (reputation.value < CONCESSION_REPUTATION) throw new DomainError('REPUTATION_TOO_LOW', `Für die Baukonzession sind ${CONCESSION_REPUTATION} Ruf nötig.`, 409, { reputation: reputation.value, required: CONCESSION_REPUTATION });
      if (state.player.gold < CONCESSION_PRICE) throw new DomainError('INSUFFICIENT_GOLD', 'Es ist nicht genug Gold für die Baukonzession vorhanden.', 409, { gold: state.player.gold, required: CONCESSION_PRICE });
      state.player.gold -= CONCESSION_PRICE;
      state.concessions.push(cityId);
      return this.overview(state, cityId);
    });
  }

  build(cityId: string, buildingType: string): CityBuildingsOverview {
    // Prüfreihenfolge aus `docs/alpha-2/buildings-and-construction.md`.
    const entry = findBuildingType(buildingType);
    if (!entry) throw new DomainError('UNKNOWN_BUILDING_TYPE', 'Dieser Gebäudetyp ist nicht im Katalog enthalten.', 404, { buildingType });
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      if (!state.concessions.includes(cityId)) throw new DomainError('CONCESSION_REQUIRED', 'Ohne Baukonzession kann in dieser Stadt nicht gebaut werden.', 409);
      const kontorExists = this.hasKontor(state, cityId);
      if (entry.buildingType === KONTOR_TYPE && kontorExists) throw new DomainError('KONTOR_ALREADY_EXISTS', 'In dieser Stadt besteht bereits ein eigenes Kontor.', 409);
      if (entry.buildingType !== KONTOR_TYPE && !kontorExists) throw new DomainError('KONTOR_REQUIRED', 'Produktionsgebäude setzen ein eigenes Kontor in dieser Stadt voraus.', 409);
      if (state.player.gold < entry.cost.totalGold) throw new DomainError('INSUFFICIENT_GOLD', 'Grundstücks- und Baukosten sind nicht vollständig vorhanden.', 409, { gold: state.player.gold, required: entry.cost.totalGold });
      const missingMaterials = this.missingMaterials(state, entry);
      if (Object.keys(missingMaterials).length) throw new DomainError('INSUFFICIENT_BUILD_MATERIALS', 'Im Laderaum der Flotte fehlen Baumaterialien.', 409, { missingMaterials });

      state.player.gold -= entry.cost.totalGold;
      for (const [goodId, amount] of Object.entries(entry.cost.materials)) {
        state.fleet.cargo[goodId] = (state.fleet.cargo[goodId] ?? 0) - amount;
        if (state.fleet.cargo[goodId] === 0) delete state.fleet.cargo[goodId];
      }
      const instance: Building = {
        id: `${cityId}-${entry.buildingType}-${state.buildings.filter((building) => building.cityId === cityId && building.buildingType === entry.buildingType).length + 1}`,
        playerId: state.player.id, cityId, buildingType: entry.buildingType, name: entry.name, kind: entry.kind, buildingClass: entry.buildingClass,
        status: 'built', lastInputs: {}, lastOutputs: {},
      };
      state.buildings.push(instance);
      if (entry.buildingType === KONTOR_TYPE) {
        state.kontors[cityId] ??= {};
        // Der Alpha-1-Stadtwert `Kontor` zeigt ab Alpha 2 das eigene Kontor des Spielers.
        const city = state.cities.find((candidate) => candidate.id === cityId);
        if (city) city.hasKontor = true;
      }
      return this.overview(state, cityId);
    });
  }

  transfer(cityId: string, input: TransferInput): CityBuildingsOverview {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      if (!this.hasKontor(state, cityId)) throw new DomainError('KONTOR_REQUIRED', 'In dieser Stadt besteht kein eigenes Kontor.', 409);
      if (!Number.isInteger(input.quantity) || input.quantity < 1) throw new DomainError('INVALID_TRANSFER_QUANTITY', 'Die Transfermenge muss eine positive ganze Zahl sein.', 400);
      if (!state.goods.some((good) => good.id === input.goodId)) throw new DomainError('GOOD_NOT_FOUND', 'Die angeforderte Ware existiert nicht.', 404, { goodId: input.goodId });
      const store = (state.kontors[cityId] ??= {});
      const fleetStock = state.fleet.cargo[input.goodId] ?? 0;
      const kontorStock = store[input.goodId] ?? 0;
      if (input.direction === 'store') {
        if (fleetStock < input.quantity) throw new DomainError('INSUFFICIENT_FLEET_GOODS', 'Die Flotte besitzt nicht genug von dieser Ware.', 409, { available: fleetStock });
        state.fleet.cargo[input.goodId] = fleetStock - input.quantity;
        if (state.fleet.cargo[input.goodId] === 0) delete state.fleet.cargo[input.goodId];
        store[input.goodId] = kontorStock + input.quantity;
      } else {
        if (kontorStock < input.quantity) throw new DomainError('INSUFFICIENT_KONTOR_GOODS', 'Das Kontor besitzt nicht genug von dieser Ware.', 409, { available: kontorStock });
        const freeCapacity = state.fleet.capacity - Object.values(state.fleet.cargo).reduce((total, amount) => total + amount, 0);
        if (freeCapacity < input.quantity) throw new DomainError('INSUFFICIENT_FLEET_CAPACITY', 'Der freie Laderaum der Flotte reicht nicht aus.', 409, { freeCapacity });
        store[input.goodId] = kontorStock - input.quantity;
        if (store[input.goodId] === 0) delete store[input.goodId];
        state.fleet.cargo[input.goodId] = fleetStock + input.quantity;
      }
      return this.overview(state, cityId);
    });
  }

  hasKontor(state: GameState, cityId: string): boolean {
    return state.buildings.some((building) => building.cityId === cityId && building.playerId === state.player.id && building.buildingType === KONTOR_TYPE);
  }

  private overview(state: GameState, cityId: string): CityBuildingsOverview {
    const hasConcession = state.concessions.includes(cityId);
    const kontorBuilt = this.hasKontor(state, cityId);
    return {
      cityId,
      reputation: this.reputation.get(state, cityId),
      hasConcession, concessionPrice: CONCESSION_PRICE, hasKontor: kontorBuilt,
      kontorInventory: kontorBuilt ? { ...(state.kontors[cityId] ?? {}) } : {},
      kontor: this.offer(state, kontorEntry, hasConcession, kontorBuilt),
      buildings: structuredClone(state.buildings.filter((building) => building.cityId === cityId && building.playerId === state.player.id)),
      catalog: productionCatalog.map((entry) => this.offer(state, entry, hasConcession, kontorBuilt)),
      world: { ...state.world }, player: { ...state.player }, fleet: structuredClone(state.fleet),
    };
  }

  private offer(state: GameState, entry: BuildingCatalogEntry, hasConcession: boolean, kontorBuilt: boolean): BuildingOffer {
    const missingRequirements: BuildingRequirement[] = [];
    if (!hasConcession) missingRequirements.push('concession');
    if (entry.buildingType === KONTOR_TYPE) { if (kontorBuilt) missingRequirements.push('kontor_already_exists'); }
    else if (!kontorBuilt) missingRequirements.push('kontor');
    const missingGold = Math.max(0, entry.cost.totalGold - state.player.gold);
    if (missingGold > 0) missingRequirements.push('gold');
    const missingMaterials = this.missingMaterials(state, entry);
    if (Object.keys(missingMaterials).length) missingRequirements.push('materials');
    return { ...structuredClone(entry), availability: missingRequirements.length ? 'requirements_missing' : 'buildable', missingRequirements, missingGold, missingMaterials };
  }

  /** Baumaterialien stammen ausschließlich aus dem Laderaum der aktiven Flotte. */
  private missingMaterials(state: GameState, entry: BuildingCatalogEntry): Record<string, number> {
    const missing: Record<string, number> = {};
    for (const [goodId, amount] of Object.entries(entry.cost.materials)) {
      const available = state.fleet.cargo[goodId] ?? 0;
      if (available < amount) missing[goodId] = amount - available;
    }
    return missing;
  }
}
