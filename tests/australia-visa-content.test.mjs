import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../src/content/blog/australia-visa-2026.mdx', import.meta.url), 'utf8');
const body = raw.split('---').slice(2).join('---');

test('гостевая виза: полис не представлен универсальным условием принятия заявки', () => {
  assert.ok(!/без него заявку не примут|полис прикладывают к пакету документов/i.test(body), 'полис ошибочно назван обязательным для принятия любой заявки');
  assert.ok(/8501/.test(body), 'отсутствует оговорка об индивидуальном условии 8501');
  assert.ok(/если[^.\n]*8501|8501[^.\n]*если/i.test(body), 'обязательность не привязана к условию конкретной визы');
});

test('сроки рассмотрения категории не превращены в минимальный срок для российского заявителя', () => {
  assert.ok(!/38 дней[^.\n]*нижн|38 дней считайте нижн|38 дней это нижн/i.test(body), 'процентиль категории выдан за нижнюю границу');
});

test('одно и то же значение визового сбора имеет согласованный рублёвый ориентир в тексте и схеме', () => {
  const svg = readFileSync(new URL('../src/content/blog/_images/australia-visa/visa-cost-time.svg', import.meta.url), 'utf8');
  const sums = [...(body + '\n' + svg).matchAll(/AUD\s*250[^\n<>]{0,25}?([1-9]\d[ \u00a0]\d{3})\s*₽/g)]
    .map(m => m[1].replace(/[ \u00a0]/g, ''));
  assert.ok(sums.length >= 2, 'проверка должна охватывать прозу и изображение');
  assert.equal(new Set(sums).size, 1, `разные ориентиры одного сбора: ${sums.join(', ')}`);
});

test('схемы и HowTo не возвращают удалённые обещания о сроках, оплате и полной стоимости', () => {
  const path = readFileSync(new URL('../src/content/blog/_images/australia-visa/application-path.svg', import.meta.url), 'utf8');
  const cost = readFileSync(new URL('../src/content/blog/_images/australia-visa/visa-cost-time.svg', import.meta.url), 'utf8');
  assert.ok(!/18 дней|38[^<.]*дней|38 у девяноста/i.test(path), 'в схеме сохранилась устаревшая статистика рассмотрения');
  assert.ok(!/карты (?:российских|банков РФ)[^<.]*не проходят/i.test(raw + path), 'в HowTo или схеме категоричный запрет карт РФ');
  assert.ok(!/на всё около 15 000/i.test(cost), 'сбор ошибочно выдан за полную стоимость оформления');
});
