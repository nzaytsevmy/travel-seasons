import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const api = read('services/account-api/src/app.mjs');
const consent = read('src/pages/legal/account-consent.astro');
const privacy = read('src/pages/legal/privacy.astro');
const cookies = read('src/pages/legal/cookie.astro');
const planner = read('src/components/RoutePlanner.astro');
const account = read('src/pages/my/index.astro');

test('версия отдельного согласия одинакова во frontend и backend', () => {
  for (const source of [api, consent, planner, account]) assert.match(source, /account_v2/);
  assert.match(cookies, /tt_account_consent_v2/);
  for (const source of [api, consent, cookies, planner, account]) assert.doesNotMatch(source, /account_v1/);
});

test('текст согласия честно описывает поля базового профиля Яндекс ID', () => {
  assert.match(api, /set\('scope', 'login:info'\)/);
  for (const field of ['идентификатор', 'логин', 'имя', 'фамили', 'пол']) {
    assert.match(consent.toLowerCase(), new RegExp(field));
    assert.match(privacy.toLowerCase(), new RegExp(field));
  }
  assert.match(consent, /email и телефон не запрашиваются/);
  assert.match(consent, /OAuth-токен[^.]+не сохраняются/);
  assert.doesNotMatch(`${consent}\n${planner}\n${account}`, /не запрашивает[^.]{0,40}имя/i);
});

test('облачный контур выключен без явного публичного флага', () => {
  assert.match(planner, /PUBLIC_ROUTE_SYNC_ENABLED === 'true'/);
  assert.match(account, /PUBLIC_ROUTE_SYNC_ENABLED === 'true'/);
  assert.match(planner, /Облачная синхронизация пока закрыта/);
  assert.match(account, /Облачная синхронизация пока закрыта/);
});
