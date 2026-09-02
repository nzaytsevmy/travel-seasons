import test from 'node:test';
import assert from 'node:assert/strict';
import { volatileDeadline } from '../scripts/revision-queue.mjs';

test('точечный срок изменчивого факта важнее общего цикла статьи', () => {
  const frontmatter = `
volatileFacts:
  - id: flight-price
    checkedAt: 2026-09-02
    reviewAfter: 2026-09-09
    fallback: "Снять сумму и оставить способ поиска"
  - id: climate-outlook
    checkedAt: 2026-09-02
    reviewAfter: 2026-10-01
    fallback: "Заменить бюллетень или убрать прогноз"
`;

  assert.deepEqual(volatileDeadline(frontmatter), {
    due: '2026-09-09',
    id: 'flight-price',
  });
});

test('без volatileFacts очередь использует обычный срок', () => {
  assert.equal(volatileDeadline('title: "Гайд"\n'), null);
});
