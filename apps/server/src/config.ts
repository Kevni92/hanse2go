import type { City, Good, GoodCategory, Position } from '@hanse2go/shared';

type GoodSeed = Good & { stock: [number, number, number] };
const goodRows: Array<[string, string, GoodCategory, number, number, number, number, number]> = [
  ['grain','Getreide','Nahrung',100,100,90,200,40],['flour','Mehl','Nahrung',140,80,70,110,45],['bread','Brot','Nahrung',190,80,65,95,30],['livestock','Vieh','Nahrung',180,70,60,100,45],['milk','Milch','Nahrung',120,70,60,95,50],['meat','Fleisch','Nahrung',280,60,45,65,80],['cheese','Käse','Nahrung',240,60,50,70,75],['wood','Holz','Baustoffe',80,100,200,40,50],['planks','Bretter','Baustoffe',130,80,130,45,65],['clay','Lehm','Baustoffe',70,100,45,180,65],['bricks','Ziegel','Baustoffe',120,80,30,130,55],['charcoal','Kohle','Handwerk',110,80,130,55,70],['iron','Eisen','Handwerk',180,60,45,70,55],['tools','Werkzeug','Handwerk',320,50,40,55,60],['cotton','Baumwolle','Kleidung',120,100,55,65,180],['cloth','Stoff','Kleidung',210,70,45,55,110],['clothing','Kleidung','Kleidung',360,60,25,45,85],['ceramics','Keramik','Haushaltswaren',180,60,45,90,55],['furniture','Möbel','Haushaltswaren',300,50,35,20,70],['sugarcane','Zuckerrohr','Luxuswaren',90,100,45,65,180],['sugar','Zucker','Luxuswaren',160,70,35,50,120],['rum','Rum','Luxuswaren',300,50,10,15,100],
];
const goods: GoodSeed[] = goodRows.map(([id, name, category, basePrice, targetStock, lambrecht, neustadt, mannheim]) => ({ id, name, category, basePrice, targetStock, stock: [lambrecht, neustadt, mannheim] }));

const initialPosition: Position = { longitude: 8.04, latitude: 49.4, recordedAt: '2026-01-01T00:00:00.000Z' };
const citySeeds: Array<[string, string, number, number, number, number, string[]]> = [
  ['lambrecht','Lambrecht',8.07,49.37,1000,24,['Holz','Bretter','Kohle']],
  ['neustadt','Neustadt',8.14,49.4,2500,38,['Getreide','Lehm','Ziegel']],
  ['mannheim','Mannheim',8.23,49.44,5000,65,['Baumwolle','Zucker','Rum']],
];

export interface AlphaConfig { goods: Good[]; cities: City[]; player: { id: string; name: string; gold: number }; fleet: { id: string; capacity: number; position: Position } }
export function createAlphaConfig(): AlphaConfig {
  const result: AlphaConfig = {
    goods: goods.map((good) => ({ id: good.id, name: good.name, category: good.category, basePrice: good.basePrice, targetStock: good.targetStock })),
    cities: citySeeds.map(([id, name, longitude, latitude, population, prosperity, productionFocus], index) => ({ id, name, position: { longitude, latitude, recordedAt: initialPosition.recordedAt }, radiusMeters: 800, population, prosperity, popularity: 10, hasKontor: false, productionFocus: [...productionFocus], stock: goods.reduce<Record<string, number>>((stock, good) => { stock[good.id] = good.stock[index]!; return stock; }, {}) })),
    // Alpha 2 ersetzt die Alpha-1-Startwerte: 100.000 Gold und 150 Tonnen Laderaum, damit Konzession,
    // Kontor und Produktionsgebäude aus Goldbeutel und Flottenladeraum bezahlt werden können.
    player: { id: 'player-alpha', name: 'Testkapitän', gold: 100_000 }, fleet: { id: 'fleet-alpha', capacity: 150, position: { ...initialPosition } },
  };
  validateAlphaConfig(result);
  return result;
}
export function validateAlphaConfig(config: AlphaConfig): void {
  if (config.goods.length !== 22 || new Set(config.goods.map(({ id }) => id)).size !== 22) throw new Error('Alpha-Konfiguration benötigt 22 eindeutige Waren.');
  if (config.cities.length !== 3 || new Set(config.cities.map(({ id }) => id)).size !== 3) throw new Error('Alpha-Konfiguration benötigt drei eindeutige Städte.');
  for (const good of config.goods) if (!good.id || good.basePrice <= 0 || good.targetStock <= 0) throw new Error(`Ungültige Warenkonfiguration: ${good.id}.`);
  for (const city of config.cities) for (const good of config.goods) if (!Number.isInteger(city.stock[good.id]) || city.stock[good.id]! < 0) throw new Error(`Ungültiger Startbestand für ${city.id}/${good.id}.`);
  if (config.player.gold < 0 || config.fleet.capacity <= 0) throw new Error('Ungültige Spieler- oder Flottenkonfiguration.');
}
