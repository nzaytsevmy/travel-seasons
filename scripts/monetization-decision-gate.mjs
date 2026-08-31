#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateExperimentDecision, joinRevenueRowsToClicks, parseClickAttribution } from '../src/data/monetization.js';

function argsOf(argv) {
  const args = { input: '', output: '' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--input') args.input = argv[++i] ?? '';
    if (argv[i] === '--output') args.output = argv[++i] ?? '';
  }
  return args;
}

export function runDecisionGate(input) {
  const actions = (input.actions ?? []).filter((row) => (
    parseClickAttribution(row.sub_id ?? row.subId).experimentId === input.experiment?.id
  ));
  const joined = joinRevenueRowsToClicks(actions, input.clickEvents ?? []);
  return evaluateExperimentDecision({
    experiment: input.experiment,
    assignmentCounts: input.assignmentCounts,
    joinStats: joined.stats,
    revenueRows: joined.rows,
    asOfDate: input.asOfDate,
    maturityDaysByPartner: input.maturityDaysByPartner,
    guardrails: input.guardrails,
    effectInterval: input.effectInterval,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const args = argsOf(process.argv.slice(2));
  if (!args.input) {
    console.error('Нужен --input с JSON-контрактом эксперимента.');
    process.exitCode = 2;
  } else {
    const result = runDecisionGate(JSON.parse(readFileSync(resolve(args.input), 'utf8')));
    const rendered = `${JSON.stringify(result, null, 2)}\n`;
    if (args.output) writeFileSync(resolve(args.output), rendered);
    else process.stdout.write(rendered);
    if (!result.ready) process.exitCode = 2;
  }
}
