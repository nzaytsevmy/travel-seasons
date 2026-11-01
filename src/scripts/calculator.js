import { calculateTripBudget, SEASON_MULT, tripInteger } from '../utils/trip-budget.js';
import { aviasalesRoute, cherehapaCountry } from '../data/affiliate.js';
import { destinationStay } from '../utils/destination-stay.js';
import { personalBudget, normalizeDraft, moneyToMinor, encodeBudgets, decodeBudgets } from '../utils/personal-budget.js';

// Inline-код может выполниться повторно после перехода Astro. На новой форме
// нужны обработчики, на уже инициализированной (включая bfcache) — только один набор.
const controllerKey = Symbol.for('traveltribe.calculator');
const controller = window[controllerKey] || (window[controllerKey] = { initialized: new WeakSet() });
const initialized = controller.initialized;
function initCalculator() {
  const host = document.getElementById('calculatorData');
  const form = document.getElementById('tcForm');
  if (!host || !form || initialized.has(form)) return;
  initialized.add(form);
  const { PRICES, MONTH_FULL, priceIdxToSeasons, priceIdxToVisa, priceIdxToSlug, rates } = JSON.parse(host.textContent);
let calcLevel = 0, calcCurrency = 'rub';
let travelers = 1, selectedMonth = 0;
let compareList = [];
let drafts = {};
let activeError = false;
const seenEvents = new Set();
const editor = document.getElementById('personalCosts');
const notice = document.getElementById('calcNotice');
const STORAGE = 'tt_calculator_personal_v1';
function indices() { return [parseInt(calcSel.value), ...compareList.filter(x => x !== +calcSel.value)].slice(0,3); }
function key(pi) { return priceIdxToSlug[pi] || `destination-${pi}`; }
function selectedDrafts() { return Object.fromEntries(indices().filter(pi => drafts[key(pi)]).map(pi => [key(pi),drafts[key(pi)]])); }
function event(action) {
  if (['start','result'].includes(action) && seenEvents.has(action)) return;
  seenEvents.add(action);
  const payload = { action, version: 'personal_v1', destination: key(+calcSel.value), mode: indices().length > 1 ? 'compare' : 'single' };
  document.dispatchEvent(new CustomEvent('tt:calculator-event', { detail: payload }));
  if (window.__analyticsEnabled && typeof window.ym === 'function') window.ym(95832375,'reachGoal',`calculator_${action}`,payload);
}
function changed() { event('start'); if (!activeError) event('result'); }
function message(text) { notice.textContent = text; }

const SEASON_LABEL = { P:'Пик', G:'Хорошо', O:'Норма', B:'Не сезон' };
const SEASON_CLASS = { P:'peak', G:'good', O:'ok', B:'bad' };

const CAT_COLORS = { flight: '#1d40ae', hotel: '#15171a', food: '#5c626b', visa: '#a8a294' };

const calcSel = document.getElementById('calcRegion');
const monthSel = document.getElementById('monthSelect');
const resultEl = document.getElementById('calcResult');
const addSelect = document.getElementById('addCountrySelect');

function readUrlParams() {
  const u = new URL(window.location.href);
  const r = u.searchParams.get('r'), d = u.searchParams.get('d');
  const l = u.searchParams.get('l'), c = u.searchParams.get('c');
  const t = u.searchParams.get('t'), m = u.searchParams.get('m');
  const cmp = u.searchParams.get('cmp');

  if (r !== null && r.trim() && Number.isInteger(+r) && PRICES[+r]) calcSel.value = String(+r);
  if (d !== null) {
    const n = tripInteger(d, 1, 90, 7);
    document.getElementById('calcDays').value = n;
    document.getElementById('calcDaysDisplay').textContent = n;
  }
  if (l !== null && Number.isInteger(+l) && (+l >= 0 && +l <= 2)) {
    calcLevel = +l;
    document.querySelectorAll('#levelGroup .tc-seg-btn').forEach(b => {
      const on = +b.dataset.lvl === calcLevel;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on?'true':'false');
    });
  }
  if (c === 'usd' || c === 'rub') {
    calcCurrency = c;
    document.querySelectorAll('#currGroup .tc-seg-btn').forEach(b => {
      const on = b.dataset.cur === calcCurrency;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on?'true':'false');
    });
  }
  if (t !== null && Number.isInteger(+t) && +t >= 1 && +t <= 4) {
    travelers = +t;
    document.getElementById('travelersDisplay').textContent = travelers;
  }
  if (m !== null && Number.isInteger(+m) && +m >= 0 && +m <= 12) {
    selectedMonth = +m;
    monthSel.value = String(selectedMonth);
  }
  if (cmp) compareList = [...new Set(cmp.split(',').map(x => Number(x)).filter(x => Number.isInteger(x) && PRICES[x]))].slice(0, 2);
}

function writeUrlParams() {
  const u = new URL(window.location.href);
  u.searchParams.set('r', calcSel.value);
  u.searchParams.set('d', document.getElementById('calcDays').value);
  u.searchParams.set('l', String(calcLevel));
  u.searchParams.set('c', calcCurrency);
  u.searchParams.set('t', String(travelers));
  if (selectedMonth > 0) u.searchParams.set('m', String(selectedMonth));
  else u.searchParams.delete('m');
  if (compareList.length > 0) u.searchParams.set('cmp', compareList.join(','));
  else u.searchParams.delete('cmp');
  u.hash = Object.keys(selectedDrafts()).length ? `budget=${encodeBudgets(selectedDrafts())}` : '';
  window.history.replaceState(null, '', u.toString());
}

function fmt(value) {
  if (!Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString(calcCurrency === 'rub' ? 'ru-RU' : 'en-US') + (calcCurrency === 'rub' ? '\u00a0₽' : '\u00a0$');
}

function flightUrl(pi) {
  return aviasalesRoute('MOW', PRICES[pi].iata, `calc_${priceIdxToSlug[pi]}_flight`, selectedMonth ? selectedMonth - 1 : undefined);
}
function partnerAttrs(pi, offer) {
  const slug = priceIdxToSlug[pi];
  return `data-destination="${escapeHtml(slug || '')}" data-intent="high" data-placement="calculator_result" data-cta-id="calc_${escapeHtml(slug || 'trip').replace(/-/g, '_')}_${offer}"`;
}
function stayUrl(pi) { return destinationStay(priceIdxToSlug[pi], `calc_${priceIdxToSlug[pi]}_stay`).href; }
function insuranceUrl(pi) { return cherehapaCountry(priceIdxToSlug[pi], `calc_${priceIdxToSlug[pi]}_insurance`); }

function computeForPriceIndex(pi) {
  const result = calculateTripBudget(PRICES[pi], {
    rates, days: document.getElementById('calcDays').value,
    travelers, level: calcLevel, month: selectedMonth, currency: 'rub',
    seasons: priceIdxToSeasons[pi], visa: priceIdxToVisa[pi],
  });
  const rating = selectedMonth ? priceIdxToSeasons[pi]?.[selectedMonth - 1] : null;
  const personal = personalBudget(result, drafts[key(pi)]);
  const scale = calcCurrency === 'rub' ? 100 : 100 * rates.USD;
  const category = id => personal.rows.find(r => r.id === id).minor / scale;
  const unknownCosts = personal.rows.filter(r => !r.known).map(r => r.id === 'insurance' && result.unknownCosts.some(c => /страхов/i.test(c)) ? 'Медицинская страховка' : r.label);
  return { ...result, personal, flightTotal: category('flight'), hotelTotal: category('hotel'), foodTotal: category('food'), visaTotal: category('entry'), mandatoryTotal: 0,
    knownTotal: personal.knownMinor / scale, grand: personal.complete ? personal.knownMinor / scale : null, unknownCosts,
    seasonLabel: SEASON_LABEL[rating] || '', seasonClass: SEASON_CLASS[rating] || '' };
}

function minorText(minor) { return fmt(minor / (calcCurrency === 'rub' ? 100 : 100 * rates.USD)); }
function inputText(minor) { return minor === null ? '' : (minor / (calcCurrency === 'rub' ? 100 : 100 * rates.USD)).toFixed(2).replace(/\.00$/, ''); }
function renderEditor() {
  if (!editor) return;
  const r = computeForPriceIndex(+calcSel.value), p = r.personal;
  editor.innerHTML = `<div class="tc-stay-settings">
    <label>Ночей<input id="personalNights" data-draft="nights" type="number" min="0" max="90" step="1" value="${p.nights}"></label>
    <label>Номеров<input id="personalRooms" data-draft="rooms" type="number" min="1" max="4" step="1" value="${p.draft.rooms}"></label>
    <label>Запас, %<input id="personalReserve" data-draft="reserve" type="number" min="0" max="100" step="1" value="${p.draft.reserve}"></label>
  </div><p class="tc-help">Проверь вместимость номера. Суммы можно заменить своими.</p>
  ${p.rows.map(row => `<div class="tc-expense ${row.excluded ? 'is-excluded' : ''}">
    <div class="tc-expense-main"><label for="cost-${row.id}">${row.label}<span>${row.unit} · ${calcCurrency === 'rub' ? '₽' : '$'}</span></label>
    <input id="cost-${row.id}" data-money="${row.id}" class="ym-disable-keys" type="text" inputmode="decimal" autocomplete="off" aria-describedby="error-${row.id}" value="${inputText(row.inputMinor)}" placeholder="Укажи сумму" ${row.excluded ? 'disabled' : ''}></div>
    <p class="tc-field-error" id="error-${row.id}"></p>
    <div class="tc-expense-actions"><label><input type="checkbox" data-paid="${row.id}" ${row.paid ? 'checked' : ''} ${!row.known || row.excluded ? 'disabled' : ''}> Оплачено</label>
    ${!row.required && !['flight','hotel','food'].includes(row.id) ? `<label><input type="checkbox" data-exclude="${row.id}" ${row.excluded ? 'checked' : ''}> Не учитывать</label>` : ''}
    <button type="button" data-reset="${row.id}" ${row.custom ? '' : 'hidden'}>Вернуть оценку</button>
    <span>${row.known ? minorText(row.minor) : 'Не учтено'}</span></div>
  </div>`).join('')}`;
}

function findBestMonth(pi) {
  const ratings = priceIdxToSeasons[pi];
  if (!ratings) return null;
  let bestIdx = -1, bestMult = 999;
  ratings.forEach((r, i) => {
    const mu = SEASON_MULT[r] || 1;
    if (mu < bestMult && 'PGO'.includes(r)) { bestMult = mu; bestIdx = i; }
  });
  if (bestIdx === -1) ratings.forEach((r, i) => { if (r === 'O' && bestIdx === -1) bestIdx = i; });
  if (bestIdx === -1) bestIdx = 0;
  return { monthNum: bestIdx + 1, monthName: MONTH_FULL[bestIdx], mult: SEASON_MULT[ratings[bestIdx]] || 1 };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ─── Render single-country result with category bars ───────────
function renderSingle(pi) {
  const r = computeForPriceIndex(pi);
  const aviUrl = flightUrl(pi);
  const perPerson = (r.grand ?? r.knownTotal) / Math.max(1, r.travelers);
  const perDay = (r.grand ?? r.knownTotal) / Math.max(1, r.days);

  const categories = r.personal.rows.filter(row => row.minor > 0 && !row.excluded).map(row => ({ name: row.label, value: row.minor / (calcCurrency === 'rub' ? 100 : 100 * rates.USD), color: CAT_COLORS[row.id] || '#5c626b', icon: '' }));

  const total = r.grand ?? r.knownTotal;

  // Best month nudge
  const best = findBestMonth(pi);
  let nudge = '';
  if (best && selectedMonth > 0 && best.monthNum !== selectedMonth) {
    const saving = Math.round((1 - best.mult / r.seasonMult) * 100);
    if (saving > 5) nudge = `<div class="tc-nudge"><span class="tc-nudge-icon">↘</span> В <strong>${escapeHtml(best.monthName)}</strong> на <strong>${saving}%</strong> дешевле по модели перелёта</div>`;
  } else if (best && selectedMonth === 0) {
    nudge = `<div class="tc-nudge tc-nudge--soft">Перелёт по модели дешевле в <strong>${escapeHtml(best.monthName)}</strong></div>`;
  }

  // Visa info
  const visaInfo = r.visa
    ? (r.visa.cost === 'бесплатно'
        ? `<a href="/visa/${encodeURIComponent(r.visa.slug)}/" class="tc-visa-pill tc-visa-pill--free">Безвиз · детали</a>`
        : `<a href="/visa/${encodeURIComponent(r.visa.slug)}/" class="tc-visa-pill">Виза ${escapeHtml(r.visa.cost)} · детали</a>`)
    : '';

  // Season pill
  const seasonPill = r.seasonLabel
    ? `<span class="tc-season-pill tc-season-pill--${r.seasonClass}">${['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][selectedMonth-1]} · ${r.seasonLabel}</span>`
    : '';

  return `
    <div class="tc-single">
      <header class="tc-result-head">
        <div class="tc-result-head-meta">
          <div class="tc-result-tag">${escapeHtml(r.p.name)}</div>
          <div class="tc-result-pills">
            <span class="tc-meta-pill">${r.days} ${r.days === 1 ? 'день' : (r.days < 5 ? 'дня' : 'дней')} · ${r.travelers} ${r.travelers === 1 ? 'человек' : (r.travelers < 5 ? 'человека' : 'человек')}</span>
            ${seasonPill}
            ${visaInfo}
          </div>
        </div>
      </header>

      <div class="tc-hero-total">
        <div class="tc-hero-label">${r.grand === null ? 'Известная часть бюджета' : 'Оценка поездки'}</div>
        <div class="tc-hero-amount">${fmt(total)}</div>
        <div class="tc-hero-sub">
          ${r.travelers > 1 ? `<span>${fmt(perPerson)} на человека</span><span class="tc-sep">·</span>` : ''}
          <span>${fmt(perDay)} в день</span>
        </div>
      </div>

      ${r.grand === null ? `<p class="tc-incomplete">Не включено: ${escapeHtml(r.unknownCosts.join(', ').toLocaleLowerCase('ru'))}. Полная стоимость пока неизвестна.</p>` : ''}
      <dl class="tc-finances"><div><dt>Оплачено</dt><dd data-total="paid">${minorText(r.personal.paidMinor)}</dd></div><div><dt>Запас ${r.personal.draft.reserve}% на оставшееся</dt><dd data-total="reserve">${minorText(r.personal.reserveMinor)}</dd></div><div class="tc-finances-remaining"><dt>Осталось оплатить${r.personal.complete ? '' : ' из учтённого'}</dt><dd data-total="remaining">${minorText(r.personal.remainingMinor)}</dd></div></dl>
      ${r.personal.draft.costs.flight.amount === null ? nudge : ''}

      <div class="tc-cats">
        ${categories.map(c => {
          const pct = total > 0 ? (c.value / total * 100) : 0;
          return `
            <div class="tc-cat">
              <div class="tc-cat-head">
                <span class="tc-cat-name"><span class="tc-cat-icon">${c.icon}</span> ${c.name}</span>
                <span class="tc-cat-val">${fmt(c.value)}</span>
              </div>
              <div class="tc-cat-bar"><div class="tc-cat-fill" style="--w:${pct}%; --c:${c.color}"></div></div>
              <div class="tc-cat-pct">${pct.toFixed(0)}%</div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="tc-cta-block">
        <a href="${aviUrl}" ${partnerAttrs(pi, 'flight')} target="_blank" rel="noopener sponsored" class="tc-cta-primary">
          <span class="tc-cta-icon"></span>
          <span class="tc-cta-text">Посмотреть рейсы на выбранный месяц</span>
        </a>
        <div class="tc-cta-side-row">
          <a href="${stayUrl(pi)}" ${partnerAttrs(pi, 'stay')} target="_blank" rel="noopener sponsored" class="tc-cta-side">
            <span></span> Жильё в направлении
          </a>
          <a href="${insuranceUrl(pi)}" ${partnerAttrs(pi, 'insurance')} target="_blank" rel="noopener sponsored" class="tc-cta-side">
            <span></span> Страховка для страны
          </a>
        </div>

      </div>

      <div class="tc-utility">
        <button class="tc-copy-btn" id="copyTgBtn" type="button">
          <span></span> Скопировать сводку для Telegram
        </button>
        <button class="tc-copy-btn" id="saveBudgetBtn" type="button">Сохранить в браузере</button>
        <button class="tc-copy-btn" id="shareBudgetBtn" type="button">Скопировать ссылку</button>
      </div>
    </div>
  `;
}

// ─── Render comparison table (full width) ──────────────────────
function renderTable(piList) {
  const rows = piList.map(pi => computeForPriceIndex(pi));
  const cols = rows.length;

  let html = `<div class="tc-compare">
    <div class="tc-compare-head">
      <h2 class="tc-compare-title">Сравнение ${cols} направлений</h2>
      <p class="tc-compare-sub">${rows[0].travelers} ${rows[0].travelers===1?'человек':'чел.'} · ${rows[0].days} ${rows[0].days===1?'день':'дней'}${selectedMonth>0?` · ${['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][selectedMonth-1]}`:''}</p>
    </div>
    <div class="tc-compare-grid" style="--compare-columns:${cols}">`;

  rows.forEach((r, idx) => {
    const pi = piList[idx];
    const aviUrl = flightUrl(pi);

    // Сезон-бейдж: всегда показываем (placeholder для равной высоты)
    const seasonPill = r.seasonLabel
      ? `<span class="tc-season-pill tc-season-pill--${r.seasonClass}">${r.seasonLabel}</span>`
      : `<span class="tc-season-pill tc-season-pill--any">Любой месяц</span>`;

    // Виза: используем slug из priceIdxToSlug (а не r.visa.slug), чтобы ссылка
    // была доступна даже когда детальной visa-data нет
    const slug = priceIdxToSlug[pi];
    const visaUrl = slug ? `/visa/${encodeURIComponent(slug)}/` : null;
    let visaText, visaLink;
    if (r.visa) {
      visaText = r.visa.cost === 'бесплатно' ? 'безвиз' : escapeHtml(r.visa.cost);
      visaLink = visaUrl;
    } else if (slug) {
      visaText = 'нужна';
      visaLink = visaUrl;
    } else {
      visaText = '—';
      visaLink = null;
    }

    html += `
      <div class="tc-cmp-card">
        ${idx > 0 ? `<button class="tc-cmp-remove" data-remove="${pi}" type="button" aria-label="Убрать">×</button>` : ''}

        <div class="tc-cmp-head">
          <h3 class="tc-cmp-name">${escapeHtml(r.p.name.split('(')[0].trim())}</h3>
          ${seasonPill}
        </div>

        <dl class="tc-finances"><div><dt>Оплачено</dt><dd>${minorText(r.personal.paidMinor)}</dd></div><div><dt>Осталось с запасом</dt><dd>${minorText(r.personal.remainingMinor)}</dd></div></dl>
        <button class="tc-copy-btn" type="button" data-edit="${pi}">Уточнить расходы</button>

        <div class="tc-cmp-total">
          <div class="tc-cmp-total-label">${r.grand === null ? 'Известная часть бюджета' : 'Оценка поездки'}</div>
          <div class="tc-cmp-total-amount">${fmt(r.grand ?? r.knownTotal)}</div>
          <div class="tc-cmp-total-pp">${r.travelers > 1 ? `${fmt((r.grand ?? r.knownTotal) / r.travelers)} / чел.` : `${fmt((r.grand ?? r.knownTotal) / r.days)} / день`}</div>
        </div>

        <ul class="tc-cmp-list">
          ${r.personal.rows.filter(row => !row.excluded).map(row => `<li><span class="tc-cmp-key">${row.label}${row.id === 'hotel' ? ` · ${r.personal.nights} ноч., ${r.personal.draft.rooms} ном.` : ''}</span><span class="tc-cmp-val">${row.known ? minorText(row.minor) : 'Не учтено'}</span></li>`).join('')}
          <li><span class="tc-cmp-key">Условия въезда</span><span class="tc-cmp-val tc-cmp-visa">${visaLink ? `<a href="${visaLink}" target="_blank" rel="noopener">${visaText}</a>` : visaText}</span></li>
        </ul>

        <a href="${aviUrl}" ${partnerAttrs(pi, 'flight')} target="_blank" rel="noopener sponsored" class="tc-cmp-cta">Посмотреть рейсы</a>
        <p class="tc-cmp-partners"><a href="${stayUrl(pi)}" ${partnerAttrs(pi, 'stay')} target="_blank" rel="noopener sponsored">Жильё</a><a href="${insuranceUrl(pi)}" ${partnerAttrs(pi, 'insurance')} target="_blank" rel="noopener sponsored">Страховка</a></p>
        ${r.grand === null ? `<p class="tc-incomplete">Не включено: ${escapeHtml(r.unknownCosts.join(', ').toLocaleLowerCase('ru'))}.</p>` : ''}
      </div>
    `;
  });

  html += `</div>
  </div>

  <div class="tc-utility">
    <button class="tc-copy-btn" id="copyTgBtn" type="button">
      <span></span> Скопировать сводку
    </button>
    <button class="tc-copy-btn" id="saveBudgetBtn" type="button">Сохранить в браузере</button>
    <button class="tc-copy-btn" id="shareBudgetBtn" type="button">Скопировать ссылку</button>
  </div>`;

  return html;
}

function renderCalc() {
  activeError = false;
  message('');
  const primary = parseInt(calcSel.value);
  const all = [primary, ...compareList.filter(x => x !== primary)].slice(0, 3);
  const isCompare = all.length > 1;

  resultEl.innerHTML = isCompare ? renderTable(all) : renderSingle(all[0]);
  renderEditor();
  document.dispatchEvent(new CustomEvent('tt:affiliate-links-updated'));

  // Add country select state
  if (compareList.length < 2 && all.length < 3) {
    addSelect.hidden = false;
    addSelect.value = '';
    Array.from(addSelect.options).forEach(opt => {
      const v = parseInt(opt.value);
      if (isNaN(v)) { opt.disabled = false; return; }
      opt.disabled = (v === primary || compareList.includes(v));
    });
  } else {
    addSelect.hidden = true;
  }

  writeUrlParams();
}

// ─── EVENT HANDLERS ────────────────────────────────────────────
calcSel.addEventListener('change', () => { renderCalc(); changed(); });
monthSel.addEventListener('change', e => {
  selectedMonth = parseInt(e.target.value);
  renderCalc();
  changed();
});

function setDays(n) {
  n = Math.min(90, Math.max(1, n));
  document.getElementById('calcDays').value = n;
  document.getElementById('calcDaysDisplay').textContent = n;
  renderCalc();
  changed();
}
document.getElementById('daysDown').addEventListener('click', () => setDays(parseInt(document.getElementById('calcDays').value) - 1));
document.getElementById('daysUp').addEventListener('click', () => setDays(parseInt(document.getElementById('calcDays').value) + 1));

function setTravelers(n) {
  travelers = Math.min(4, Math.max(1, n));
  document.getElementById('travelersDisplay').textContent = travelers;
  renderCalc();
  changed();
}
document.getElementById('travDown').addEventListener('click', () => setTravelers(travelers - 1));
document.getElementById('travUp').addEventListener('click', () => setTravelers(travelers + 1));

document.getElementById('levelGroup').addEventListener('click', e => {
  const btn = e.target.closest('[data-lvl]');
  if (!btn) return;
  calcLevel = +btn.dataset.lvl;
  document.querySelectorAll('#levelGroup .tc-seg-btn').forEach(b => {
    b.classList.toggle('active', b === btn);
    b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
  });
  renderCalc();
  changed();
});

document.getElementById('currGroup').addEventListener('click', e => {
  const btn = e.target.closest('[data-cur]');
  if (!btn) return;
  calcCurrency = btn.dataset.cur;
  document.querySelectorAll('#currGroup .tc-seg-btn').forEach(b => {
    b.classList.toggle('active', b === btn);
    b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
  });
  renderCalc();
  changed();
});

addSelect.addEventListener('change', e => {
  const v = parseInt(e.target.value);
  if (isNaN(v)) return;
  const primary = parseInt(calcSel.value);
  if (v === primary || compareList.includes(v) || compareList.length >= 2) return;
  compareList.push(v);
  renderCalc();
  changed();
});

resultEl.addEventListener('click', e => {
  const edit = e.target.closest('[data-edit]');
  if (edit) {
    const all = indices(), pi = +edit.dataset.edit;
    calcSel.value = String(pi);
    compareList = all.filter(x => x !== pi);
    renderCalc();
    editor.querySelector('input')?.focus();
    return;
  }
  const rm = e.target.closest('[data-remove]');
  if (rm) {
    const pi = +rm.dataset.remove;
    compareList = compareList.filter(x => x !== pi);
    renderCalc();
    return;
  }
});

resultEl.addEventListener('click', async e => {
  const btn = e.target.closest('#copyTgBtn, #saveBudgetBtn, #shareBudgetBtn');
  if (!btn) return;
  if (activeError) { message('Проверь выделенное поле расходов.'); return; }
  if (btn.id === 'saveBudgetBtn') {
    try { localStorage.setItem(STORAGE,JSON.stringify({ v: 1, url: location.pathname + location.search + location.hash })); message('Расчёт сохранён в этом браузере.'); event('save'); }
    catch { message('Сохранить в браузере не удалось. Можно скопировать ссылку на расчёт.'); }
    return;
  }
  if (btn.id === 'shareBudgetBtn') { await copyText(location.href, 'Ссылка скопирована.', 'share'); return; }
  const primary = parseInt(calcSel.value);
  const all = [primary, ...compareList.filter(x => x !== primary)].slice(0, 3);
  const days = +document.getElementById('calcDays').value;
  const lvlNames = ['Эконом', 'Комфорт', 'Люкс'];
  const monthLine = selectedMonth > 0 ? `, в ${MONTH_FULL[selectedMonth - 1]}` : '';
  let text = `Бюджет поездки${monthLine}\n${days} дн · ${travelers} чел · ${lvlNames[calcLevel]}\n─────\n`;
  all.forEach(pi => {
    const r = computeForPriceIndex(pi);
    text += `${r.p.name}\n  ${r.grand === null ? 'ИЗВЕСТНАЯ ЧАСТЬ БЮДЖЕТА' : 'ОЦЕНКА ПОЕЗДКИ'}: ${fmt(r.grand ?? r.knownTotal)}\n`;
    for (const row of r.personal.rows.filter(row => row.known && !row.excluded)) text += `  ${row.label}${row.id === 'hotel' ? ` (${r.personal.nights} ноч., ${r.personal.draft.rooms} ном.)` : ''}: ${minorText(row.minor)}\n`;
    if (r.unknownCosts.length) text += `  Не включено: ${r.unknownCosts.join(', ')}\n`;
    text += `  Оплачено: ${minorText(r.personal.paidMinor)}\n  Запас ${r.personal.draft.reserve}%: ${minorText(r.personal.reserveMinor)}\n  Осталось оплатить из учтённого: ${minorText(r.personal.remainingMinor)}\n`;
    text += `\n`;
  });
  text += `${window.location.href}\ntraveltribe.ru/calculator/`;
  await copyText(text,'Сводка скопирована.','copy');
});

async function copyText(text, success, action) {
  try { await navigator.clipboard.writeText(text); message(success); event(action); }
  catch {
    message('Автоматически скопировать не удалось. Скопируй текст из поля ниже.');
    const area = document.createElement('textarea');
    area.className = 'ym-disable-keys'; area.readOnly = true; area.value = text; area.setAttribute('aria-label','Текст для копирования');
    notice.append(area); area.focus(); area.select();
  }
}
editor?.addEventListener('input', e => {
  if (e.target.matches('[data-draft]')) {
    e.target.setAttribute('aria-invalid',String(!e.target.checkValidity() || e.target.value.trim() === ''));
    activeError = Boolean(editor.querySelector('[aria-invalid="true"]'));
    event('start');
    return;
  }
  const input = e.target.closest('[data-money]');
  if (!input) return;
  const id = input.dataset.money;
  const value = input.value.trim() ? moneyToMinor(input.value,calcCurrency,rates) : null;
  const invalid = input.value.trim() !== '' && value === null;
  input.setCustomValidity(invalid ? 'Введи положительную сумму или ноль, до двух знаков после запятой.' : '');
  input.setAttribute('aria-invalid',String(invalid));
  document.getElementById(`error-${id}`).textContent = input.validationMessage;
  activeError = Boolean(editor.querySelector('[aria-invalid="true"]'));
  event('start');
  if (invalid) { message('Проверь выделенное поле расходов.'); return; }
  const draft = normalizeDraft(drafts[key(+calcSel.value)]);
  draft.costs[id].amount = value;
  drafts[key(+calcSel.value)] = draft;
  if (activeError) return;
  const all = indices();
  resultEl.innerHTML = all.length > 1 ? renderTable(all) : renderSingle(all[0]);
  document.dispatchEvent(new CustomEvent('tt:affiliate-links-updated'));
  const row = computeForPriceIndex(+calcSel.value).personal.rows.find(r => r.id === id);
  const container = input.closest('.tc-expense');
  container.querySelector('[data-paid]').disabled = !row.known || row.excluded;
  container.querySelector('[data-reset]').hidden = !row.custom;
  container.querySelector('.tc-expense-actions > span').textContent = row.known ? minorText(row.minor) : 'Не учтено';
  message(''); writeUrlParams(); changed();
});
editor?.addEventListener('change', e => {
  const input = e.target;
  if (input.matches('[data-money]')) return;
  const draft = normalizeDraft(drafts[key(+calcSel.value)]);
  if (input.dataset.draft) {
    if (!input.checkValidity() || input.value.trim() === '') { input.reportValidity(); return; }
    draft[input.dataset.draft] = Number(input.value);
  } else if (input.dataset.paid) draft.costs[input.dataset.paid].paid = input.checked;
  else if (input.dataset.exclude) draft.costs[input.dataset.exclude].excluded = input.checked;
  else return;
  drafts[key(+calcSel.value)] = normalizeDraft(draft);
  activeError = false; renderCalc(); changed();
});
editor?.addEventListener('click', e => {
  const reset = e.target.closest('[data-reset]');
  if (!reset) return;
  const draft = normalizeDraft(drafts[key(+calcSel.value)]);
  draft.costs[reset.dataset.reset] = { amount: null, paid: false, excluded: false };
  drafts[key(+calcSel.value)] = draft;
  activeError = false; renderCalc(); changed();
});
// Explicit links take precedence over a saved calculation. Only the recognised
// calculator route is restored; stored values never cause a navigation.
if (!['r','d','l','c','t','m','cmp'].some(k => new URL(location.href).searchParams.has(k)) && !location.hash) {
  try {
    const value = localStorage.getItem(STORAGE);
    if (value && value.length < 30000) {
      const saved = JSON.parse(value), url = new URL(saved.url,location.origin);
      if (saved.v === 1 && url.origin === location.origin && url.pathname === '/calculator/') history.replaceState(null,'',url);
    }
  } catch { /* Storage is optional; the calculator continues without it. */ }
}
if (location.hash.startsWith('#budget=')) drafts = decodeBudgets(location.hash.slice(8));
readUrlParams();
renderCalc();

}

controller.init = initCalculator;
if (!controller.listening) {
  document.addEventListener('astro:page-load', () => controller.init());
  window.addEventListener('pageshow', () => controller.init());
  controller.listening = true;
}
controller.init();
