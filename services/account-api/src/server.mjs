import { createServer } from 'node:http';
import { loadConfig } from './config.mjs';
import { createRepository } from './repository.mjs';
import { createApp } from './app.mjs';

const config = loadConfig();
const repository = await createRepository(config);
if (config.migrateOnStart && typeof repository.ensureSchema === 'function') {
  await repository.ensureSchema();
}
const app = createApp({ config, repository });

const server = createServer(async (req, res) => {
  const response = await app(req);
  res.statusCode = response.status;
  for (const [name, value] of Object.entries(response.headers || {})) {
    if (value !== undefined) res.setHeader(name, value);
  }
  res.end(response.body || '');
});

server.listen(config.port, '0.0.0.0', () => {
  console.log(JSON.stringify({ level: 'info', event: 'server_started', port: config.port, repository: config.repository }));
});

async function shutdown(signal) {
  console.log(JSON.stringify({ level: 'info', event: 'shutdown', signal }));
  server.close(async () => {
    await repository.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
