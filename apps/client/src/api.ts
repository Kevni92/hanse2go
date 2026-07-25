import type { City, DebugPositionRequest, GameState, HealthResponse, MarketHistoryEntry, MarketQuote, ReachableCity, TradeDirection } from '@hanse2go/shared';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`);
  if (!response.ok) {
    throw new Error('Der Serverstatus konnte nicht geladen werden.');
  }

  return response.json() as Promise<HealthResponse>;
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
  return request(`/api/cities/${cityId}/market/trade`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goodId: quote.goodId, direction: quote.direction, quantity: quote.quantity, marketVersion: quote.marketVersion, idempotencyKey: crypto.randomUUID() }) });
}

export function fetchMarketHistory(cityId: string, goodId: string): Promise<MarketHistoryEntry[]> {
  return request(`/api/cities/${cityId}/market/${goodId}/history`);
}
