import { buildApp } from './app.js';

const app = buildApp(undefined, { enableTestReset: process.env.HANSE2GO_E2E_TEST === '1' });

try {
  await app.listen({ host: '0.0.0.0', port: 3000 });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
