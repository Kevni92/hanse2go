import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
mkdirSync('test-results', { recursive: true });
const log = createWriteStream('test-results/server.log', { flags: 'a' });
const child = spawn(pnpm, ['--filter', '@hanse2go/server', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
  env: { ...process.env, HANSE2GO_E2E_TEST: '1' },
});

for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => { process.stdout.write(chunk); log.write(chunk); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => { log.end(); process.exit(code ?? 1); });
