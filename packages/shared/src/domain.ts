export type GoodCategory = 'Nahrung' | 'Baustoffe' | 'Handwerk' | 'Kleidung' | 'Haushaltswaren' | 'Luxuswaren';

export interface Position { longitude: number; latitude: number; recordedAt: string }
export interface Good { id: string; name: string; category: GoodCategory; basePrice: number; targetStock: number }
export interface City { id: string; name: string; position: Position; radiusMeters: number; population: number; prosperity: number; popularity: number; hasKontor: boolean; productionFocus: string[]; stock: Record<string, number> }
export interface Fleet { id: string; capacity: number; cargo: Record<string, number>; position: Position }
export interface Player { id: string; name: string; gold: number; activeFleetId: string }
export interface GameState { player: Player; fleet: Fleet; goods: Good[]; cities: City[] }
export type TradeDirection = 'buy' | 'sell';
export interface MarketQuote { cityId: string; goodId: string; direction: TradeDirection; quantity: number; marketVersion: number; total: number; averageUnitPrice: number; minimumUnitPrice: number; maximumUnitPrice: number; resultingCityStock: number; resultingFleetStock: number; resultingGold: number; remainingCapacity: number }
export interface MarketHistoryEntry { timestamp: string; goodId: string; direction: TradeDirection; quantity: number; total: number; priceBefore: number; priceAfter: number }
