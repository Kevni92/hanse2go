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
    code: 'CITY_NOT_FOUND' | 'CITY_OUT_OF_RANGE' | 'INVALID_POSITION' | 'GOOD_NOT_FOUND' | 'INVALID_QUANTITY' | 'INSUFFICIENT_GOLD' | 'INSUFFICIENT_CAPACITY' | 'INSUFFICIENT_CITY_STOCK' | 'INSUFFICIENT_FLEET_STOCK' | 'STALE_OFFER';
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface MarketQuoteRequest { goodId: string; direction: 'buy' | 'sell'; quantity: number; }
export interface TradeRequest extends MarketQuoteRequest { marketVersion: number; idempotencyKey: string; }
