import { de, displayName, type Locale } from '@hanse2go/config/locale';
import type { BuildingClass, GoodCategory, ReputationStatus } from '@hanse2go/shared';

/**
 * Der Server liefert ausschließlich fachliche Bezeichner. Alle Anzeigenamen stammen aus den
 * Sprachdateien von `@hanse2go/config`; der Client ist die einzige Präsentationsschicht.
 */
const locale: Locale = de;

export const goodName = (goodId: string): string => displayName(locale.goods, goodId);
export const cityName = (cityId: string): string => displayName(locale.cities, cityId);
export const buildingName = (buildingType: string): string => displayName(locale.buildings, buildingType);
export const goodCategoryName = (category: GoodCategory): string => displayName(locale.goodCategories, category);
export const buildingClassName = (buildingClass: BuildingClass | undefined): string => (buildingClass ? displayName(locale.buildingClasses, buildingClass) : '');
export const reputationStatusName = (status: ReputationStatus): string => displayName(locale.reputationStatuses, status);
