import type { HealthResponse } from '@hanse2go/shared';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`);
  if (!response.ok) {
    throw new Error('Der Serverstatus konnte nicht geladen werden.');
  }

  return response.json() as Promise<HealthResponse>;
}
