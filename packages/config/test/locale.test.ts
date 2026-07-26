import { describe, expect, it } from 'vitest';
import { ConfigError, loadGameConfig, validateLocale } from '../src/index.js';
import { de, displayName, locales } from '../src/locale.js';

describe('Sprachdateien', () => {
  it('benennt jeden fachlichen Bezeichner der Konfiguration', () => {
    for (const locale of Object.values(locales)) expect(() => validateLocale(loadGameConfig(), locale)).not.toThrow();
  });

  it('meldet fehlende Anzeigenamen mit ihrem Bezeichner', () => {
    const incomplete = { ...de, goods: { ...de.goods } };
    delete incomplete.goods['grain'];
    expect(() => validateLocale(loadGameConfig(), incomplete)).toThrow(ConfigError);
    expect(() => validateLocale(loadGameConfig(), incomplete)).toThrow(/goods\.grain/);
  });

  it('enthält keine Anzeigenamen für unbekannte Bezeichner', () => {
    const config = loadGameConfig();
    const goodIds = new Set(config.goods.map((good) => good.id));
    const buildingTypes = new Set([config.buildings.kontorType, ...config.buildings.production.map((entry) => entry.buildingType)]);
    for (const id of Object.keys(de.goods)) expect(goodIds).toContain(id);
    for (const id of Object.keys(de.buildings)) expect(buildingTypes).toContain(id);
    for (const id of Object.keys(de.cities)) expect(config.cities.map((city) => city.id)).toContain(id);
  });

  it('fällt auf den technischen Bezeichner zurück', () => {
    expect(displayName(de.goods, 'grain')).toBe('Getreide');
    expect(displayName(de.goods, 'unbekannt')).toBe('unbekannt');
  });
});
