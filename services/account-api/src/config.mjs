const required = (env, name) => {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const get = (name, fallback = '') => production ? required(env, name) : (env[name]?.trim() || fallback);
  return {
    production,
    port: Number(env.PORT || 8080),
    frontendOrigin: get('FRONTEND_ORIGIN', 'http://localhost:4322'),
    publicApiOrigin: get('PUBLIC_API_ORIGIN', 'http://localhost:8080'),
    yandexClientId: get('YANDEX_CLIENT_ID', 'test-client'),
    yandexClientSecret: get('YANDEX_CLIENT_SECRET', 'test-secret'),
    sessionHmacSecret: get('SESSION_HMAC_SECRET', 'local-session-secret-change-me'),
    subjectHmacSecret: get('SUBJECT_HMAC_SECRET', 'local-subject-secret-change-me'),
    repository: env.REPOSITORY || (env.YDB_CONNECTION_STRING ? 'ydb' : 'memory'),
    ydbConnectionString: env.YDB_CONNECTION_STRING || '',
    migrateOnStart: env.RUN_MIGRATIONS === 'true',
    sessionIdleMs: 30 * 24 * 60 * 60 * 1000,
    sessionAbsoluteMs: 90 * 24 * 60 * 60 * 1000,
    oauthStateMs: 10 * 60 * 1000,
    maxBodyBytes: 64 * 1024,
    maxPlans: 20,
    allowedReturnPrefixes: ['/my/', '/routes/'],
  };
}
