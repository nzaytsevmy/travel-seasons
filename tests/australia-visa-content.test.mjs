import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../src/content/blog/australia-visa-2026.mdx', import.meta.url), 'utf8');
const body = raw.split('---').slice(2).join('---');
const howTo=raw.slice(raw.indexOf('\nhowto:\n')+1,raw.indexOf('\n---\n',4));

test('гостевая виза: полис не представлен универсальным условием принятия заявки', () => {
  assert.ok(!/без него заявку не примут|полис прикладывают к пакету документов/i.test(body), 'полис ошибочно назван обязательным для принятия любой заявки');
  assert.ok(/8501/.test(body), 'отсутствует оговорка об индивидуальном условии 8501');
  assert.ok(/если[^.\n]*8501|8501[^.\n]*если/i.test(body), 'обязательность не привязана к условию конкретной визы');
});

test('сроки рассмотрения категории не превращены в минимальный срок для российского заявителя', () => {
  assert.ok(!/38 дней[^.\n]*нижн|38 дней считайте нижн|38 дней это нижн/i.test(body), 'процентиль категории выдан за нижнюю границу');
});

test('визовый сбор указан в валюте департамента одинаково в тексте и схеме', () => {
  const svg = readFileSync(new URL('../src/content/blog/_images/australia-visa/visa-cost-time.svg', import.meta.url), 'utf8');
  assert.ok(howTo.startsWith('howto:\n'), 'проверка должна охватывать structured HowTo');
  for (const [name,text] of [['проза',body],['схема',svg],['HowTo',howTo]]) {
    const fees=[...text.matchAll(/\bAUD\s+(\d+)/g)].map(m=>Number(m[1]));
    assert.ok(fees.length>0, `${name}: отсутствует сумма в валюте департамента`);
    assert.deepEqual([...new Set(fees)],[250],`${name}: сумма не соответствует проверенному сбору`);
    assert.ok(!/AUD\s*250[^\n<>]{0,50}(?:₽|рубл)/i.test(text), `${name}: к сбору приписан неподтверждённый рублёвый пересчёт`);
  }
});

test('схемы и HowTo не возвращают удалённые обещания о сроках, оплате и полной стоимости', () => {
  const path = readFileSync(new URL('../src/content/blog/_images/australia-visa/application-path.svg', import.meta.url), 'utf8');
  const cost = readFileSync(new URL('../src/content/blog/_images/australia-visa/visa-cost-time.svg', import.meta.url), 'utf8');
  assert.ok(!/18 дней|38[^<.]*дней|38 у девяноста/i.test(path), 'в схеме сохранилась устаревшая статистика рассмотрения');
  assert.ok(!/карты (?:российских|банков РФ)[^<.]*не проходят/i.test(raw + path), 'в HowTo или схеме категоричный запрет карт РФ');
  assert.ok(!/на всё около 15 000/i.test(cost), 'сбор ошибочно выдан за полную стоимость оформления');
});
