import type { Building, BuildingCatalogEntry, BuildingOffer, BuildingRequirement, CityBuildingsOverview, GameState, TransferDirection, WorkforcePriority } from '@hanse2go/shared';
import { CityAccessService, DomainError } from './city-access.js';
import type { GameRepository } from './game-state.js';
import type { BuildingCatalog } from './production.js';
import { ReputationService } from './reputation.js';
import { account, payCityFromPlayer, PLAYER_ACCOUNT } from './money.js';

interface TransferInput { goodId: string; quantity: number; direction: TransferDirection }

export class BuildingService {
  constructor(
    private readonly repository: GameRepository,
    private readonly cityAccess: CityAccessService,
    private readonly reputation: ReputationService,
    private readonly catalog: BuildingCatalog,
  ) {}

  getOverview(cityId: string): CityBuildingsOverview {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => this.overview(state, cityId));
  }

  buyConcession(cityId: string): CityBuildingsOverview {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      if (state.concessions.includes(cityId)) throw new DomainError('CONCESSION_ALREADY_OWNED', 'Für diese Stadt besteht bereits eine Baukonzession.', 409);
      const { price, requiredReputation } = this.catalog.concession;
      const reputation = this.reputation.get(state, cityId);
      if (reputation.value < requiredReputation) throw new DomainError('REPUTATION_TOO_LOW', `Für die Baukonzession sind ${requiredReputation} Ruf nötig.`, 409, { reputation: reputation.value, required: requiredReputation });
      if (state.player.gold < price) throw new DomainError('INSUFFICIENT_GOLD', 'Es ist nicht genug Gold für die Baukonzession vorhanden.', 409, { gold: state.player.gold, required: price });
      if (account(state, PLAYER_ACCOUNT(state.player.id)).availableMoney < price * 100) throw new DomainError('INSUFFICIENT_GOLD', 'Nicht genug verfÃ¼gbares Gold.', 409, { gold: state.player.gold, required: price });
      payCityFromPlayer(state, cityId, price, 'concession_fee', 'concession', cityId, `concession-${cityId}-${state.world.tickNumber}`);
      state.concessions.push(cityId);
      return this.overview(state, cityId);
    });
  }

  build(cityId: string, buildingType: string): CityBuildingsOverview {
    // Prüfreihenfolge aus `docs/alpha-2/buildings-and-construction.md`.
    const entry = this.catalog.find(buildingType);
    if (!entry) throw new DomainError('UNKNOWN_BUILDING_TYPE', 'Dieser Gebäudetyp ist nicht im Katalog enthalten.', 404, { buildingType });
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      if (!state.concessions.includes(cityId)) throw new DomainError('CONCESSION_REQUIRED', 'Ohne Baukonzession kann in dieser Stadt nicht gebaut werden.', 409);
      const kontorExists = this.hasKontor(state, cityId);
      if (entry.buildingType === this.catalog.kontorType && kontorExists) throw new DomainError('KONTOR_ALREADY_EXISTS', 'In dieser Stadt besteht bereits ein eigenes Kontor.', 409);
      if (entry.buildingType !== this.catalog.kontorType && !kontorExists) throw new DomainError('KONTOR_REQUIRED', 'Produktionsgebäude setzen ein eigenes Kontor in dieser Stadt voraus.', 409);
      if (state.player.gold < entry.cost.totalGold) throw new DomainError('INSUFFICIENT_GOLD', 'Grundstücks- und Baukosten sind nicht vollständig vorhanden.', 409, { gold: state.player.gold, required: entry.cost.totalGold });
      const missingMaterials = this.missingMaterials(state, entry);
      if (Object.keys(missingMaterials).length) throw new DomainError('INSUFFICIENT_BUILD_MATERIALS', 'Im Laderaum der Flotte fehlen Baumaterialien.', 409, { missingMaterials });

      if (account(state, PLAYER_ACCOUNT(state.player.id)).availableMoney < entry.cost.totalGold * 100) throw new DomainError('INSUFFICIENT_GOLD', 'Nicht genug verfÃ¼gbares Gold.', 409, { gold: state.player.gold, required: entry.cost.totalGold });
      const buildReference = `${cityId}-${entry.buildingType}-${state.buildings.length + 1}`;
      if (entry.cost.landGold > 0) payCityFromPlayer(state, cityId, entry.cost.landGold, 'land_purchase_fee', 'building', buildReference, `land-${buildReference}`);
      if (entry.cost.buildGold > 0) payCityFromPlayer(state, cityId, entry.cost.buildGold, 'building_construction_fee', 'building', buildReference, `build-${buildReference}`);
      for (const [goodId, amount] of Object.entries(entry.cost.materials)) {
        state.fleet.cargo[goodId] = (state.fleet.cargo[goodId] ?? 0) - amount;
        if (state.fleet.cargo[goodId] === 0) delete state.fleet.cargo[goodId];
      }
      const instance: Building = {
        id: `${cityId}-${entry.buildingType}-${state.buildings.filter((building) => building.cityId === cityId && building.buildingType === entry.buildingType).length + 1}`,
        playerId: state.player.id, cityId, buildingType: entry.buildingType, kind: entry.kind, buildingClass: entry.buildingClass, workforceClass: entry.workforceClass, workforcePriority: entry.workforceClass ? 'normal' : undefined,
        status: 'built', lastInputs: {}, lastOutputs: {},
      };
      state.buildings.push(instance);
      if (entry.buildingType === this.catalog.kontorType) {
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
        const warehouse = state.kontorWarehouses[cityId]![input.goodId]!;
        warehouse.availableUnits += input.quantity * 100;
        warehouse.totalUnits += input.quantity * 100;
        warehouse.inventoryVersion += 1;
      } else {
        if (kontorStock < input.quantity) throw new DomainError('INSUFFICIENT_KONTOR_GOODS', 'Das Kontor besitzt nicht genug von dieser Ware.', 409, { available: kontorStock });
        const freeCapacity = state.fleet.capacity - Object.values(state.fleet.cargo).reduce((total, amount) => total + amount, 0);
        if (freeCapacity < input.quantity) throw new DomainError('INSUFFICIENT_FLEET_CAPACITY', 'Der freie Laderaum der Flotte reicht nicht aus.', 409, { freeCapacity });
        const warehouse = state.kontorWarehouses[cityId]![input.goodId]!;
        if (warehouse.availableUnits < input.quantity * 100) throw new DomainError('INSUFFICIENT_KONTOR_GOODS', 'Das Kontor besitzt nicht genug frei verfÃ¼gbare Ware.', 409, { available: Math.floor(warehouse.availableUnits / 100) });
        store[input.goodId] = kontorStock - input.quantity;
        if (store[input.goodId] === 0) delete store[input.goodId];
        state.fleet.cargo[input.goodId] = fleetStock + input.quantity;
        warehouse.availableUnits -= input.quantity * 100;
        warehouse.totalUnits -= input.quantity * 100;
        warehouse.inventoryVersion += 1;
      }
      return this.overview(state, cityId);
    });
  }

  setPriority(cityId: string, buildingId: string, priority: WorkforcePriority): CityBuildingsOverview {
    this.cityAccess.requireReachable(cityId, 'CITY_NOT_REACHABLE');
    return this.repository.runTransaction((state) => {
      const building = state.buildings.find((candidate) => candidate.id === buildingId && candidate.cityId === cityId);
      if (!building) throw new DomainError('BUILDING_NOT_FOUND', 'Das Gebäude existiert nicht.', 404);
      if (building.playerId !== state.player.id) throw new DomainError('BUILDING_NOT_OWNED', 'Das Gebäude gehört nicht diesem Spieler.', 403);
      if (!building.workforceClass) throw new DomainError('BUILDING_HAS_NO_WORKFORCE', 'Dieses Gebäude benötigt keine Arbeiter.', 409);
      building.workforcePriority = priority;
      return this.overview(state, cityId);
    });
  }

  hasKontor(state: GameState, cityId: string): boolean {
    return state.buildings.some((building) => building.cityId === cityId && building.playerId === state.player.id && building.buildingType === this.catalog.kontorType);
  }

  private overview(state: GameState, cityId: string): CityBuildingsOverview {
    const hasConcession = state.concessions.includes(cityId);
    const kontorBuilt = this.hasKontor(state, cityId);
    return {
      cityId,
      reputation: this.reputation.get(state, cityId),
      hasConcession, concessionPrice: this.catalog.concession.price, hasKontor: kontorBuilt,
      kontorInventory: kontorBuilt ? { ...(state.kontors[cityId] ?? {}) } : {},
      kontor: this.offer(state, this.catalog.kontor, hasConcession, kontorBuilt),
      buildings: structuredClone(state.buildings.filter((building) => building.cityId === cityId && building.playerId === state.player.id)),
      catalog: [...this.catalog.production, this.catalog.housing].map((entry) => this.offer(state, entry, hasConcession, kontorBuilt)),
      world: { ...state.world }, player: { ...state.player }, fleet: structuredClone(state.fleet),
    };
  }

  private offer(state: GameState, entry: BuildingCatalogEntry, hasConcession: boolean, kontorBuilt: boolean): BuildingOffer {
    const missingRequirements: BuildingRequirement[] = [];
    if (!hasConcession) missingRequirements.push('concession');
    if (entry.buildingType === this.catalog.kontorType) { if (kontorBuilt) missingRequirements.push('kontor_already_exists'); }
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
