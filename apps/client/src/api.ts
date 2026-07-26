import type { City, CityBuildingsOverview, DebugPositionRequest, GameState, HealthResponse, MarketHistoryEntry, MarketQuote, ReachableCity, TickReport, TradeDirection, TransferDirection, WorkforcePriority, WorldClock } from '@hanse2go/shared';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`);
  if (!response.ok) {
    throw new Error('Der Serverstatus konnte nicht geladen werden.');
  }

  return response.json() as Promise<HealthResponse>;
}

// crypto.randomUUID gibt es nur in sicheren Kontexten. Der Dev-Server ist per --host
// auch über die LAN-Adresse erreichbar, dort fehlt die Methode.
function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export class ApiRequestError extends Error {
  constructor(public readonly code?: string, message = 'Die Serveranfrage ist fehlgeschlagen.') {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { code?: string; message?: string } } | undefined;
    throw new ApiRequestError(body?.error?.code, body?.error?.message);
  }
  return response.json() as Promise<T>;
}

export function fetchGameState(): Promise<GameState> {
  return request<GameState>('/api/state');
}

export function setDebugPosition(position: DebugPositionRequest): Promise<{ fleet: GameState['fleet']; reachableCities: ReachableCity[] }> {
  return request('/api/fleet/position', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(position),
  });
}

export function fetchReachableCity(cityId: string): Promise<{ city: City; distanceMeters: number }> {
  return request(`/api/cities/${cityId}`);
}

export function fetchQuote(cityId: string, goodId: string, direction: TradeDirection, quantity: number): Promise<MarketQuote> {
  return request(`/api/cities/${cityId}/market/quote`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goodId, direction, quantity }) });
}
export function submitTrade(cityId: string, quote: MarketQuote): Promise<MarketQuote> {
  return request(`/api/cities/${cityId}/market/trade`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goodId: quote.goodId, direction: quote.direction, quantity: quote.quantity, marketVersion: quote.marketVersion, idempotencyKey: createIdempotencyKey() }) });
}

export function fetchMarketHistory(cityId: string, goodId: string): Promise<MarketHistoryEntry[]> {
  return request(`/api/cities/${cityId}/market/${goodId}/history`);
}

const asJson = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

export function fetchBuildings(cityId: string): Promise<CityBuildingsOverview> {
  return request(`/api/cities/${cityId}/buildings`);
}
export function buyConcession(cityId: string): Promise<CityBuildingsOverview> {
  return request(`/api/cities/${cityId}/concession`, { method: 'POST' });
}
export function buildBuilding(cityId: string, buildingType: string): Promise<CityBuildingsOverview> {
  return request(`/api/cities/${cityId}/buildings`, asJson({ buildingType }));
}
export function transferKontorGoods(cityId: string, goodId: string, quantity: number, direction: TransferDirection): Promise<CityBuildingsOverview> {
  return request(`/api/cities/${cityId}/kontor/transfer`, asJson({ goodId, quantity, direction }));
}
export function setBuildingPriority(cityId: string, buildingId: string, priority: WorkforcePriority): Promise<CityBuildingsOverview> {
  return request(`/api/cities/${cityId}/buildings/${buildingId}/priority`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ priority }) });
}
export function simulateNextHour(): Promise<TickReport> {
  return request('/api/debug/tick', asJson({ idempotencyKey: createIdempotencyKey() }));
}
export function fetchWorld(): Promise<WorldClock & { lastTickReport?: TickReport }> {
  return request('/api/world');
}
