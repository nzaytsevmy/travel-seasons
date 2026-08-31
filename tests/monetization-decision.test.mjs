import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateExperimentDecision } from '../src/data/monetization.js';
import { runDecisionGate } from '../scripts/monetization-decision-gate.mjs';

const experiment = {
  id: 'monetization_aa_click_join_v1',
  kind: 'aa',
  variants: ['a', 'b'],
  expectedAllocation: { a: 0.5, b: 0.5 },
  srmAlpha: 0.01,
  minimumSampleSize: 2000,
  minimumDetectableEffect: 0.2,
  aaEquivalenceMargin: 0.2,
  power: 0.8,
  attributionThreshold: 0.95,
  startedAt: '2026-09-01',
  fixedEndAt: '2026-09-14',
  requiredGuardrails: ['seo', 'cwv', 'errors'],
};

const matureRows = [
  {
    partner: 'aviasales', orderId: 'TP-1', clickId: 'c00112233445566778899', clickDate: '2026-09-02',
    status: 'paid', monetaryValueKnown: true,
  },
];

function evaluate(overrides = {}) {
  return evaluateExperimentDecision({
    experiment,
    assignmentCounts: { a: 1000, b: 1000 },
    joinStats: { total: 1, matched: 1, missing: 0, ambiguous: 0, coverage: 1 },
    revenueRows: matureRows,
    asOfDate: '2026-10-20',
    maturityDaysByPartner: { aviasales: 30 },
    guardrails: { seo: true, cwv: true, errors: true },
    effectInterval: { lower: -0.05, upper: 0.07 },
    ...overrides,
  });
}

test('полный A/A-контракт разрешает только переход к A/B, а не объявляет денежного победителя', () => {
  const result = evaluate();
  assert.equal(result.ready, true);
  assert.equal(result.status, 'aa_validated');
  assert.equal(result.winnerAllowed, false);
  assert.deepEqual(result.blockers, []);
});

test('недостаточная выборка блокирует решение', () => {
  const result = evaluate({ assignmentCounts: { a: 400, b: 410 } });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((item) => item.code === 'insufficient_sample'));
});

test('Sample Ratio Mismatch блокирует решение', () => {
  const result = evaluate({ assignmentCounts: { a: 1300, b: 700 } });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((item) => item.code === 'srm'));
});

test('потерянный или неоднозначный join блокирует решение', () => {
  const result = evaluate({ joinStats: { total: 20, matched: 18, missing: 1, ambiguous: 1, coverage: 0.9 } });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((item) => item.code === 'attribution_coverage'));
  assert.ok(result.blockers.some((item) => item.code === 'ambiguous_join'));
});

test('незрелый заказ блокирует решение', () => {
  const result = evaluate({
    asOfDate: '2026-09-20',
    revenueRows: [{ ...matureRows[0], clickDate: '2026-09-10', status: 'processing' }],
  });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((item) => item.code === 'immature_revenue'));
});

test('непройденный guardrail блокирует решение', () => {
  const result = evaluate({ guardrails: { seo: true, cwv: false, errors: true } });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((item) => item.code === 'guardrail'));
});

test('A/B не получает победителя без заранее заданного интервала эффекта', () => {
  const result = evaluate({ experiment: { ...experiment, kind: 'ab' }, effectInterval: null });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((item) => item.code === 'effect_interval'));
});

test('A/A блокируется, если интервал не укладывается в заранее заданный margin', () => {
  const result = evaluate({ effectInterval: { lower: -0.1, upper: 0.25 } });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some((item) => item.code === 'aa_equivalence'));
});

test('машинный гейт сводит raw action только с кликом своего эксперимента', () => {
  const result = runDecisionGate({
    experiment,
    assignmentCounts: { a: 1000, b: 1000 },
    actions: [{
      partner: 'aviasales', action_id: 'TP-1', state: 'paid', commission_rub: '100',
      sub_id: 'tt2__cta_1__monetization_aa_click_join_v1__a__c00112233445566778899',
    }],
    clickEvents: [{
      click_id: 'c00112233445566778899', event_time: '2026-09-02T10:00:00+03:00', event_count: 1,
    }],
    asOfDate: '2026-10-20',
    maturityDaysByPartner: { aviasales: 30 },
    guardrails: { seo: true, cwv: true, errors: true },
    effectInterval: { lower: -0.05, upper: 0.07 },
  });
  assert.equal(result.ready, true);
  assert.equal(result.metrics.attributionCoverage, 1);
});
