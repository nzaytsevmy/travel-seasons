// Получает полный Playwright --list --reporter=json и возвращает точные фильтры
// файлов. Один процесс на файл ограничивает время жизни общего WebKit browser;
// состав тестов и проектов берётся из самой коллекции, а не из ручного списка.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function fileBatches(collection) {
  if (collection.errors?.length || !collection.config?.rootDir || !Array.isArray(collection.suites)) {
    throw new Error('Playwright collection is incomplete or contains errors');
  }
  const root = path.resolve(collection.config.rootDir);
  const files = new Set();
  const tests = new Set();
  function walk(suites) {
    for (const suite of suites) {
      for (const spec of suite.specs || []) {
        const file = path.resolve(root, spec.file || '');
        if (!file.startsWith(root + path.sep) || !file.endsWith('.spec.ts') || /[\r\n]/.test(file)) {
          throw new Error(`Unexpected test file: ${spec.file}`);
        }
        if (!spec.id || !spec.tests?.length) throw new Error('Test has no identity or projects');
        files.add(file);
        for (const test of spec.tests) {
          if (!test.projectId) throw new Error('Test has no project identity');
          const key = `${spec.id}:${test.projectId}`;
          if (tests.has(key)) throw new Error(`Duplicate test identity: ${key}`);
          tests.add(key);
        }
      }
      walk(suite.suites || []);
    }
  }
  walk(collection.suites);
  if (!tests.size || !files.size) throw new Error('Playwright collection is empty');
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { tests: tests.size, matches: [...files].sort().map(file => `^${escape(file)}$`) };
}

if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = fileBatches(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
  process.stdout.write(result.matches.join('\n') + '\n');
  console.error(`Playwright: ${result.tests} tests in ${result.matches.length} file batches`);
}
