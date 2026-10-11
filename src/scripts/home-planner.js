import { formatRecommendationCount, homeCollections, readSelection, normalizeSelection, moscowMonth, MONTHS_PREP, VISA_LABELS, catalogHref, selectionParams  } from '../utils/destination-selection.js';
import { allocateHomePhotos } from '../data/home-journal.js';
import { destinationStay } from '../utils/destination-stay.js';

const initialized = new WeakSet();
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const budgetFormat = new Intl.NumberFormat('ru-RU');
const fmt = n => budgetFormat.format(n);
function card(row, placement, lodging, lead = false) {
  const p = row.photo;
  const stay = destinationStay(row.slug, `home_${placement}_${row.slug}`);
  return `<article class="home-card" data-destination="${esc(row.slug)}" data-budget="${row.budget ?? ''}" data-photo-file="${esc(p.key)}">
    <a class="home-card-photo" href="/${esc(row.slug)}/" data-home-action="guide" aria-label="Гид: ${esc(row.nom)}"><img src="${esc(p.src)}" srcset="${esc(p.srcset)}" sizes="${lead ? '(max-width:767px) 92vw, (max-width:1023px) 62vw, 760px' : '(max-width:767px) 46vw, (max-width:1023px) 30vw, 360px'}" width="${p.width}" height="${p.height}" alt="${esc(p.alt)}" loading="lazy" decoding="async" style="--focal:${esc(p.position)};--focal-mobile:${esc(p.mobilePosition || p.position)}"></a>
    <div class="home-card-text"><h3><a href="/${esc(row.slug)}/" data-home-action="guide">${esc(row.nom)}</a></h3><p class="home-season">${esc(row.seasonReason)}</p>
    <a class="home-budget pprice" href="${esc(row.calcUrl)}" data-home-action="budget">≈ ${fmt(row.budget ?? row.knownBudget)} ₽ ${row.budget === null ? 'без ' + esc(row.budgetExclusions) : '/ неделя'}</a>
    <a class="home-entry" href="/visa/${esc(row.slug)}/">${VISA_LABELS[row.visa]}</a>
    ${lodging ? `<a class="home-stay" href="${esc(stay.href)}" data-destination="${esc(row.slug)}" data-intent="high" data-placement="${placement}" data-cta-id="home_${row.slug.replace(/-/g, '_')}_stay_${placement}" rel="noopener sponsored" target="_blank">Посмотреть жильё</a>` : ''}</div></article>`;
}
function init() {
  const host = document.getElementById('homeData');
  if (!host || initialized.has(host)) return;
  initialized.add(host);
  const bootstrap = JSON.parse(host.textContent);
  const { month } = bootstrap;
  let rows, pools, reserved, dataPromise;
  async function planningData() {
    if (!dataPromise) dataPromise = bootstrap.rows ? Promise.resolve(bootstrap) :
      fetch(bootstrap.dataUrl, { credentials: 'same-origin' }).then(async response => {
        if (!response.ok) throw new Error('Planner data unavailable');
        const payload = await response.json();
        if (!Array.isArray(payload.rows) || !payload.pools || !Array.isArray(payload.reserved)) throw new Error('Invalid planner data');
        return payload;
      });
    try { return await dataPromise; }
    catch (error) { dataPromise = null; throw error; }
  }
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('tt_home_selection')); } catch { /* storage unavailable */ }
  const hasQuery = ['m', 'max_budget', 'visa', 'vibe'].some(k => new URLSearchParams(location.search).has(k));
  let state = hasQuery ? readSelection(location.search, moscowMonth()) : normalizeSelection(saved || { m: moscowMonth() }, moscowMonth());
  function updateNavigation() {
    document.getElementById('homeCatalog').href = catalogHref(state);
    document.getElementById('homeFreeCatalog').href = catalogHref({ m: state.m, visa: 'free' });
    document.getElementById('homeCheapCatalog').href = catalogHref({ m: state.m, sort: 'asc' });
    document.querySelectorAll('[data-home-vibe]').forEach(a => { a.href = catalogHref(state, { vibe: a.dataset.homeVibe }); });
    document.querySelectorAll('.home-budget, [data-home-calculator]').forEach(a => {
      const target = new URL(a.href, location.href);
      target.searchParams.set('m', String(state.m));
      a.href = `${target.pathname}${target.search}${target.hash}`;
    });
  }
  async function render(write = false, reuseServerCards = false) {
    state.m ||= moscowMonth();
    // Navigation must preserve the request while the seasonal card data is loading.
    updateNavigation();
    const requested = { ...state };
    const error = document.getElementById('homeLoadError');
    if (!reuseServerCards) {
      try { ({ rows, pools, reserved } = await planningData()); }
      catch {
        error.hidden = false;
        error.querySelector('a').href = catalogHref(requested);
        state = normalizeSelection({ m: month });
        updateNavigation();
        try { sessionStorage.setItem('tt_home_selection', JSON.stringify(state)); sessionStorage.removeItem('tt_home_journey'); } catch { /* storage unavailable */ }
        document.body.dataset.journeySource = 'home_planner';
        return;
      }
    }
    error.hidden = true;
    if (!reuseServerCards) {
    const c = allocateHomePhotos(homeCollections(rows, state), pools, reserved, state.m);
    document.getElementById('homeRecommendations').innerHTML = c.recommendations.map((r, i) => card(r, 'recommendation', true, i === 0)).join('');
    document.getElementById('homeFree').innerHTML = c.free.map(r => card(r, 'visa_free', false)).join('');
    document.getElementById('homeCheap').innerHTML = c.cheap.map(r => card(r, 'budget', true)).join('');
    document.getElementById('homeResultCount').textContent = `${formatRecommendationCount(c.recommendations.length)}${state.vibe ? ' под выбранный отдых' : ''} · хороший или пиковый сезон`;
    document.getElementById('homeEmpty').hidden = c.recommendations.length > 0;
    document.querySelectorAll('[data-home-month]').forEach(e => { e.textContent = MONTHS_PREP[state.m]; });
    document.querySelectorAll('[data-home-calculator]').forEach(a => { a.href = c.recommendations[0]?.calcUrl || `/calculator/?m=${state.m}`; });
    }
    try { sessionStorage.setItem('tt_home_selection', JSON.stringify(state)); sessionStorage.setItem('tt_home_journey', String(Date.now())); } catch { /* storage unavailable */ }
    // Существующий идентификатор пути сохраняется для совместимости отчётов.
    document.body.dataset.journeySource = 'home_planner';
    if (write) {
      const u = new URL(location.href);
      for (const k of ['m', 'max_budget', 'visa', 'vibe']) u.searchParams.delete(k);
      for (const [k, v] of selectionParams(state)) u.searchParams.set(k, v);
      history.replaceState(null, '', u);
    }
    document.dispatchEvent(new CustomEvent('tt:affiliate-links-updated'));
  }
  document.getElementById('homeReset').addEventListener('click', () => { state = normalizeSelection({ m: state.m }); render(true); });
  document.querySelector('.journal').addEventListener('click', e => {
    const a = e.target.closest('[data-home-action]');
    if (!a) return;
    const goal = a.dataset.homeAction === 'budget' ? 'home_budget_open' : 'home_guide_open';
    const destination = a.closest('[data-destination]')?.dataset.destination || '';
    if (typeof window.ym === 'function') window.ym(95832375, 'reachGoal', goal, { destination, month: state.m, journey_source: 'home_planner' });
  });
  window.addEventListener('popstate', () => { if (!host.isConnected) return; state = readSelection(location.search, moscowMonth()); render(); });
  // Preserve the already-rendered cards when the visitor has no different selection.
  render(false, selectionParams(state).toString() === selectionParams({ m: month }).toString());
}
init();
document.addEventListener('astro:page-load', init);
