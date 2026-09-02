import { MemoryRepository } from './repository-memory.mjs';
import { YdbRepository } from './repository-ydb.mjs';

export async function createRepository(config) {
  if (config.repository === 'memory') return new MemoryRepository();
  if (config.repository !== 'ydb' || !config.ydbConnectionString) throw new Error('YDB_CONNECTION_STRING is required');
  return YdbRepository.connect(config.ydbConnectionString);
}
