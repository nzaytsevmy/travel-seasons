import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function pagePath(url) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Lighthouse URL must use HTTP');
  return parsed.pathname.replace(/\/index\.html$/, '/');
}

export function verifyIndexability(reports, expectedURLs = [], runs = 3) {
  if (!Array.isArray(reports) || reports.length === 0) throw new Error('No Lighthouse reports to verify');
  const counts = new Map();
  for (const report of reports) {
    const pathname = pagePath(report.finalUrl);
    const archive = /^\/blog\/tag\/[^/]+\/$/.test(pathname);
    const expectedScore = archive ? 0 : 1;
    if (report.audits?.['is-crawlable']?.score !== expectedScore) {
      throw new Error(`${pathname}: expected is-crawlable=${expectedScore} (${archive ? 'intentional noindex archive' : 'indexable public page'})`);
    }
    if (archive) {
      const refs = report.categories?.seo?.auditRefs;
      if (!Array.isArray(refs) || refs.length === 0) throw new Error(`${pathname}: SEO audit references missing`);
      for (const ref of refs.filter(r => r.weight > 0 && r.id !== 'is-crawlable')) {
        if (report.audits?.[ref.id]?.score !== 1) throw new Error(`${pathname}: ${ref.id} must have a perfect SEO score`);
      }
    }
    counts.set(pathname, (counts.get(pathname) || 0) + 1);
  }
  if (expectedURLs.length) {
    const expected = new Set(expectedURLs.map(pagePath));
    if ([...counts.keys()].some(p => !expected.has(p))) throw new Error('Unexpected Lighthouse URL');
    for (const pathname of expected) {
      if (counts.get(pathname) !== runs) throw new Error(`${pathname}: expected ${runs} Lighthouse runs, found ${counts.get(pathname) || 0}`);
    }
  }
  return { reports: reports.length, paths: counts.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [directory = '.lighthouseci', configFile] = process.argv.slice(2);
  if (!configFile) throw new Error('Usage: node scripts/check-lighthouse-indexability.mjs REPORT_DIRECTORY CONFIG_JSON');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  let urls = config.ci.collect.url;
  if (process.env.SHARD || process.env.SHARDS) {
    const shard = Number(process.env.SHARD), shards = Number(process.env.SHARDS);
    if (!Number.isInteger(shard) || !Number.isInteger(shards) || shard < 1 || shard > shards) throw new Error('Invalid Lighthouse shard');
    urls = urls.filter((_, i) => i % shards === shard - 1);
  }
  const runs = Number(process.env.RUNS || config.ci.collect.numberOfRuns);
  if (runs !== 3 || urls.length === 0) throw new Error('Acceptance requires three runs and a nonempty URL shard');
  const reports = fs.readdirSync(directory).filter(f => f.startsWith('lhr-') && f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(directory, f), 'utf8')));
  const result = verifyIndexability(reports, urls, runs);
  console.log(JSON.stringify({ indexability: 'PASS', ...result }));
}
