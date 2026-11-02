import { execFileSync } from 'node:child_process';

// These inputs affect the calculator's rendered content or calculation.
export const CALCULATOR_INPUTS = [
  'src/pages/calculator.astro', 'src/scripts/calculator.js', 'src/utils/calculator-examples.js', 'src/utils/calculator-source-navigation.js',
  'src/data/calculator-price-provenance.json', 'src/utils/personal-budget.js',
  'src/utils/trip-budget.js', 'src/utils/budget-rates.js', 'src/data/budget-rates.json',
  'scripts/calculator-freshness.mjs',
];

export function calculatorSourceDate() {
  try {
    const timestamp = execFileSync('git', ['log', '-1', '--format=%ct', '--',
      ...CALCULATOR_INPUTS.map(path => `:(literal)${path}`)], { encoding:'utf8' }).trim();
    return timestamp ? new Date(Number(timestamp) * 1000) : null;
  } catch { return null; }
}

export function calculatorLastModified(...values) {
  const dates = values.filter(Boolean).map(value => new Date(value)).filter(value => Number.isFinite(value.valueOf()));
  return dates.length ? new Date(Math.max(...dates.map(value => value.valueOf()))) : null;
}
