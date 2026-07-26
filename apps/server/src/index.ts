import { buildApp } from './app.js';

// Der Alpha-Server läuft ausschließlich als Debug-Build; `HANSE2GO_DEBUG=0` schaltet den Stundentick ab.
const app = buildApp(undefined, { enableTestReset: process.env.HANSE2GO_E2E_TEST === '1', enableDebugTick: process.env.HANSE2GO_DEBUG !== '0' });

try {
  await app.listen({ host: '0.0.0.0', port: 3000 });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
