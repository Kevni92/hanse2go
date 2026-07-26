import type { BuildingClass, GoodCategory, ReputationStatus } from '@hanse2go/shared';
import german from '../locales/de.json' with { type: 'json' };

/**
 * Anzeigenamen einer Sprache. Fachliche Bezeichner in `game-config.json` und in der API sind
 * ausschließlich englisch; die Präsentationsschicht löst sie über diese Zuordnung auf.
 */
export interface Locale {
  goods: Record<string, string>;
  goodCategories: Record<GoodCategory, string>;
  cities: Record<string, string>;
  buildings: Record<string, string>;
  buildingClasses: Record<BuildingClass, string>;
  reputationStatuses: Record<ReputationStatus, string>;
}

export const de: Locale = german;

export const locales = { de } satisfies Record<string, Locale>;
export type LocaleCode = keyof typeof locales;

/** Fällt auf den technischen Bezeichner zurück, damit eine fehlende Übersetzung nie eine leere Anzeige erzeugt. */
export function displayName(names: Record<string, string>, id: string): string {
  return names[id] ?? id;
}
