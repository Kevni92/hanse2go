import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import { loadGameConfig, type GameConfig } from '@hanse2go/config';
import type { ApiError, BuildBuildingRequest, DebugPositionRequest, HealthResponse, KontorTransferRequest, MarketQuoteRequest, TickRequest, TradeRequest } from '@hanse2go/shared';
import { BuildingService } from './buildings.js';
import { CityAccessService, DomainError } from './city-access.js';
import { ConsumptionModel } from './consumption.js';
import { InMemoryGameRepository, type GameRepository } from './game-state.js';
import { MarketService } from './market.js';
import { createBuildingCatalog } from './production.js';
import { ReputationService } from './reputation.js';
import { TickService } from './tick.js';

export interface AppOptions {
  enableTestReset?: boolean;
  /** Der Stundentick steht laut Alpha-2-Konzept nur im Debug- und Testbetrieb bereit. */
  enableDebugTick?: boolean;
  /** Alle statischen Spieleigenschaften kommen aus der zentralen Konfiguration. */
  config?: GameConfig;
}

export function buildApp(repository: GameRepository = new InMemoryGameRepository(), options: AppOptions = {}) {
  const app = Fastify({ logger: true });
  const config = options.config ?? loadGameConfig();
  const catalog = createBuildingCatalog(config.buildings);
  const cityAccess = new CityAccessService(repository);
  const reputation = new ReputationService(config.reputation);
  const market = new MarketService(repository, cityAccess, config.market, reputation);
  const buildings = new BuildingService(repository, cityAccess, reputation, catalog);
  const tick = new TickService(repository, reputation, market, catalog, new ConsumptionModel(config.consumption));
  const enableDebugTick = options.enableDebugTick ?? true;

  app.register(cors, { origin: true, methods: ['GET', 'HEAD', 'POST', 'PUT'] });
  app.register(swagger, {
    openapi: {
      info: { title: 'Hanse2Go API', version: '0.1.0' },
    },
  });
  app.register(swaggerUi, { routePrefix: '/documentation' });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainError) {
      const body: ApiError = { error: { code: error.code, message: error.message, details: error.details } };
      return reply.status(error.statusCode).send(body);
    }
    const fastifyValidationError = error as { validation?: unknown };
    if (fastifyValidationError.validation) {
      const body: ApiError = { error: invalidRequest(request.url) };
      return reply.status(400).send(body);
    }
    throw error;
  });

  app.get<{ Reply: HealthResponse }>('/health', {
    schema: {
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          required: ['status', 'service'],
          properties: {
            status: { type: 'string', const: 'ok' },
            service: { type: 'string', const: 'hanse2go-server' },
          },
        },
      },
    },
  }, async () => ({ status: 'ok', service: 'hanse2go-server' }));
  app.get('/api/state', { schema: { tags: ['Alpha 1'] } }, () => repository.getState());
  app.get('/api/player', { schema: { tags: ['Alpha 1'] } }, () => repository.getPlayer());
  app.get('/api/fleet', { schema: { tags: ['Alpha 1'] } }, () => repository.getFleet());
  app.get('/api/goods', { schema: { tags: ['Alpha 1'] } }, () => repository.getGoods());
  app.get('/api/cities', { schema: { tags: ['Alpha 1'] } }, () => repository.getCities());
  app.get('/api/cities/reachable', { schema: { tags: ['Position'] } }, () => cityAccess.getReachability());
  app.get<{ Params: { cityId: string } }>('/api/cities/:cityId', { schema: { tags: ['Städte'] } }, ({ params }) => cityAccess.requireReachable(params.cityId));
  app.put<{ Body: DebugPositionRequest }>('/api/fleet/position', {
    schema: {
      tags: ['Position'],
      body: {
        type: 'object', required: ['longitude', 'latitude'], additionalProperties: false,
        properties: { longitude: { type: 'number' }, latitude: { type: 'number' } },
      },
    },
  }, ({ body }) => {
    if (!Number.isFinite(body.longitude) || body.longitude < -180 || body.longitude > 180
      || !Number.isFinite(body.latitude) || body.latitude < -90 || body.latitude > 90) {
      throw new DomainError('INVALID_POSITION', 'Die Debug-Position enthält ungültige Koordinaten.', 400);
    }
    const fleet = repository.setFleetPosition({ ...body, recordedAt: new Date().toISOString() });
    return { fleet, reachableCities: cityAccess.getReachability() };
  });
  app.post<{ Params: { cityId: string }; Body: MarketQuoteRequest }>('/api/cities/:cityId/market/quote', { schema: { tags: ['Markt'] } }, ({ params, body }) => market.quote({ cityId: params.cityId, ...body }));
  app.post<{ Params: { cityId: string }; Body: TradeRequest }>('/api/cities/:cityId/market/trade', { schema: { tags: ['Markt'] } }, ({ params, body }) => market.commit({ cityId: params.cityId, ...body }));
  app.get<{ Params: { cityId: string; goodId: string } }>('/api/cities/:cityId/market/:goodId/history', { schema: { tags: ['Markt'] } }, ({ params }) => market.getHistory(params.cityId, params.goodId));
  app.get('/api/world', { schema: { tags: ['Alpha 2'] } }, () => { const state = repository.getState(); return { ...state.world, lastTickReport: state.lastTickReport }; });
  app.get<{ Params: { cityId: string } }>('/api/cities/:cityId/buildings', { schema: { tags: ['Alpha 2'] } }, ({ params }) => buildings.getOverview(params.cityId));
  app.post<{ Params: { cityId: string } }>('/api/cities/:cityId/concession', { schema: { tags: ['Alpha 2'] } }, ({ params }) => buildings.buyConcession(params.cityId));
  app.post<{ Params: { cityId: string }; Body: BuildBuildingRequest }>('/api/cities/:cityId/buildings', {
    schema: { tags: ['Alpha 2'], body: { type: 'object', required: ['buildingType'], additionalProperties: false, properties: { buildingType: { type: 'string' } } } },
  }, ({ params, body }) => buildings.build(params.cityId, body.buildingType));
  app.post<{ Params: { cityId: string }; Body: KontorTransferRequest }>('/api/cities/:cityId/kontor/transfer', {
    schema: { tags: ['Alpha 2'], body: { type: 'object', required: ['goodId', 'quantity', 'direction'], additionalProperties: false, properties: { goodId: { type: 'string' }, quantity: { type: 'number' }, direction: { type: 'string', enum: ['store', 'retrieve'] } } } },
  }, ({ params, body }) => buildings.transfer(params.cityId, body));
  if (enableDebugTick) {
    app.post<{ Body: TickRequest }>('/api/debug/tick', {
      schema: { tags: ['Alpha 2'], body: { type: 'object', required: ['idempotencyKey'], additionalProperties: false, properties: { idempotencyKey: { type: 'string', minLength: 1 } } } },
    }, ({ body }) => tick.run(body.idempotencyKey));
  }
  if (options.enableTestReset) {
    app.post('/test/reset', { schema: { tags: ['Tests'] } }, () => { repository.reset(); market.reset(); reputation.reset(); tick.reset(); return repository.getState(); });
    // `docs/alpha-2/test-world.md`: der Testzustand darf Ruf und Flottenmaterial vorbereiten.
    app.post<{ Body: TestSeedRequest }>('/test/seed', {
      schema: {
        tags: ['Tests'],
        body: {
          type: 'object', additionalProperties: false,
          properties: { gold: { type: 'number' }, cargo: { type: 'object', additionalProperties: { type: 'number' } }, reputation: { type: 'object', additionalProperties: { type: 'number' } } },
        },
      },
    }, ({ body }) => repository.runTransaction((state) => {
      if (body.gold !== undefined) {
        if (!Number.isInteger(body.gold) || body.gold < 0) throw new DomainError('INVALID_QUANTITY', 'Das Testgold muss eine ganze Zahl ab null sein.', 400);
        state.player.gold = body.gold;
      }
      if (body.cargo) {
        const cargo: Record<string, number> = {};
        for (const [goodId, amount] of Object.entries(body.cargo)) {
          if (!state.goods.some((good) => good.id === goodId)) throw new DomainError('GOOD_NOT_FOUND', 'Die angeforderte Ware existiert nicht.', 404, { goodId });
          if (!Number.isInteger(amount) || amount < 0) throw new DomainError('INVALID_QUANTITY', 'Die Testladung muss ganzzahlig und mindestens null sein.', 400);
          if (amount > 0) cargo[goodId] = amount;
        }
        const used = Object.values(cargo).reduce((total, amount) => total + amount, 0);
        if (used > state.fleet.capacity) throw new DomainError('INSUFFICIENT_CAPACITY', 'Die Testladung überschreitet den Laderaum der Flotte.', 409, { capacity: state.fleet.capacity, requested: used });
        state.fleet.cargo = cargo;
      }
      for (const [cityId, value] of Object.entries(body.reputation ?? {})) {
        if (!state.cities.some((city) => city.id === cityId)) throw new DomainError('CITY_NOT_FOUND', 'Die angeforderte Stadt existiert nicht.', 404, { cityId });
        if (!Number.isInteger(value) || value < 0 || value > reputation.maximumValue) throw new DomainError('INVALID_QUANTITY', `Der Testruf muss zwischen 0 und ${reputation.maximumValue} liegen.`, 400);
        const entry = state.reputations.find((candidate) => candidate.cityId === cityId);
        if (entry) { entry.value = value; entry.status = reputation.statusFor(value); }
        else state.reputations.push({ cityId, value, status: reputation.statusFor(value) });
      }
      return repository.getState();
    }));
  }

  return app;
}

interface TestSeedRequest { gold?: number; cargo?: Record<string, number>; reputation?: Record<string, number> }

function invalidRequest(url: string): ApiError['error'] {
  if (url.endsWith('/fleet/position')) return { code: 'INVALID_POSITION', message: 'Die Debug-Position ist ungültig.' };
  if (url.endsWith('/kontor/transfer')) return { code: 'INVALID_TRANSFER_QUANTITY', message: 'Der Lagertransfer ist unvollständig oder ungültig.' };
  if (url.endsWith('/buildings')) return { code: 'UNKNOWN_BUILDING_TYPE', message: 'Es wurde kein gültiger Gebäudetyp übergeben.' };
  return { code: 'INVALID_QUANTITY', message: 'Die Anfrage ist unvollständig oder ungültig.' };
}
