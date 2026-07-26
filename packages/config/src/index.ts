import rawGameConfig from '../game-config.json' with { type: 'json' };
import type { Locale } from './locale.js';
import type { GameConfig } from './types.js';

export type * from './types.js';
export type { Locale, LocaleCode } from './locale.js';

/**
 * Lädt die zentrale Spielkonfiguration. Alle statischen Spieleigenschaften stehen ausschließlich
 * in `game-config.json`; rechnende Module erhalten sie von außen und kennen keine eigenen Werte.
 * Jeder Aufruf liefert eine eigene Kopie, damit kein Verbraucher die Quelle verändern kann.
 */
export function loadGameConfig(): GameConfig {
  // Die JSON-Datei ist Datenquelle, kein Typ: die Struktur bestätigt ausschließlich `validateGameConfig`.
  const config = structuredClone(rawGameConfig) as unknown as GameConfig;
  validateGameConfig(config);
  return config;
}

/** Prüft die Konfiguration strukturell; ein Verstoß verhindert den Serverstart. */
export function validateGameConfig(config: GameConfig): void {
  const goodIds = uniqueIds(config.goods.map((good) => good.id), 'Ware');
  const requireGood = (goodId: string, origin: string) => {
    if (!goodIds.has(goodId)) throw new ConfigError(`${origin} verweist auf die unbekannte Ware "${goodId}".`);
  };

  if (!config.world.startTimestamp || Number.isNaN(Date.parse(config.world.startTimestamp))) {
    throw new ConfigError('Der Startzeitstempel der Welt ist kein gültiger Zeitpunkt.');
  }
  if (!config.player.id || !Number.isInteger(config.player.startingGold) || config.player.startingGold < 0) {
    throw new ConfigError('Das Startgold des Spielers muss eine ganze Zahl ab null sein.');
  }
  if (!config.fleet.id || !Number.isInteger(config.fleet.capacity) || config.fleet.capacity <= 0) {
    throw new ConfigError('Der Laderaum der Startflotte muss eine positive ganze Zahl sein.');
  }
  requirePoint(config.fleet.startPosition, 'Die Startposition der Flotte');

  const { minimumPriceFactor, maximumPriceFactor, buySpread, sellSpread } = config.market;
  if (!(minimumPriceFactor > 0) || !(maximumPriceFactor >= minimumPriceFactor)) {
    throw new ConfigError('Die Preisfaktorgrenzen müssen positiv und aufsteigend sein.');
  }
  if (!(buySpread > 0) || !(sellSpread > 0)) throw new ConfigError('Die Marktspreads müssen positiv sein.');

  const reputation = config.reputation;
  if (!Number.isInteger(reputation.minimumTradeQuantity) || reputation.minimumTradeQuantity < 1
    || !Number.isInteger(reputation.tonsPerPoint) || reputation.tonsPerPoint < 1
    || !Number.isInteger(reputation.maximumValue) || reputation.maximumValue < 1) {
    throw new ConfigError('Mindestmenge, Tonnen je Rufpunkt und Rufobergrenze müssen positive ganze Zahlen sein.');
  }
  if (!reputation.statusThresholds.length || reputation.statusThresholds[0]!.minimumValue !== 0) {
    throw new ConfigError('Die Rufstatus benötigen einen Startstatus ab Wert null.');
  }
  reputation.statusThresholds.forEach((threshold, index) => {
    const previous = reputation.statusThresholds[index - 1];
    if (previous && threshold.minimumValue <= previous.minimumValue) {
      throw new ConfigError('Die Rufstatus müssen streng aufsteigend nach Mindestwert sortiert sein.');
    }
    if (threshold.minimumValue > reputation.maximumValue) {
      throw new ConfigError(`Der Rufstatus "${threshold.status}" liegt über der Rufobergrenze.`);
    }
  });

  if (!Number.isInteger(config.consumption.populationUnit) || config.consumption.populationUnit <= 0) {
    throw new ConfigError('Die Bezugsgröße des Bevölkerungsverbrauchs muss eine positive ganze Zahl sein.');
  }
  for (const [goodId, amount] of Object.entries(config.consumption.perPopulationUnit)) {
    requireGood(goodId, 'Der Bevölkerungsverbrauch');
    requireTons(amount, `Der Bevölkerungsverbrauch von "${goodId}"`);
  }

  for (const good of config.goods) {
    if (!(good.basePrice > 0)) throw new ConfigError(`Der Basispreis der Ware "${good.id}" muss größer als null sein.`);
    if (!Number.isInteger(good.targetStock) || good.targetStock <= 0) {
      throw new ConfigError(`Der Zielbestand der Ware "${good.id}" muss eine positive ganze Zahl sein.`);
    }
  }

  uniqueIds(config.cities.map((city) => city.id), 'Stadt');
  for (const city of config.cities) {
    requirePoint(city.position, `Die Position der Stadt "${city.id}"`);
    if (!(city.radiusMeters > 0)) throw new ConfigError(`Der Interaktionsradius von "${city.id}" muss größer als null sein.`);
    if (!Number.isInteger(city.population) || city.population < 0) {
      throw new ConfigError(`Die Bevölkerung von "${city.id}" muss eine ganze Zahl ab null sein.`);
    }
    for (const goodId of goodIds) requireTons(city.stock[goodId], `Der Startbestand von "${city.id}"/"${goodId}"`);
    for (const goodId of city.productionFocus) requireGood(goodId, `Der Produktionsschwerpunkt von "${city.id}"`);
  }

  const buildings = config.buildings;
  if (!buildings.kontorType) throw new ConfigError('Der Gebäudetyp des Kontors fehlt.');
  requireGold(buildings.landPrice, 'Der Grundstückspreis');
  requireGold(buildings.concession.price, 'Der Preis der Baukonzession');
  if (!Number.isInteger(buildings.concession.requiredReputation)
    || buildings.concession.requiredReputation < 0
    || buildings.concession.requiredReputation > reputation.maximumValue) {
    throw new ConfigError('Der Ruf für die Baukonzession muss zwischen null und der Rufobergrenze liegen.');
  }
  const costs = [...Object.entries(buildings.classes), [buildings.kontorType, buildings.kontor] as const];
  for (const [name, cost] of costs) {
    requireGold(cost.gold, `Die Baukosten von "${name}"`);
    for (const [goodId, amount] of Object.entries(cost.materials)) {
      requireGood(goodId, `Das Baumaterial von "${name}"`);
      requireTons(amount, `Das Baumaterial "${goodId}" von "${name}"`);
    }
  }

  uniqueIds([buildings.kontorType, ...buildings.production.map((entry) => entry.buildingType)], 'Gebäudetyp');
  for (const entry of buildings.production) {
    if (!buildings.classes[entry.buildingClass]) {
      throw new ConfigError(`Der Gebäudetyp "${entry.buildingType}" verwendet die unbekannte Klasse "${entry.buildingClass}".`);
    }
    if (entry.kind === 'raw' && Object.keys(entry.inputs).length) {
      throw new ConfigError(`Der Rohstoffbetrieb "${entry.buildingType}" darf keine Eingangswaren besitzen.`);
    }
    if (!Object.keys(entry.outputs).length) {
      throw new ConfigError(`Der Gebäudetyp "${entry.buildingType}" benötigt mindestens eine Ausgangsware.`);
    }
    for (const [goodId, amount] of Object.entries({ ...entry.inputs, ...entry.outputs })) {
      requireGood(goodId, `Das Rezept von "${entry.buildingType}"`);
      requireTons(amount, `Die Rezeptmenge "${goodId}" von "${entry.buildingType}"`);
    }
  }
}

/** Stellt sicher, dass eine Sprachdatei jeden fachlichen Bezeichner der Konfiguration benennt. */
export function validateLocale(config: GameConfig, locale: Locale): void {
  const missing: string[] = [];
  const require = (names: Record<string, string>, id: string, group: string) => {
    if (!names[id]) missing.push(`${group}.${id}`);
  };
  for (const good of config.goods) {
    require(locale.goods, good.id, 'goods');
    require(locale.goodCategories, good.category, 'goodCategories');
  }
  for (const city of config.cities) require(locale.cities, city.id, 'cities');
  require(locale.buildings, config.buildings.kontorType, 'buildings');
  for (const entry of config.buildings.production) {
    require(locale.buildings, entry.buildingType, 'buildings');
    require(locale.buildingClasses, entry.buildingClass, 'buildingClasses');
  }
  for (const threshold of config.reputation.statusThresholds) require(locale.reputationStatuses, threshold.status, 'reputationStatuses');
  if (missing.length) throw new ConfigError(`Der Sprachdatei fehlen Anzeigenamen: ${missing.join(', ')}.`);
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(`Ungültige Spielkonfiguration: ${message}`);
    this.name = 'ConfigError';
  }
}

function uniqueIds(ids: string[], label: string): Set<string> {
  const unique = new Set<string>();
  for (const id of ids) {
    if (!id) throw new ConfigError(`Mindestens eine ${label} besitzt keine ID.`);
    if (unique.has(id)) throw new ConfigError(`Die ${label}-ID "${id}" ist mehrfach vergeben.`);
    unique.add(id);
  }
  if (!unique.size) throw new ConfigError(`Es ist keine ${label} konfiguriert.`);
  return unique;
}

function requirePoint(point: GeoPointLike, origin: string): void {
  if (!Number.isFinite(point?.longitude) || point.longitude < -180 || point.longitude > 180
    || !Number.isFinite(point?.latitude) || point.latitude < -90 || point.latitude > 90) {
    throw new ConfigError(`${origin} liegt außerhalb der WGS84-Grenzen.`);
  }
}

/** Alle Warenmengen sind ganze Tonnen ab null. */
function requireTons(amount: number | undefined, origin: string): void {
  if (!Number.isInteger(amount) || amount! < 0) throw new ConfigError(`${origin} muss eine ganze Zahl ab null sein.`);
}

function requireGold(amount: number, origin: string): void {
  if (!Number.isInteger(amount) || amount < 0) throw new ConfigError(`${origin} muss eine ganze Zahl ab null sein.`);
}

interface GeoPointLike { longitude: number; latitude: number }
