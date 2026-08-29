// Связка «статья блога → направление» по меткам статьи.
//
// Метки писались людьми и не совпадают с именами направлений буквально:
// направление зовётся «Бали & Lombok», а метка — «Бали»; «Индия (Гоа)» против
// метки «Гоа». Поэтому у каждого направления берём набор ключей: полное имя,
// его слова и слаг. Совпадение по любому ключу считается попаданием.
//
// Замер 13.08.2026: по полному имени совпадала 51 статья из 66, по ключам — 53;
// остальные 13 — либо кросс-страновые темы (шенген, страховка, платежи, сборы
// на море), либо страны, для которых у нас нет своей страницы (Азербайджан,
// Черногория, Уганда). Для них страна не подставляется, и это правильно:
// выдумывать ссылку на несуществующий раздел нельзя.

import { DIRECTIONS } from './directions.js';

const KEYS = DIRECTIONS.map((d) => {
  const words = d.region
    .toLowerCase()
    .split(/[&(),—-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
  return { d, keys: new Set([d.region.toLowerCase(), d.slug, ...words]) };
});

/** Направление по меткам статьи или null. Первое совпадение по порядку меток. */
export function directionForTags(tags = []) {
  for (const raw of tags) {
    const t = String(raw).toLowerCase().trim();
    for (const { d, keys } of KEYS) {
      if (keys.has(t)) return d;
    }
  }
  return null;
}

/**
 * До трёх ссылок «ещё по стране» для статьи.
 * Порядок — по пользе читателю: сначала страна целиком, потом сборы, потом виза.
 * `skip` — адреса, которые на странице уже есть (свои же ссылки в тексте):
 * дубль заставляет читателя перечитывать оба списка (NN/g), поэтому выкидываем.
 */
export function countryLinks(direction, { skip = new Set(), selfPath = '' } = {}) {
  if (!direction) return [];
  const out = [];
  const add = (href, label) => {
    if (out.length >= 3) return;
    if (href === selfPath || skip.has(href)) return;
    out.push({ href, label });
  };

  add(`/${direction.slug}/`, 'когда ехать');
  add(`/packing/${direction.slug}/`, 'что взять');
  if (direction.visa === 'required' || direction.visa === 'evisa') {
    add(`/visa/${direction.slug}/`, 'виза и документы');
  }
  for (const p of direction.relatedPosts || []) {
    const label = p.kind === 'visa' ? 'виза и документы'
      : p.kind === 'season' ? 'сезоны и события'
      : p.kind === 'insurance' ? 'страховка и полис'
      : 'гайд по стране';
    add(`/blog/${p.slug}/`, label);
  }
  return out;
}
