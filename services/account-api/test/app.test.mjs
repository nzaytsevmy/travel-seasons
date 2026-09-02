import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createApp } from '../src/app.mjs';
import { loadConfig } from '../src/config.mjs';
import { MemoryRepository } from '../src/repository-memory.mjs';

const config = loadConfig({
  NODE_ENV: 'test',
  FRONTEND_ORIGIN: 'https://traveltribe.ru',
  PUBLIC_API_ORIGIN: 'https://api.traveltribe.ru',
  YANDEX_CLIENT_ID: 'client-id',
  YANDEX_CLIENT_SECRET: 'client-secret',
  SESSION_HMAC_SECRET: 's'.repeat(48),
  SUBJECT_HMAC_SECRET: 'u'.repeat(48),
  REPOSITORY: 'memory',
});

function request(path, { method = 'GET', headers = {}, body = '' } = {}) {
  const req = Readable.from(body ? [Buffer.from(body)] : []);
  req.url = path;
  req.method = method;
  req.headers = { host: 'api.traveltribe.ru', ...headers };
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

const cookies = (response) => (response.headers['set-cookie'] || []).map((value) => value.split(';')[0]).join('; ');
const oneCookie = (response, name) => (response.headers['set-cookie'] || []).find((value) => value.startsWith(`${name}=`))?.split(';')[0];
const body = (response) => JSON.parse(response.body || '{}');

async function authenticate(app, repository) {
  const start = await app(request('/v1/auth/yandex/start?consent=account_v2&return_to=%2Fmy%2F%3Fsync%3D1'));
  const authUrl = new URL(start.headers.location);
  const oauthCookie = cookies(start);
  const fetchCalls = [];
  const fetchImpl = async (url, init = {}) => {
    fetchCalls.push({ url: String(url), init });
    if (String(url).includes('/token')) return new Response(JSON.stringify({ access_token: 'temporary-oauth-token', refresh_token: 'must-not-persist' }), { status: 200 });
    return new Response(JSON.stringify({ id: 'raw-yandex-id', login: 'ignored-login', default_email: 'ignored@example.test' }), { status: 200 });
  };
  const callbackApp = createApp({ config, repository, fetchImpl, clock: () => 1_800_000_000_000 });
  const callback = await callbackApp(request(`/v1/auth/yandex/callback?code=code-1&state=${authUrl.searchParams.get('state')}`, { headers: { cookie: oauthCookie } }));
  const sessionCookie = oneCookie(callback, '__Host-tt_session');
  return { callbackApp, callback, sessionCookie, fetchCalls };
}

test('OAuth start требует отдельное согласие и создаёт PKCE S256', async () => {
  const app = createApp({ config, repository: new MemoryRepository() });
  const rejected = await app(request('/v1/auth/yandex/start'));
  assert.equal(rejected.status, 400);
  assert.equal(body(rejected).code, 'consent_required');

  const response = await app(request('/v1/auth/yandex/start?consent=account_v2&return_to=%2Fmy%2F'));
  assert.equal(response.status, 302);
  const url = new URL(response.headers.location);
  assert.equal(url.origin, 'https://oauth.yandex.ru');
  assert.equal(url.searchParams.get('scope'), 'login:info');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.match(url.searchParams.get('code_challenge'), /^[a-zA-Z0-9_-]{43}$/);
  assert.match(oneCookie(response, '__Host-tt_oauth'), /^__Host-tt_oauth=/);
});

test('callback хранит только HMAC subject и не сохраняет OAuth-профиль или токены', async () => {
  const repository = new MemoryRepository();
  const app = createApp({ config, repository, clock: () => 1_800_000_000_000 });
  const { callback, sessionCookie, fetchCalls } = await authenticate(app, repository);
  assert.equal(callback.status, 302);
  assert.equal(new URL(callback.headers.location).searchParams.get('auth'), 'success');
  assert.ok(sessionCookie);
  assert.equal(fetchCalls.length, 2);
  assert.equal([...repository.accounts.keys()].includes('raw-yandex-id'), false);
  assert.equal(JSON.stringify([...repository.accounts.values()]).includes('ignored@example.test'), false);
  assert.equal(JSON.stringify(repository).includes('temporary-oauth-token'), false);
  assert.equal(JSON.stringify(repository).includes('refresh_token'), false);
});

test('запись требует session, точный Origin, CSRF и Idempotency-Key', async () => {
  const repository = new MemoryRepository();
  const first = createApp({ config, repository, clock: () => 1_800_000_000_000 });
  const { callbackApp: app, sessionCookie } = await authenticate(first, repository);
  const bootstrap = await app(request('/v1/bootstrap', { headers: { cookie: sessionCookie, origin: 'https://traveltribe.ru' } }));
  const csrf = body(bootstrap).csrfToken;
  assert.equal(body(bootstrap).authenticated, true);

  const common = { cookie: sessionCookie, origin: 'https://traveltribe.ru', 'content-type': 'application/json', 'x-csrf-token': csrf, 'idempotency-key': 'request_1234567890' };
  const noOrigin = await app(request('/v1/plans/import', { method: 'POST', headers: { ...common, origin: 'https://evil.test' }, body: '{"plans":[]}' }));
  assert.equal(noOrigin.status, 403);
  assert.equal(body(noOrigin).code, 'origin_rejected');
  const noCsrf = await app(request('/v1/plans/import', { method: 'POST', headers: { ...common, 'x-csrf-token': 'bad' }, body: '{"plans":[]}' }));
  assert.equal(noCsrf.status, 403);
  assert.equal(body(noCsrf).code, 'csrf_rejected');
});

test('import сохраняет план один раз и возвращает 409 при устаревшей правке', async () => {
  const repository = new MemoryRepository();
  const first = createApp({ config, repository, clock: () => 1_800_000_000_000 });
  const { callbackApp: app, sessionCookie } = await authenticate(first, repository);
  const bootstrap = body(await app(request('/v1/bootstrap', { headers: { cookie: sessionCookie, origin: 'https://traveltribe.ru' } })));
  const headers = { cookie: sessionCookie, origin: 'https://traveltribe.ru', 'content-type': 'application/json', 'x-csrf-token': bootstrap.csrfToken };
  const plan = {
    schemaVersion: 2, id: 'plan_1234567890', kind: 'route', routeSlug: 'georgia-7-days',
    destinationSlug: 'georgia', title: 'Грузия на 7 дней', nom: 'Грузия', days: 7,
    people: 2, dateStart: '2026-10-01', dateEnd: '2026-10-07', version: 0,
    stops: [{ id: 'tbilisi', label: 'Тбилиси', day: 1 }], savedAt: 1_799_000_000_000,
  };
  const saved = await app(request('/v1/plans/import', { method: 'POST', headers: { ...headers, 'idempotency-key': 'save_plan_123456' }, body: JSON.stringify({ plans: [plan] }) }));
  assert.equal(saved.status, 200);
  assert.equal(body(saved).plans[0].version, 1);
  const replay = await app(request('/v1/plans/import', { method: 'POST', headers: { ...headers, 'idempotency-key': 'save_plan_123456' }, body: JSON.stringify({ plans: [{ ...plan, title: 'Другая версия' }] }) }));
  assert.deepEqual(body(replay), body(saved));

  const conflict = await app(request('/v1/plans/import', { method: 'POST', headers: { ...headers, 'idempotency-key': 'save_plan_654321' }, body: JSON.stringify({ plans: [{ ...plan, title: 'Локальная правка' }] }) }));
  assert.equal(conflict.status, 409);
  assert.equal(body(conflict).code, 'version_conflict');
  assert.equal((await repository.listPlans([...repository.accounts.keys()][0]))[0].title, 'Грузия на 7 дней');
});

test('API не принимает больше 20 планов и тело больше 64 КБ', async () => {
  const repository = new MemoryRepository();
  const first = createApp({ config, repository, clock: () => 1_800_000_000_000 });
  const { callbackApp: app, sessionCookie } = await authenticate(first, repository);
  const bootstrap = body(await app(request('/v1/bootstrap', { headers: { cookie: sessionCookie, origin: 'https://traveltribe.ru' } })));
  const headers = { cookie: sessionCookie, origin: 'https://traveltribe.ru', 'content-type': 'application/json', 'x-csrf-token': bootstrap.csrfToken, 'idempotency-key': 'limit_test_123456' };
  const values = Array.from({ length: 21 }, (_, index) => ({ id: `plan_${String(index).padStart(12, '0')}`, destinationSlug: 'peru' }));
  const limit = await app(request('/v1/plans/import', { method: 'POST', headers, body: JSON.stringify({ plans: values }) }));
  assert.equal(limit.status, 422);
  assert.equal(body(limit).code, 'plan_limit');
  const tooLarge = await app(request('/v1/plans/import', { method: 'POST', headers: { ...headers, 'content-length': String(70 * 1024) }, body: '{}' }));
  assert.equal(tooLarge.status, 413);
});

test('экспорт не раскрывает subject hash, удаление стирает облако, но не касается localStorage', async () => {
  const repository = new MemoryRepository();
  const first = createApp({ config, repository, clock: () => 1_800_000_000_000 });
  const { callbackApp: app, sessionCookie } = await authenticate(first, repository);
  const bootstrap = body(await app(request('/v1/bootstrap', { headers: { cookie: sessionCookie, origin: 'https://traveltribe.ru' } })));
  const exported = await app(request('/v1/account/export', { headers: { cookie: sessionCookie, origin: 'https://traveltribe.ru' } }));
  assert.equal(exported.status, 200);
  assert.equal(Object.hasOwn(body(exported), 'subjectHash'), false);
  const deleted = await app(request('/v1/account', { method: 'DELETE', headers: {
    cookie: sessionCookie, origin: 'https://traveltribe.ru', 'x-csrf-token': bootstrap.csrfToken, 'idempotency-key': 'delete_1234567890',
  } }));
  assert.equal(deleted.status, 200);
  assert.equal(body(deleted).deleted, true);
  assert.equal(repository.accounts.size, 0);
  assert.equal(repository.sessions.size, 0);
  assert.equal(repository.idempotency.size, 0);
});

test('bootstrap и экспорт отклоняют чтение с чужого Origin', async () => {
  const repository = new MemoryRepository();
  const first = createApp({ config, repository, clock: () => 1_800_000_000_000 });
  const { callbackApp: app, sessionCookie } = await authenticate(first, repository);
  for (const path of ['/v1/bootstrap', '/v1/account/export']) {
    const response = await app(request(path, { headers: { cookie: sessionCookie, origin: 'https://evil.test' } }));
    assert.equal(response.status, 403);
    assert.equal(body(response).code, 'origin_rejected');
  }
});
