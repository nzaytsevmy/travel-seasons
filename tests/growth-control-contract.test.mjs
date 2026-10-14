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

test('поисковая выдача не блокирует интересную новость', async () => {
  const [prompt, rubric, projectRules, seoRules] = await Promise.all([
    read('NEWS-SELECTION-PROMPT.md'),
    read('news/RUBRIC.md'),
    read('CLAUDE.md'),
    read('SEO-CHECKLIST-2026.md'),
  ]);

  assert.match(prompt, /выдача — диагностика канала, не редакционный гейт/i);
  assert.match(prompt, /оценк(?:ой|а) 3\+/i);
  assert.doesNotMatch(prompt, /нейроответом[^\n]{0,160}тему пропустить/i);
  assert.doesNotMatch(prompt, /целиком закрыто нейроответом/i);
  assert.match(rubric, /нейроответ[^\n]{0,180}не (?:меняют|меняет) оценку/i);
  assert.match(projectRules, /для новостной ленты[^\n]{0,220}не стоп-кран/i);
  assert.match(seoRules, /для новостной ленты[^\n]{0,220}не стоп-кран/i);
});

test('редакционный режим согласован, квота отменена без ослабления качества', async () => {
  const [prompt, rubric, projectRules, configRaw, cap, control] = await Promise.all([
    read('NEWS-SELECTION-PROMPT.md'), read('news/RUBRIC.md'), read('CLAUDE.md'),
    read('news/config.json'), read('scripts/news-cap.mjs'), read('GROWTH-CONTROL.md'),
  ]);
  const config = JSON.parse(configRaw);
  assert.equal(config.selectionMode, 'editorial');
  assert.equal(config.targetPerDay, null);
  assert.equal(config.maxPerDay, null);
  assert.equal(config.minScore, 3);
  assert.match(control, /`news_quota`:\s*\*\*null\*\*/);
  assert.match(control, /`news_selection_mode`:\s*\*\*editorial\*\*/);
  for (const text of [prompt, rubric, projectRules]) {
    assert.match(text, /14\.10\.2026/);
    assert.match(text, /news_quota/);
    assert.match(text, /независим/i);
    assert.doesNotMatch(text, /максимум 5 заметок в день|пять, решение Никиты 11\.09\.2026, насовсем/i);
  }
  assert.doesNotMatch(cap, /unlinkSync|rmSync|dropped_over_cap|deficit/);
  assert.match(cap, /NOT_ATTEMPTED/);
  assert.match(prompt, /не останавливаться после первой принятой темы/i);
  assert.match(prompt, /капсула ответа \*\*40–60 слов\*\*/i);
  assert.match(rubric, /заметка — 150–350 слов[^\n]{0,80}до 600/i);
  assert.match(projectRules, /новостная заметка 150–350/i);
  assert.doesNotMatch(projectRules, /новостная заметка 600–1200/i);
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

test('пустая очередь гайдов запускает восстановление без тихих пропусков', async () => {
  const [control, prompt, queue] = await Promise.all([
    read('GROWTH-CONTROL.md'),
    read('GUIDES-ROUTES-PROMPT.md'),
    read('GUIDES-ROUTES-QUEUE.md'),
  ]);

  assert.match(control, /пустая очередь[^\n]+не[^\n]+основани[^\n]+HOLD/i);
  assert.match(control, /QUEUE_RECOVERY/);
  assert.match(prompt, /QUEUE_RECOVERY/);
  assert.match(prompt, /SEMANTIC-CORE\.md[\s\S]{0,100}(?:радар|RADAR)/i);
  assert.match(prompt, /принят[\s\S]{0,80}отклон[\s\S]{0,80}отлож/i);
  assert.match(prompt, /ни один кандидат[^\n]+(?:не пропуска|без записи)/i);
  assert.match(queue, /реестр покрытия кандидатов/i);
  assert.match(queue, /принят[\s\S]{0,80}отклон[\s\S]{0,80}отлож/i);
  assert.match(queue, /пустая очередь[^\n]+не[^\n]+HOLD/i);
});

test('основной денежный гейт включает контракт недельного управления', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.match(pkg.scripts['check:monetization'], /growth-control-contract\.test\.mjs/);
});
