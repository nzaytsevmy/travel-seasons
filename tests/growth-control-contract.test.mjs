import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('недельный контролёр задаёт безопасный режим для каждого контура', async () => {
  const control = await read('GROWTH-CONTROL.md');

  assert.match(control, /publication_gate/i);
  assert.match(control, /monetization_decision_gate/i);
  assert.match(control, /news/i);
  assert.match(control, /article/i);
  assert.match(control, /brand/i);
  assert.match(control, /guide_route/i);
  assert.match(control, /RUN[\s\S]{0,120}HOLD/i);
  assert.match(control, /28[\s/]56/i);
  assert.match(control, /approved net revenue/i);
  assert.match(control, /не меняет расписан/i);
});

test('все редакционные промты читают недельное решение до выбора темы', async () => {
  const files = [
    'NEWS-SELECTION-PROMPT.md',
    'DAILY-ARTICLE-PROMPT.md',
    'BRAND-ARTICLE-PROMPT.md',
    'GUIDES-ROUTES-PROMPT.md',
  ];

  for (const file of files) {
    const prompt = await read(file);
    assert.match(prompt, /GROWTH-CONTROL\.md/, file);
    assert.match(prompt, /HOLD/i, file);
    assert.match(prompt, /до (?:выбора|поиска|начала)/i, file);
  }
});

test('очередь гайдов отделена от ежедневных статей', async () => {
  const [guides, daily] = await Promise.all([
    read('GUIDES-ROUTES-QUEUE.md'),
    read('DAILY-ARTICLE-QUEUE.md'),
  ]);

  assert.match(guides, /NEW_GUIDE/);
  assert.match(guides, /NEW_ROUTE/);
  assert.match(guides, /REVISE_GUIDE/);
  assert.match(guides, /HOLD/);
  assert.match(guides, /радар/i);
  assert.doesNotMatch(daily, /NEW_GUIDE|NEW_ROUTE|REVISE_GUIDE/);
});

test('основной денежный гейт включает контракт недельного управления', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.match(pkg.scripts['check:monetization'], /growth-control-contract\.test\.mjs/);
});
