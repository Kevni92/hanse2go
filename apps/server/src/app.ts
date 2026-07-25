import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import type { ApiError, DebugPositionRequest, HealthResponse } from '@hanse2go/shared';
import { CityAccessService, DomainError } from './city-access.js';
import { InMemoryGameRepository, type GameRepository } from './game-state.js';

export function buildApp(repository: GameRepository = new InMemoryGameRepository()) {
  const app = Fastify({ logger: true });
  const cityAccess = new CityAccessService(repository);

  app.register(cors, { origin: true });
  app.register(swagger, {
    openapi: {
      info: { title: 'Hanse2Go API', version: '0.1.0' },
    },
  });
  app.register(swaggerUi, { routePrefix: '/documentation' });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainError) {
      const body: ApiError = { error: { code: error.code, message: error.message, details: error.details } };
      return reply.status(error.statusCode).send(body);
    }
    const fastifyValidationError = error as { validation?: unknown };
    if (fastifyValidationError.validation) {
      const body: ApiError = { error: { code: 'INVALID_POSITION', message: 'Die Debug-Position ist ungültig.' } };
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

  return app;
}
