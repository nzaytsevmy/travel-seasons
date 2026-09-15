import { calculateTripBudget, SEASON_MULT, tripInteger } from '../utils/trip-budget.js';

const initialized = new WeakSet();
function initCalculator() {
  const host = document.getElementById('calculatorData');
  const form = document.getElementById('tcForm');
  if (!host || !form || initialized.has(form)) return;
  initialized.add(form);
  const { PRICES, MONTH_NAMES, MONTH_FULL, priceIdxToSeasons, priceIdxToVisa, priceIdxToSlug, priceIdxToBudgetSlug, rates } = JSON.parse(host.textContent);
let calcLevel = 0, calcCurrency = 'rub';
let travelers = 1, selectedMonth = 0;
let compareList = [];

const SEASON_LABEL = { P:'Пик', G:'Хорошо', O:'Норма', B:'Не сезон' };
const SEASON_CLASS = { P:'peak', G:'good', O:'ok', B:'bad' };

// Aviasales через tpk.mx-обёртку: трекинг кликов (свежий sub-id на клик) + erid + .ru.
// Прямой ?marker со статичным sub-id давал 0 кликов в TP (проверено 2026-06-04).
const AVIASALES_TPK = atob('aHR0cHM6Ly9hdmlhc2FsZXMudHBrLm14L0pDU1BsQzE3P2VyaWQ9MlZ0enF4a240TEYmc3ViX2lkPWNhbGN1bGF0b3ImdT0='); // aviasales.tpk.mx: адрес спрятан от роботов, см. scripts/affiliate-shield.mjs
const CHEREHAPA = atob('aHR0cHM6Ly9jaGVyZWhhcGEudHBrLm14L2ZrTTdzdXplP2VyaWQ9MlZ0enF1WlR3YjUmc3ViX2lkPWNhbGN1bGF0b3ImdT1odHRwcyUzQSUyRiUyRmNoZXJlaGFwYS5ydSUyRnRyYXZlbCUyRg=='); // cherehapa.tpk.mx: адрес спрятан от роботов, см. scripts/affiliate-shield.mjs
const OSTROVOK = atob('aHR0cHM6Ly9vc3Ryb3Zvay50cGsubXgveHR5VGNVY1k/ZXJpZD0yVnR6cXZFMWN2MyZzdWJfaWQ9Y2FsY3VsYXRvcg=='); // ostrovok.tpk.mx: адрес спрятан от роботов, см. scripts/affiliate-shield.mjs

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
  if (cmp) compareList = cmp.split(',').map(x => parseInt(x)).filter(x => !isNaN(x) && PRICES[x]).slice(0, 3);
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
  window.history.replaceState(null, '', u.toString());
}

function fmt(value) {
  if (!Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString(calcCurrency === 'rub' ? 'ru-RU' : 'en-US') + (calcCurrency === 'rub' ? '\u00a0₽' : '\u00a0$');
}

function aviasalesUrl(iata, monthNum) {
  let inner = 'https://www.aviasales.ru/';
  if (iata) {
    inner += `?origin_iata=MOW&destination_iata=${iata}`;
    if (monthNum && monthNum >= 1 && monthNum <= 12) {
      const now = new Date();
      let y = now.getFullYear();
      if ((monthNum - 1) < now.getMonth()) y += 1;
      inner += `&depart_date=${y}-${String(monthNum).padStart(2,'0')}-15`;
    }
  }
  return AVIASALES_TPK + encodeURIComponent(inner);
}

function computeForPriceIndex(pi) {
  const result = calculateTripBudget(PRICES[pi], {
    rates, days: document.getElementById('calcDays').value,
    travelers, level: calcLevel, month: selectedMonth, currency: calcCurrency,
    seasons: priceIdxToSeasons[pi], visa: priceIdxToVisa[pi],
  });
  const rating = selectedMonth ? priceIdxToSeasons[pi]?.[selectedMonth - 1] : null;
  return { ...result, seasonLabel: SEASON_LABEL[rating] || '', seasonClass: SEASON_CLASS[rating] || '' };
}

function findBestMonth(pi) {
  const ratings = priceIdxToSeasons[pi];
  if (!ratings) return null;
  let bestIdx = -1, bestMult = 999;
  ratings.forEach((r, i) => {
    const mu = SEASON_MULT[r] || 1;
    if (mu < bestMult && r !== 'B') { bestMult = mu; bestIdx = i; }
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
  const piIdx = pi;
  const aviUrl = aviasalesUrl(r.p.iata, selectedMonth > 0 ? selectedMonth : null);
  const perPerson = r.grand / Math.max(1, r.travelers);
  const perDay = r.grand / Math.max(1, r.days);

  const categories = [
    { name: 'Перелёт', value: r.flightTotal, color: CAT_COLORS.flight, icon: '' },
    { name: 'Отель', value: r.hotelTotal, color: CAT_COLORS.hotel, icon: '' },
    { name: 'Питание', value: r.foodTotal, color: CAT_COLORS.food, icon: '' },
  ];
  if (r.visa && r.visaTotal > 0) categories.push({ name: 'Виза', value: r.visaTotal, color: CAT_COLORS.visa, icon: '' });

  const total = r.grand;

  // Best month nudge
  const best = findBestMonth(pi);
  let nudge = '';
  if (best && selectedMonth > 0 && best.monthNum !== selectedMonth) {
    const saving = Math.round((1 - best.mult / r.seasonMult) * 100);
    if (saving > 5) nudge = `<div class="tc-nudge"><span class="tc-nudge-icon">↘</span> В <strong>${best.monthName}</strong> на <strong>${saving}%</strong> дешевле — лучший месяц года</div>`;
  } else if (best && selectedMonth === 0) {
    nudge = `<div class="tc-nudge tc-nudge--soft"><span class="tc-nudge-icon"></span> Самый дешёвый месяц — <strong>${best.monthName}</strong></div>`;
  }

  // Visa info
  const visaInfo = r.visa
    ? (r.visa.cost === 'бесплатно'
        ? `<a href="/visa/${r.visa.slug}/" class="tc-visa-pill tc-visa-pill--free">Безвиз · детали</a>`
        : `<a href="/visa/${r.visa.slug}/" class="tc-visa-pill">Виза ${escapeHtml(r.visa.cost)} · детали</a>`)
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
        <div class="tc-hero-label">Итого на поездку</div>
        <div class="tc-hero-amount">${fmt(total)}</div>
        <div class="tc-hero-sub">
          ${r.travelers > 1 ? `<span>${fmt(perPerson)} на человека</span><span class="tc-sep">·</span>` : ''}
          <span>${fmt(perDay)} в день</span>
        </div>
      </div>

      ${nudge}

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
        <a href="${aviUrl}" target="_blank" rel="noopener sponsored" class="tc-cta-primary">
          <span class="tc-cta-icon"></span>
          <span class="tc-cta-text">Найти билет на эти даты</span>
        </a>
        <div class="tc-cta-side-row">
          <a href="${OSTROVOK}" target="_blank" rel="noopener sponsored" class="tc-cta-side">
            <span></span> Отель под маршрут
          </a>
          <a href="${CHEREHAPA}" target="_blank" rel="noopener sponsored" class="tc-cta-side">
            <span></span> Страховка под даты
          </a>
        </div>

      </div>

      <div class="tc-utility">
        <button class="tc-copy-btn" id="copyTgBtn" type="button">
          <span></span> Скопировать сводку для Telegram
        </button>
      </div>
    </div>
  `;
}

// ─── Render comparison table (full width) ──────────────────────
function renderTable(piList) {
  const rows = piList.map(pi => computeForPriceIndex(pi));
  const cols = rows.length;
  const minTotal = Math.min(...rows.map(r => r.grand));

  let html = `<div class="tc-compare">
    <div class="tc-compare-head">
      <h2 class="tc-compare-title">Сравнение ${cols} направлений</h2>
      <p class="tc-compare-sub">${rows[0].travelers} ${rows[0].travelers===1?'человек':'чел.'} · ${rows[0].days} ${rows[0].days===1?'день':'дней'}${selectedMonth>0?` · ${['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][selectedMonth-1]}`:''}</p>
    </div>
    <div class="tc-compare-grid" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr))">`;

  rows.forEach((r, idx) => {
    const pi = piList[idx];
    const isMin = r.grand === minTotal;
    const aviUrl = aviasalesUrl(r.p.iata, selectedMonth > 0 ? selectedMonth : null);

    // Сезон-бейдж: всегда показываем (placeholder для равной высоты)
    const seasonPill = r.seasonLabel
      ? `<span class="tc-season-pill tc-season-pill--${r.seasonClass}">${r.seasonLabel}</span>`
      : `<span class="tc-season-pill tc-season-pill--any">Любой месяц</span>`;

    // Виза: используем slug из priceIdxToSlug (а не r.visa.slug), чтобы ссылка
    // была доступна даже когда детальной visa-data нет
    const slug = priceIdxToSlug[pi];
    const visaUrl = slug ? `/visa/${slug}/` : null;
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
      <div class="tc-cmp-card ${isMin ? 'tc-cmp-card--best' : ''}">
        ${idx > 0 ? `<button class="tc-cmp-remove" data-remove="${pi}" type="button" aria-label="Убрать">×</button>` : ''}
        ${isMin ? '<div class="tc-cmp-badge">Самое дешёвое</div>' : ''}

        <div class="tc-cmp-head">
          <h3 class="tc-cmp-name">${escapeHtml(r.p.name.split('(')[0].trim())}</h3>
          ${seasonPill}
        </div>

        <div class="tc-cmp-total">
          <div class="tc-cmp-total-label">Итого</div>
          <div class="tc-cmp-total-amount">${fmt(r.grand)}</div>
          <div class="tc-cmp-total-pp">${r.travelers > 1 ? `${fmt(r.grand / r.travelers)} / чел.` : `${fmt(r.grand / r.days)} / день`}</div>
        </div>

        <ul class="tc-cmp-list">
          <li><span class="tc-cmp-key">Перелёт</span><span class="tc-cmp-val">${fmt(r.flightTotal)}</span></li>
          <li><span class="tc-cmp-key">Отель × ${r.days}</span><span class="tc-cmp-val">${fmt(r.hotelTotal)}</span></li>
          <li><span class="tc-cmp-key">Питание</span><span class="tc-cmp-val">${fmt(r.foodTotal)}</span></li>
          <li><span class="tc-cmp-key">Виза</span><span class="tc-cmp-val tc-cmp-visa">${visaLink ? `<a href="${visaLink}" target="_blank" rel="noopener">${visaText}</a>` : visaText}</span></li>
        </ul>

        <a href="${aviUrl}" target="_blank" rel="noopener sponsored" class="tc-cmp-cta">Найти билет</a>
      </div>
    `;
  });

  html += `</div>
    <div class="tc-compare-aux">
      <span class="tc-aux-label">Партнёры:</span>
      <a href="${OSTROVOK}" target="_blank" rel="noopener sponsored">Отель под маршрут</a>
      <a href="${CHEREHAPA}" target="_blank" rel="noopener sponsored">Страховка под даты</a>

    </div>
  </div>

  <div class="tc-utility">
    <button class="tc-copy-btn" id="copyTgBtn" type="button">
      <span></span> Скопировать сводку
    </button>
  </div>`;

  return html;
}

function renderCalc() {
  const primary = parseInt(calcSel.value);
  const all = [primary, ...compareList.filter(x => x !== primary)].slice(0, 3);
  const isCompare = all.length > 1;

  resultEl.innerHTML = isCompare ? renderTable(all) : renderSingle(all[0]);

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
  showBudgetBlock();
}

function showBudgetBlock() {
  const primary = parseInt(calcSel.value);
  const slug = priceIdxToBudgetSlug[primary];
  document.querySelectorAll('.tc-bb-wrap').forEach(el => {
    el.hidden = el.dataset.slug !== slug;
  });
}

// ─── EVENT HANDLERS ────────────────────────────────────────────
calcSel.addEventListener('change', renderCalc);
monthSel.addEventListener('change', e => {
  selectedMonth = parseInt(e.target.value);
  renderCalc();
});

function setDays(n) {
  n = Math.min(90, Math.max(1, n));
  document.getElementById('calcDays').value = n;
  document.getElementById('calcDaysDisplay').textContent = n;
  renderCalc();
}
document.getElementById('daysDown').addEventListener('click', () => setDays(parseInt(document.getElementById('calcDays').value) - 1));
document.getElementById('daysUp').addEventListener('click', () => setDays(parseInt(document.getElementById('calcDays').value) + 1));

function setTravelers(n) {
  travelers = Math.min(4, Math.max(1, n));
  document.getElementById('travelersDisplay').textContent = travelers;
  renderCalc();
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
});

addSelect.addEventListener('change', e => {
  const v = parseInt(e.target.value);
  if (isNaN(v)) return;
  const primary = parseInt(calcSel.value);
  if (v === primary || compareList.includes(v) || compareList.length >= 2) return;
  compareList.push(v);
  renderCalc();
});

resultEl.addEventListener('click', e => {
  const rm = e.target.closest('[data-remove]');
  if (rm) {
    const pi = +rm.dataset.remove;
    compareList = compareList.filter(x => x !== pi);
    renderCalc();
    return;
  }
});

resultEl.addEventListener('click', async e => {
  const btn = e.target.closest('#copyTgBtn');
  if (!btn) return;
  const primary = parseInt(calcSel.value);
  const all = [primary, ...compareList.filter(x => x !== primary)].slice(0, 3);
  const days = +document.getElementById('calcDays').value;
  const lvlNames = ['Эконом', 'Комфорт', 'Люкс'];
  const monthLine = selectedMonth > 0 ? `, в ${MONTH_FULL[selectedMonth - 1]}` : '';
  let text = `Бюджет поездки${monthLine}\n${days} дн · ${travelers} чел · ${lvlNames[calcLevel]}\n─────\n`;
  all.forEach(pi => {
    const r = computeForPriceIndex(pi);
    text += `${r.p.name}\n  ИТОГО: ${fmt(r.grand)}\n  Перелёт: ${fmt(r.flightTotal)}\n  Отель × ${days}: ${fmt(r.hotelTotal)}\n  Еда × ${days}: ${fmt(r.foodTotal)}\n`;
    if (r.visa && r.visaTotal > 0) text += `  Виза: ${fmt(r.visaTotal)} (${r.visa.cost})\n`;
    text += `\n`;
  });
  text += `${window.location.href}\ntraveltribe.ru/calculator/`;
  try {
    await navigator.clipboard.writeText(text);
    const span = btn.querySelector('span:nth-child(2)') || btn.lastChild;
    const orig = btn.innerHTML;
    btn.innerHTML = '<span></span> Скопировано';
    setTimeout(() => { btn.innerHTML = orig; }, 1800);
  } catch (err) { alert('Не удалось'); }
});

readUrlParams();
renderCalc();

}

initCalculator();
document.addEventListener('astro:page-load', initCalculator);
window.addEventListener('pageshow', initCalculator);
