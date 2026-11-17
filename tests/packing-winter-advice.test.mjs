import test from 'node:test';
import assert from 'node:assert/strict';
import { getPackingPageAdvice } from '../src/data/packing-page-advice.js';

test('Egypt winter packing separates beach, evening and excursion clothing', () => {
  for (const month of ['december', 'january']) {
    const advice = getPackingPageAdvice('egypt', month);
    assert.ok(advice, `No country-specific advice for egypt/${month}`);
    assert.match(advice.clothing.join(' '), /флис|свитер/i);
    assert.match(advice.clothing.join(' '), /ветровк/i);
    assert.match(advice.clothing.join(' '), /закрыт.*обув|кроссовк/i);
    assert.match(advice.summary, /Хургад/);
    assert.doesNotMatch(advice.monthText, /\+24|высокий сезон/i);
    assert.doesNotMatch(advice.rank.price, /Цены средние|минимальные|\d+%/);
  }
});

test('Egypt cold-season activity notes do not reuse summer heat or unrelated temple advice', () => {
  for (const month of ['november', 'december', 'january']) {
    const advice = getPackingPageAdvice('egypt', month);
    assert.ok(advice?.activityGear?.desert, `Missing desert override for ${month}`);
    assert.doesNotMatch(advice.activityGear.desert.join(' '), /60|обжигает/);
    assert.match(advice.activityGear.desert.join(' '), /тепл|тёпл|флис/i);
    assert.doesNotMatch(advice.activityGear.culture.join(' '), /будд/i);
  }
  assert.equal(getPackingPageAdvice('egypt', 'june'), null);
  assert.equal(getPackingPageAdvice('turkey', 'november').activityGear, undefined);
});
