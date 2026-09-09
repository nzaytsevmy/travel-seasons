// ⛔ Опись читает СТАТИЧЕСКИЙ html. Метку страницы части партнёров (PlatipoMiru, YouTravel)
// дописывает скрипт в момент клика, поэтому пустая колонка метки здесь не равна потере
// атрибуции — проверять по коду трекинга, а не по этой таблице.
// Опись денежных ссылок по собранному сайту: URL страницы, метка, место, форма, партнёр,
// глубина ссылки и текст. Нужна, чтобы правки волн опирались на список, а не на «примерно
// треть ссылок общие». Запуск: node scripts/links-inventory.mjs > audits/links-inventory.csv
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { unshieldHtml } from './affiliate-shield.mjs';
import { isGenericAffiliateUrl } from '../src/data/monetization.js';

const DIST = 'dist';
const PARTNER_HOSTS = /(aviasales|ostrovok|cherehapa|sutochno|otello|yandex|level|sputnik8|tiqets|tripster|kiwitaxi|mirturbaz)\.tpk\.mx|travelme\.g2afse\.com|platipomiru\.com/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name === 'index.html') out.push(p);
  }
  return out;
}

const rows = [['page', 'partner', 'offer', 'placement', 'form', 'deep', 'runtime_fix', 'cta_id', 'anchor']];
for (const file of walk(DIST)) {
  const page = '/' + file.replace(/^dist\/?/, '').replace(/index\.html$/, '');
  const html = unshieldHtml(readFileSync(file, 'utf8'));
  // Направление страницы: если оно известно, скрипт в момент клика сам заменит общую
  // ссылку на страновую (страховка, отели, авторские туры). Значит «общая» в статике
  // не равна «общая для читателя» — без этой колонки опись снова соврёт.
  const pageDestination = (html.match(/data-destination="([^"]*)"/) || ['', ''])[1];
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [full, href, inner] = m;
    if (!PARTNER_HOSTS.test(href)) continue;
    const anchor = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    const partner = (href.match(PARTNER_HOSTS) || [''])[0].split('.')[0];
    const cls = (full.match(/class="([^"]*)"/) || ['', ''])[1];
    const form = /sticky-cta-btn/.test(cls) ? 'sticky'
      : /aff-btn/.test(cls) ? 'button'
      : /pc-cta/.test(cls) ? 'card'
      : /fr-price-link/.test(cls) ? 'route'
      : 'line';
    const before = html.slice(Math.max(0, m.index - 400), m.index);
    const placement = /post-end-money/.test(before) ? 'end'
      : /post-first-money/.test(before) ? 'top'
      : /sticky-cta/.test(before) ? 'sticky'
      : /pricing-cards/.test(before) ? 'comparison'
      : /class="[^"]*(capsule|answer|tldr)/.test(before) ? 'answer'
      : 'body';
    // ⛔ Глубину считает ШТАТНАЯ проверка проекта, а не своя догадка по адресу.
    // 08.09.2026 самодельное правило дважды соврало: сначала записало в «общие» все
    // ссылки на авторские туры (адрес назначения у них в redirect, а не в u), потом
    // четыре тысячи страховок (страна у партнёра лежит в параметре countries[0]).
    // Из-за этого был доложен несуществующий провал на две тысячи ссылок.
    const deep = isGenericAffiliateUrl(href, partner) ? 'generic' : 'deep';
    const cta = (full.match(/data-cta-id="([^"]*)"/) || ['', ''])[1];
    // Метка страницы у каждого партнёра называется по-своему: sub_id у сети,
    // sub1 у YouTravel, utm_content у PlatipoMiru, sharedID у прежних программ.
    // Искать только sub_id — значит записать чужой формат в «без метки» и соврать себе.
    const subId = (href.match(/[?&](?:sub_id|sub1|sharedID|utm_content)=([^&"]*)/) || ['', ''])[1];
    const runtimeFixed = deep === 'generic' && pageDestination
      && ['cherehapa', 'ostrovok', 'youtravel', 'travelme'].includes(partner) ? 'да' : '';
    rows.push([page, partner, '', placement, form, deep, runtimeFixed, cta || subId, anchor]);
  }
}
console.log(rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'));
