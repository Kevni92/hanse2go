import { describe, expect, it } from 'vitest';
import { ConfigError, loadGameConfig, validateGameConfig, type GameConfig } from '../src/index.js';

const base = (): GameConfig => loadGameConfig();

describe('loadGameConfig', () => {
  it('lädt die ausgelieferte Konfiguration und validiert sie', () => {
    expect(() => loadGameConfig()).not.toThrow();
  });

  it('liefert je Aufruf eine eigene Kopie', () => {
    const first = loadGameConfig();
    first.goods[0]!.basePrice = 1;
    expect(loadGameConfig().goods[0]!.basePrice).not.toBe(1);
  });

  it('enthält für jede Stadt einen Startbestand jeder Ware', () => {
    const config = base();
    for (const city of config.cities) {
      for (const good of config.goods) expect(Number.isInteger(city.stock[good.id])).toBe(true);
    }
  });

  it('beschreibt jedes Produktionsgebäude mit einer bekannten Gebäudeklasse', () => {
    const config = base();
    for (const entry of config.buildings.production) expect(config.buildings.classes[entry.buildingClass]).toBeDefined();
  });

  it('ordnet jedes Produktionsgebäude einer getrennten Alpha-3-Beschäftigungsklasse zu', () => {
    const config = base();
    for (const entry of config.buildings.production) {
      const workforce = config.alpha3.buildingWorkforce[entry.buildingType];
      expect(workforce).toBeDefined();
      expect(config.alpha3.workforce[workforce!].workers * config.alpha3.workforce[workforce!].wagePerWorker).toBe(200);
    }
  });
});

describe('validateGameConfig', () => {
  it('lehnt doppelte Waren-IDs ab', () => {
    const config = base();
    config.goods.push({ ...config.goods[0]! });
    expect(() => validateGameConfig(config)).toThrow(ConfigError);
  });

  it('lehnt einen Zielbestand von null ab', () => {
    const config = base();
    config.goods[0]!.targetStock = 0;
    expect(() => validateGameConfig(config)).toThrow(/Zielbestand/);
  });

  it('lehnt einen fehlenden Startbestand ab', () => {
    const config = base();
    delete config.cities[0]!.stock[config.goods[0]!.id];
    expect(() => validateGameConfig(config)).toThrow(/Startbestand/);
  });

  it('lehnt unbekannte Waren im Bevölkerungsverbrauch ab', () => {
    const config = base();
    config.consumption.perPopulationUnit['unbekannt'] = 1;
    expect(() => validateGameConfig(config)).toThrow(/unbekannte Ware/);
  });

  it('lehnt unbekannte Waren in einem Rezept ab', () => {
    const config = base();
    config.buildings.production[0]!.outputs = { unbekannt: 1 };
    expect(() => validateGameConfig(config)).toThrow(/unbekannte Ware/);
  });

  it('lehnt Rufstatus ohne Startwert null ab', () => {
    const config = base();
    config.reputation.statusThresholds[0]!.minimumValue = 5;
    expect(() => validateGameConfig(config)).toThrow(/Startstatus/);
  });

  it('lehnt nicht aufsteigende Rufstatus ab', () => {
    const config = base();
    config.reputation.statusThresholds[2]!.minimumValue = config.reputation.statusThresholds[1]!.minimumValue;
    expect(() => validateGameConfig(config)).toThrow(/aufsteigend/);
  });

  it('lehnt eine Preisuntergrenze über der Obergrenze ab', () => {
    const config = base();
    config.market.minimumPriceFactor = config.market.maximumPriceFactor + 1;
    expect(() => validateGameConfig(config)).toThrow(/Preisfaktorgrenzen/);
  });

  it('lehnt einen Rohstoffbetrieb mit Eingangswaren ab', () => {
    const config = base();
    const raw = config.buildings.production.find((entry) => entry.kind === 'raw')!;
    raw.inputs = { [config.goods[0]!.id]: 1 };
    expect(() => validateGameConfig(config)).toThrow(/Rohstoffbetrieb/);
  });

  it('lehnt einen doppelt vergebenen Gebäudetyp ab', () => {
    const config = base();
    config.buildings.production.push({ ...config.buildings.production[0]! });
    expect(() => validateGameConfig(config)).toThrow(/Gebäudetyp-ID/);
  });

  it('lehnt einen Konzessionsruf über der Rufobergrenze ab', () => {
    const config = base();
    config.buildings.concession.requiredReputation = config.reputation.maximumValue + 1;
    expect(() => validateGameConfig(config)).toThrow(/Baukonzession/);
  });

  it('lehnt eine Start-Baukonzession für eine unbekannte Stadt ab', () => {
    const config = base();
    config.player.startingConcessions = ['unbekannt'];
    expect(() => validateGameConfig(config)).toThrow(/unbekannte Stadt/);
  });

  it('lehnt eine doppelt vergebene Start-Baukonzession ab', () => {
    const config = base();
    config.player.startingConcessions = ['lambrecht', 'lambrecht'];
    expect(() => validateGameConfig(config)).toThrow(/mehrfach vergeben/);
  });

  it('lehnt einen Laderaum von null ab', () => {
    const config = base();
    config.fleet.capacity = 0;
    expect(() => validateGameConfig(config)).toThrow(/Laderaum/);
  });
});
