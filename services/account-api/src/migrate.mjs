import { loadConfig } from './config.mjs';
import { createRepository } from './repository.mjs';

const config = loadConfig();
if (config.repository !== 'ydb') throw new Error('REPOSITORY=ydb is required for migrations');
const repository = await createRepository(config);
try {
  await repository.ensureSchema();
  console.log('YDB schema is ready');
} finally {
  await repository.close();
}
