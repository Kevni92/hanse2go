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

/** Alpha 1 verwendet `CITY_OUT_OF_RANGE`, Alpha 2 den dort dokumentierten Code `CITY_NOT_REACHABLE`. */
export type ApiErrorCode =
  | 'CITY_NOT_FOUND' | 'CITY_OUT_OF_RANGE' | 'INVALID_POSITION' | 'GOOD_NOT_FOUND' | 'INVALID_QUANTITY'
  | 'INSUFFICIENT_GOLD' | 'INSUFFICIENT_CAPACITY' | 'INSUFFICIENT_CITY_STOCK' | 'INSUFFICIENT_FLEET_STOCK' | 'STALE_OFFER'
  | 'CITY_NOT_REACHABLE' | 'REPUTATION_TOO_LOW' | 'CONCESSION_ALREADY_OWNED' | 'CONCESSION_REQUIRED'
  | 'KONTOR_REQUIRED' | 'KONTOR_ALREADY_EXISTS' | 'UNKNOWN_BUILDING_TYPE' | 'INSUFFICIENT_BUILD_MATERIALS'
  | 'INVALID_TRANSFER_QUANTITY' | 'INSUFFICIENT_FLEET_GOODS' | 'INSUFFICIENT_KONTOR_GOODS' | 'INSUFFICIENT_FLEET_CAPACITY'
  | 'TICK_IN_PROGRESS' | 'BUILDING_NOT_FOUND' | 'BUILDING_NOT_OWNED' | 'BUILDING_HAS_NO_WORKFORCE' | 'INVALID_WORKFORCE_PRIORITY';

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface MarketQuoteRequest { goodId: string; direction: 'buy' | 'sell'; quantity: number; }
export interface TradeRequest extends MarketQuoteRequest { marketVersion: number; idempotencyKey: string; }

export interface BuildBuildingRequest { buildingType: string; }
export interface KontorTransferRequest { goodId: string; quantity: number; direction: 'store' | 'retrieve'; }
export interface TickRequest { idempotencyKey: string; }
export interface WorkforcePriorityRequest { priority: 'very_high' | 'high' | 'normal' | 'low' | 'very_low'; }
