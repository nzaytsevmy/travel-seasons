import test from 'node:test';
import assert from 'node:assert/strict';
import { headingStructure } from '../scripts/lib/heading-structure.mjs';
const main = inner => `<main><header><h1>Поездка</h1></header>${inner}</main>`;

test('flight route subsections must not jump from H2 to H4', () => {
  assert.deepEqual(headingStructure(main('<h2>Как добраться</h2><section><h4>Москва — Баку</h4></section>')).findings,
    [{ kind: 'heading.rank_jump', from: 2, to: 4, text: 'Москва — Баку' }]);
  assert.deepEqual(headingStructure(main('<h2>Как добраться</h2><section><h3>Москва — Баку</h3></section>')).findings, []);
});
test('closing subsections can return from H4 to H2; H5 and H6 work when nested', () => {
  assert.deepEqual(headingStructure(main('<h2>A</h2><h3>B</h3><h4>C</h4><h5>D</h5><h6>E</h6><h2>F</h2>')).findings, []);
});
test('empty inert panel heading is excluded until populated and opened', () => {
  assert.deepEqual(headingStructure(main('<h2>Сезоны</h2>')+'<aside role="dialog" inert><h2 id="panelTitle"></h2></aside>').findings, []);
  assert.deepEqual(headingStructure(main('<h2>Сезоны</h2>')+'<aside role="dialog"><h2 id="panelTitle"></h2></aside>').findings,
    [{ kind: 'heading.empty', level: 2, id: 'panelTitle' }]);
});
test('fixed navigation does not become the parent of article sections', () => {
  assert.deepEqual(headingStructure(main('<nav><h2>Содержание</h2></nav><h3>Нет родительского раздела</h3>')).findings.map(x=>x.kind), ['heading.rank_jump']);
  assert.deepEqual(headingStructure(main('<h2>A</h2><h3>B</h3><aside><h5>Связанные материалы</h5></aside><h3>C</h3>')).findings, []);
});
test('duplicate labels in separate sections are valid, entity-only and empty headings differ', () => {
  assert.deepEqual(headingStructure(main('<h2>Список</h2><h3>Аптечка</h3><h2>Советы</h2><h3>Аптечка</h3><h2>&#160;</h2>')).findings,
    [{ kind: 'heading.empty', level: 2, id: null }]);
});
test('hidden content and inert descendants do not create heading navigation stops', () => {
  assert.deepEqual(headingStructure(main('<div hidden><h6></h6></div><div aria-hidden="true"><h4></h4></div><dialog><h5></h5></dialog><h2>A</h2>')).findings, []);
  assert.equal(headingStructure(main('<h2>A</h2><div role="heading" aria-level="4" aria-label="Маршрут"></div>')).findings[0].to, 4);
});
