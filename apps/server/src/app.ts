import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import type { HealthResponse } from '@hanse2go/shared';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.register(swagger, {
    openapi: {
      info: { title: 'Hanse2Go API', version: '0.1.0' },
    },
  });
  app.register(swaggerUi, { routePrefix: '/documentation' });

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

  return app;
}
