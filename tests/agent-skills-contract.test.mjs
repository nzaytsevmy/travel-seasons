import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = resolve(root, '.agents/skills');
const expected = [
  'traveltribe-revenue-analysis',
  'traveltribe-seo-growth',
  'traveltribe-visual-release',
];

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'SKILL.md должен начинаться с YAML frontmatter');
  const pairs = Object.fromEntries(match[1].split('\n').map((line) => {
    const separator = line.indexOf(':');
    assert.ok(separator > 0, `неверная строка frontmatter: ${line}`);
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    return [key, value];
  }));
  return pairs;
}

test('repo содержит три обязательных сфокусированных TravelTribe skill', async () => {
  const dirs = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const name of expected) assert.ok(dirs.includes(name), `нет skill ${name}`);
});

test('skill метаданные валидны, ссылки существуют, scaffold не остался', async () => {
  const descriptions = new Set();

  for (const name of expected) {
    const folder = resolve(skillsRoot, name);
    const skillPath = resolve(folder, 'SKILL.md');
    const markdown = await readFile(skillPath, 'utf8');
    const meta = frontmatter(markdown);

    assert.equal(meta.name, name);
    assert.ok(meta.description.length >= 80 && meta.description.length <= 500);
    assert.ok(!/TODO|placeholder|help with/i.test(markdown));
    assert.ok(!markdown.includes('/Users/'), 'skill не должен зависеть от пути одного компьютера');
    assert.ok(!descriptions.has(meta.description), 'описания skill должны различаться');
    descriptions.add(meta.description);

    const links = [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
      .map((match) => match[1])
      .filter((link) => !/^(?:https?:|#)/.test(link));
    assert.ok(links.length >= 3, `${name}: нужны ссылки на живые источники истины`);
    for (const link of links) await access(resolve(folder, link));

    const ui = await readFile(resolve(folder, 'agents/openai.yaml'), 'utf8');
    assert.match(ui, /display_name:\s*"TravelTribe:/);
    assert.ok(!/Help with|TODO/i.test(ui));
  }
});

test('маршрутизационные кейсы покрывают активацию и соседние навыки', async () => {
  const prompts = new Set();

  for (const name of expected) {
    const file = resolve(skillsRoot, name, 'references/evaluation-cases.json');
    const suite = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(suite.skill, name);
    assert.ok(Array.isArray(suite.cases) && suite.cases.length >= 5);

    const positive = suite.cases.filter((item) => item.shouldActivate === true);
    const negative = suite.cases.filter((item) => item.shouldActivate === false);
    assert.ok(positive.length >= 3, `${name}: недостаточно позитивных кейсов`);
    assert.ok(negative.length >= 2, `${name}: недостаточно негативных кейсов`);

    for (const item of suite.cases) {
      assert.equal(typeof item.prompt, 'string');
      assert.ok(item.prompt.length >= 20);
      assert.ok(!prompts.has(item.prompt), `повтор кейса: ${item.prompt}`);
      prompts.add(item.prompt);
      assert.ok(Array.isArray(item.mustDemonstrate) && item.mustDemonstrate.length >= 1);
      assert.ok(item.mustDemonstrate.every((value) => typeof value === 'string' && value.length >= 3));
    }
  }
});
