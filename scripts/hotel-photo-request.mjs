import { spawn } from 'node:child_process';

// Optional local transport when native fetch cannot reach a publisher CDN.
// Received bytes are streamed unchanged; HTTPS verification stays enabled.
export async function curlPhotoRequest(value, options = {}) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Hotel photo sources require HTTPS');
  const child = spawn('curl', ['--silent', '--show-error', '--fail', '--location',
    '--proto', '=https', '--proto-redir', '=https', '--max-redirs', '5',
    '--connect-timeout', '10', '--max-time', '30', '--user-agent',
    options.headers?.['User-Agent'] || 'TravelTribePhotoQA/1.0 (https://traveltribe.ru/)', url.href],
  { stdio: ['ignore', 'pipe', 'pipe'] });
  let diagnostic = '';
  child.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-2048); });
  const done = new Promise(resolve => {
    child.once('error', error => resolve({ error: error.message }));
    child.once('close', code => resolve({ code }));
  });
  const abort = () => { child.kill('SIGTERM'); };
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  async function* body() {
    try {
      for await (const chunk of child.stdout) yield chunk;
      const result = await done;
      if (result.error || result.code !== 0)
        throw new Error(`Photo transport failed (${result.code ?? 'spawn'}): ${result.error || diagnostic.trim()}`);
    } finally {
      options.signal?.removeEventListener('abort', abort);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
      await done;
    }
  }
  async function collect(limit = 5 * 1024 * 1024) {
    const chunks = []; let length = 0;
    for await (const chunk of body()) {
      length += chunk.length;
      if (length > limit) throw new Error('Publisher metadata exceeds bounded response size');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks, length);
  }
  // --fail plus consuming the body verifies the HTTP result before acceptance.
  return { ok: true, body: body(), arrayBuffer: () => collect(),
    json: async () => JSON.parse((await collect()).toString('utf8')) };
}
