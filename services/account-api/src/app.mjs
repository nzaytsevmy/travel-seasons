import { hmac, parseCookies, randomToken, RateLimiter, safeEqual, sha256url, signedValue, readSignedValue, cookie } from './security.mjs';
import { sanitizePlan } from './plans.mjs';

const SESSION_COOKIE = '__Host-tt_session';
const OAUTH_COOKIE = '__Host-tt_oauth';
const CONSENT_VERSION = 'account_v2';
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000;

function json(status, value, extraHeaders = {}) {
  return {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
    body: JSON.stringify(value),
  };
}

function redirect(location, cookies = []) {
  return { status: 302, headers: { location, 'set-cookie': cookies }, body: '' };
}

function httpError(status, code, message) {
  const error = new Error(message); error.status = status; error.code = code; return error;
}

function returnTo(value, config) {
  const decoded = String(value || '/my/').slice(0, 300);
  return config.allowedReturnPrefixes.some((prefix) => decoded.startsWith(prefix)) ? decoded : '/my/';
}

function requestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').map((x) => x.trim()).filter(Boolean);
  return forwarded.at(-1) || req.socket?.remoteAddress || 'unknown';
}

async function readJson(req, maxBytes) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > maxBytes) throw httpError(413, 'body_too_large', 'Тело запроса больше 64 КБ.');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) throw httpError(413, 'body_too_large', 'Тело запроса больше 64 КБ.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw httpError(400, 'invalid_json', 'Некорректный JSON.'); }
}

export function createApp({ config, repository, fetchImpl = fetch, clock = Date.now }) {
  const oauthLimiter = new RateLimiter({ limit: 10, windowMs: 60_000, clock });
  const writeLimiter = new RateLimiter({ limit: 60, windowMs: 60_000, clock });
  const csrfFor = (rawSession) => hmac(config.sessionHmacSecret, `csrf:${rawSession}`);
  const sessionKey = (rawSession) => hmac(config.sessionHmacSecret, `session:${rawSession}`);
  const subjectKey = (rawYandexId) => hmac(config.subjectHmacSecret, `yandex:${rawYandexId}`);
  const clearOAuth = cookie(OAUTH_COOKIE, '', { path: '/v1/auth/yandex', maxAge: 0 });
  const clearSession = cookie(SESSION_COOKIE, '', { maxAge: 0 });

  async function getSession(req, { touch = true } = {}) {
    const raw = parseCookies(req.headers.cookie || '')[SESSION_COOKIE];
    if (!raw) return null;
    const session = await repository.getSession(sessionKey(raw));
    if (!session) return null;
    const now = clock();
    if (session.idleExpiresAt <= now || session.absoluteExpiresAt <= now) {
      await repository.deleteSession(session.id);
      return null;
    }
    if (touch && now - session.lastSeenAt > 60_000) {
      session.lastSeenAt = now;
      session.idleExpiresAt = Math.min(now + config.sessionIdleMs, session.absoluteExpiresAt);
      await repository.touchSession(session.id, session.lastSeenAt, session.idleExpiresAt);
    }
    return { ...session, raw, csrfToken: csrfFor(raw) };
  }

  function requireOrigin(req) {
    if (req.headers.origin !== config.frontendOrigin) throw httpError(403, 'origin_rejected', 'Источник запроса не разрешён.');
  }

  async function requireWrite(req) {
    requireOrigin(req);
    const session = await getSession(req);
    if (!session) throw httpError(401, 'authentication_required', 'Нужен вход через Яндекс ID.');
    if (!safeEqual(req.headers['x-csrf-token'] || '', session.csrfToken)) throw httpError(403, 'csrf_rejected', 'Защитный токен не совпал.');
    const key = String(req.headers['idempotency-key'] || '');
    if (!/^[a-zA-Z0-9_-]{16,96}$/.test(key)) throw httpError(400, 'idempotency_required', 'Нужен корректный Idempotency-Key.');
    if (!writeLimiter.allow(session.subjectHash)) throw httpError(429, 'rate_limited', 'Слишком много изменений. Повторите через минуту.');
    return { session, key };
  }

  async function idempotent(subjectHash, key, operation) {
    const cached = await repository.getIdempotent(subjectHash, key, clock());
    if (cached) return cached;
    const result = await operation();
    await repository.putIdempotent(subjectHash, key, result, clock() + IDEMPOTENCY_TTL);
    return result;
  }

  function validatePlans(values) {
    if (!Array.isArray(values)) throw httpError(400, 'plans_required', 'Ожидался список планов.');
    if (values.length > config.maxPlans) throw httpError(422, 'plan_limit', `Можно хранить не больше ${config.maxPlans} планов.`);
    const plans = values.map((value) => sanitizePlan(value, clock()));
    if (plans.some((plan) => !plan)) throw httpError(422, 'invalid_plan', 'Один из планов не прошёл проверку.');
    if (new Set(plans.map((plan) => plan.id)).size !== plans.length) throw httpError(422, 'duplicate_plan', 'Идентификаторы планов повторяются.');
    return plans;
  }

  async function handle(req) {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '/', `https://${host}`);
    const method = String(req.method || 'GET').toUpperCase();

    if (method === 'OPTIONS') {
      requireOrigin(req);
      return { status: 204, headers: {}, body: '' };
    }
    if (method === 'GET' && url.pathname === '/healthz') return json(200, { ok: true });
    if (method === 'GET' && url.pathname === '/readyz') {
      await repository.health();
      return json(200, { ok: true });
    }

    if (method === 'GET' && url.pathname === '/v1/auth/yandex/start') {
      const ipKey = hmac(config.sessionHmacSecret, `ip:${requestIp(req)}`);
      if (!oauthLimiter.allow(ipKey)) throw httpError(429, 'rate_limited', 'Слишком много попыток входа. Повторите через минуту.');
      if (url.searchParams.get('consent') !== CONSENT_VERSION) throw httpError(400, 'consent_required', 'Нужно отдельное согласие на создание учётной записи.');
      const state = randomToken(24);
      const verifier = randomToken(48);
      const payload = {
        state,
        verifier,
        returnTo: returnTo(url.searchParams.get('return_to'), config),
        consentVersion: CONSENT_VERSION,
        expiresAt: clock() + config.oauthStateMs,
      };
      const authorization = new URL('https://oauth.yandex.ru/authorize');
      authorization.searchParams.set('response_type', 'code');
      authorization.searchParams.set('client_id', config.yandexClientId);
      authorization.searchParams.set('redirect_uri', `${config.publicApiOrigin}/v1/auth/yandex/callback`);
      authorization.searchParams.set('scope', 'login:info');
      authorization.searchParams.set('state', state);
      authorization.searchParams.set('code_challenge', sha256url(verifier));
      authorization.searchParams.set('code_challenge_method', 'S256');
      return redirect(authorization.toString(), [cookie(OAUTH_COOKIE, signedValue(config.sessionHmacSecret, payload), {
        path: '/v1/auth/yandex', maxAge: config.oauthStateMs / 1000,
      })]);
    }

    if (method === 'GET' && url.pathname === '/v1/auth/yandex/callback') {
      const signed = parseCookies(req.headers.cookie || '')[OAUTH_COOKIE];
      const state = readSignedValue(config.sessionHmacSecret, signed);
      if (!state || state.expiresAt <= clock() || !safeEqual(url.searchParams.get('state') || '', state.state)) {
        throw httpError(400, 'oauth_state_rejected', 'Попытка входа устарела или не прошла проверку state.');
      }
      const code = url.searchParams.get('code');
      if (!code) throw httpError(400, 'oauth_code_missing', 'Яндекс не вернул код авторизации.');
      const tokenResponse = await fetchImpl('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code,
          client_id: config.yandexClientId,
          client_secret: config.yandexClientSecret,
          redirect_uri: `${config.publicApiOrigin}/v1/auth/yandex/callback`,
          code_verifier: state.verifier,
        }),
        signal: AbortSignal.timeout(8_000),
      });
      const token = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || !token.access_token) throw httpError(502, 'oauth_exchange_failed', 'Яндекс не подтвердил вход.');
      const infoResponse = await fetchImpl('https://login.yandex.ru/info?format=json', {
        headers: { authorization: `OAuth ${token.access_token}`, accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });
      const info = await infoResponse.json().catch(() => ({}));
      if (!infoResponse.ok || !info.id) throw httpError(502, 'oauth_profile_failed', 'Не удалось получить технический идентификатор Яндекс ID.');

      const now = clock();
      const subjectHash = subjectKey(String(info.id));
      await repository.createAccount(subjectHash, state.consentVersion, now);
      const rawSession = randomToken(32);
      await repository.createSession({
        id: sessionKey(rawSession), subjectHash, createdAt: now, lastSeenAt: now,
        idleExpiresAt: now + config.sessionIdleMs,
        absoluteExpiresAt: now + config.sessionAbsoluteMs,
      });
      const target = new URL(state.returnTo, config.frontendOrigin);
      target.searchParams.set('auth', 'success');
      return redirect(target.toString(), [
        clearOAuth,
        cookie(SESSION_COOKIE, rawSession, { maxAge: config.sessionAbsoluteMs / 1000 }),
      ]);
    }

    if (method === 'GET' && url.pathname === '/v1/bootstrap') {
      requireOrigin(req);
      const session = await getSession(req);
      if (!session) return json(200, { authenticated: false, limits: { plans: config.maxPlans, bodyBytes: config.maxBodyBytes } });
      return json(200, {
        authenticated: true,
        csrfToken: session.csrfToken,
        plans: await repository.listPlans(session.subjectHash),
        limits: { plans: config.maxPlans, bodyBytes: config.maxBodyBytes },
      });
    }

    if (method === 'POST' && url.pathname === '/v1/plans/import') {
      const { session, key } = await requireWrite(req);
      const body = await readJson(req, config.maxBodyBytes);
      const plans = validatePlans(body.plans);
      const result = await idempotent(session.subjectHash, key, () => repository.savePlans(session.subjectHash, plans, clock(), config.maxPlans));
      if (result.conflicts?.length) return json(409, { code: 'version_conflict', message: 'Есть более новая облачная версия.', ...result });
      return json(200, result);
    }

    if (method === 'POST' && url.pathname === '/v1/plans') {
      const { session, key } = await requireWrite(req);
      const body = await readJson(req, config.maxBodyBytes);
      const [plan] = validatePlans([body.plan]);
      const result = await idempotent(session.subjectHash, key, () => repository.savePlans(session.subjectHash, [plan], clock(), config.maxPlans));
      if (result.conflicts?.length) return json(409, { code: 'version_conflict', message: 'Есть более новая облачная версия.', ...result });
      return json(201, result);
    }

    const planMatch = url.pathname.match(/^\/v1\/plans\/([a-zA-Z0-9_-]{1,96})$/);
    if (method === 'PATCH' && planMatch) {
      const { session, key } = await requireWrite(req);
      const body = await readJson(req, config.maxBodyBytes);
      if (body.plan?.id !== planMatch[1]) throw httpError(422, 'plan_id_mismatch', 'Идентификатор плана не совпал с URL.');
      const [plan] = validatePlans([body.plan]);
      const result = await idempotent(session.subjectHash, key, () => repository.savePlans(session.subjectHash, [plan], clock(), config.maxPlans));
      if (result.conflicts?.length) return json(409, { code: 'version_conflict', message: 'Есть более новая облачная версия.', ...result });
      return json(200, result);
    }

    if (method === 'DELETE' && planMatch) {
      const { session, key } = await requireWrite(req);
      const expected = url.searchParams.has('version') ? Number(url.searchParams.get('version')) : null;
      const result = await idempotent(session.subjectHash, key, () => repository.deletePlan(session.subjectHash, planMatch[1], expected));
      if (result.conflict) return json(409, { code: 'version_conflict', message: 'Облачная версия изменилась.', ...result });
      return json(200, result);
    }

    if (method === 'GET' && url.pathname === '/v1/account/export') {
      requireOrigin(req);
      const session = await getSession(req);
      if (!session) throw httpError(401, 'authentication_required', 'Нужен вход через Яндекс ID.');
      const payload = await repository.exportAccount(session.subjectHash);
      return json(200, { exportedAt: new Date(clock()).toISOString(), ...payload });
    }

    if (method === 'POST' && url.pathname === '/v1/logout') {
      const { session } = await requireWrite(req);
      await repository.deleteSession(session.id);
      return json(200, { loggedOut: true }, { 'set-cookie': [clearSession] });
    }

    if (method === 'DELETE' && url.pathname === '/v1/account') {
      const { session } = await requireWrite(req);
      // Удаление должно стирать и журнал идемпотентности. Не записываем ответ
      // после операции обратно: это заново создало бы данные удалённой учётки.
      await repository.deleteAccount(session.subjectHash);
      return json(200, { deleted: true }, { 'set-cookie': [clearSession] });
    }

    return json(404, { code: 'not_found', message: 'Такого API-метода нет.' });
  }

  return async (req) => {
    const requestId = randomToken(9);
    const cors = {
      'access-control-allow-origin': config.frontendOrigin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': 'content-type, x-csrf-token, idempotency-key',
      'access-control-max-age': '600',
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-request-id': requestId,
    };
    try {
      const response = await handle(req);
      return { ...response, headers: { ...cors, ...response.headers } };
    } catch (error) {
      const status = Number(error?.status || (error?.code === 'plan_limit' ? 422 : 500));
      if (status >= 500) console.error(JSON.stringify({ level: 'error', requestId, code: error?.code || 'internal_error' }));
      return json(status, {
        code: error?.code || 'internal_error',
        message: status >= 500 ? 'Временная ошибка сервера.' : error.message,
        requestId,
      }, cors);
    }
  };
}
