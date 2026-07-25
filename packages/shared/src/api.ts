/** Shared REST contracts. The server is the authoritative source of values. */
export interface HealthResponse {
  status: 'ok';
  service: 'hanse2go-server';
}
