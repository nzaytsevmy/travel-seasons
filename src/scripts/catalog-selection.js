import { readSelection, normalizeSelection, selectDestinations, directionForMonth, selectionParams, destinationCountWord } from '../utils/destination-selection.js';
const initialized = new WeakSet();
function init() {
  const host = document.getElementById('catalogData');
  if (!host || initialized.has(host)) return;
  initialized.add(host);
  const rows = JSON.parse(host.textContent);
  const grid = document.getElementById('cgrid');
  const cards = new Map([...grid.querySelectorAll('.cd')].map(c => [c.dataset.slug, c]));
  const search = document.getElementById('catSearch');
  const clear = document.getElementById('catSearchClear');
  const month = document.getElementById('catMonth');
  const budget = document.getElementById('catMaxBudget');
  let state = readSelection(location.search);
  function apply(write = false) {
    const selected = selectDestinations(rows, state);
    const shown = new Set(selected.map(r => r.slug));
    for (const row of rows) {
      const c = cards.get(row.slug);
      c.hidden = !shown.has(row.slug);
      const r = directionForMonth(row, state.m);
      c.dataset.budget = r.budget ?? '';
      const a = c.querySelector('.cd-price');
      a.textContent = `≈ ${(r.budget ?? r.knownBudget).toLocaleString('ru-RU')} ₽ ${r.budget === null ? 'без ' + r.budgetExclusions : '/ неделя'}`;
      a.href = r.calcUrl;
      const badge = c.querySelector('.cd-sq');
      badge.hidden = !state.m;
      badge.textContent = r.code === 'P' ? 'Пик сезона' : r.code === 'G' ? 'Хороший сезон' : '';
    }
    for (const r of selected) grid.append(cards.get(r.slug));
    if (search.value !== state.q) search.value = state.q;
    clear.hidden = !state.q;
    month.value = String(state.m); budget.value = String(state.max_budget);
    document.querySelectorAll('.cf-opts[data-g] .cf-t').forEach(b => {
      const key = b.closest('[data-g]').dataset.g;
      const on = state[key] === b.dataset.v;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('[data-s]').forEach(b => { const on = b.dataset.s === state.sort; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    document.getElementById('catN').textContent = String(selected.length);
    document.getElementById('catW').textContent = destinationCountWord(selected.length);
    document.querySelectorAll('[data-visa-count]').forEach(counter => {
      counter.textContent = String(selectDestinations(rows, { ...state, visa: counter.dataset.visaCount }).length);
    });
    document.getElementById('catEmpty').hidden = selected.length > 0;
    if (write) {
      const u = new URL(location.href);
      for (const k of ['q', 'm', 'visa', 'vibe', 'max_budget', 'b', 'sort']) u.searchParams.delete(k);
      for (const [k, v] of selectionParams(state)) u.searchParams.set(k, v);
      history.replaceState(null, '', u);
    }
  }
  search.addEventListener('input', () => { state.q = search.value.slice(0, 160); apply(true); });
  clear.addEventListener('click', () => { state.q = ''; apply(true); search.focus(); });
  month.addEventListener('change', () => { state.m = Number(month.value); apply(true); });
  budget.addEventListener('change', () => { state.max_budget = Number(budget.value); apply(true); });
  document.querySelectorAll('.cf-opts[data-g]').forEach(group => group.addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    const key = group.dataset.g;
    state[key] = state[key] === b.dataset.v ? (key === 'visa' ? 'any' : '') : b.dataset.v;
    apply(true);
  }));
  document.getElementById('catSort').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) { state.sort = b.dataset.s; apply(true); } });
  document.getElementById('catReset').addEventListener('click', () => { state = normalizeSelection(); apply(true); });
  window.addEventListener('popstate', () => { if (!host.isConnected) return; state = readSelection(location.search); apply(); });
  apply();
}
init();
document.addEventListener('astro:page-load', init);
