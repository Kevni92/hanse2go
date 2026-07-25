/** Shared REST contracts. The server is the authoritative source of values. */
export interface HealthResponse {
  status: 'ok';
  service: 'hanse2go-server';
}

export interface DebugPositionRequest {
  longitude: number;
  latitude: number;
}

export interface ReachableCity {
  cityId: string;
  distanceMeters: number;
  reachable: boolean;
}

export interface ApiError {
  error: {
    code: 'CITY_NOT_FOUND' | 'CITY_OUT_OF_RANGE' | 'INVALID_POSITION';
    message: string;
    details?: Record<string, unknown>;
  };
}
