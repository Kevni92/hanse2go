import type { DebugPositionRequest, GameState, HealthResponse, ReachableCity } from '@hanse2go/shared';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`);
  if (!response.ok) {
    throw new Error('Der Serverstatus konnte nicht geladen werden.');
  }

  return response.json() as Promise<HealthResponse>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  if (!response.ok) throw new Error('Die Serveranfrage konnte nicht verarbeitet werden.');
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
