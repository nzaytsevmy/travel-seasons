// «Похожие направления» — computed-рекомендатор для увеличения глубины/dwell (ПФ).
// Считает похожесть по визе + бюджету + ВАЙБУ + регL+ хорошо-ли-сейчас, не выдумывая.
// Вайб обязателен: без него матч визы+бюджета даёт ляпы (Бали→Таджикистан).
import { DIRECTIONS } from './directions.js';
import { ACTIVITY_TAGS } from './country-activity-tags.js';

// Тот же маппинг тегов→вайб, что у финдера на главной (index.astro).
const VIBE_MAP = {
  beach: 'beach', mountain: 'mountains', altitude: 'mountains', ski: 'mountains',
  city: 'city', culture: 'city', food: 'city',
  jungle: 'nature', safari: 'nature', dive: 'nature', desert: 'nature', photo: 'nature',
};
const VIBE_RU = { beach: 'пляж', mountains: 'горы', city: 'город', nature: 'природа' };
const VISA_RU = { free: 'тоже безвиз', evisa: 'тоже eVisa', required: 'та же виза' };
const BUDGET_RU = { low: 'бюджетно', mid: 'средний бюджет', high: 'премиум' };
const RANK = { P: 4, G: 3, O: 2, B: 1, X: 0 };

const vibeOf = (slug) => [...new Set((ACTIVITY_TAGS[slug] || []).map((t) => VIBE_MAP[t]).filter(Boolean))];
// Предвычисляем вайб для всех направлений один раз.
const DV = DIRECTIONS.map((d) => ({ d, vibe: vibeOf(d.slug) }));

/**
 * Топ-N похожих направлений на slug.
 * @param {string} slug
 * @param {number} n
 * @param {number|null} monthIdx 0-based; по умолчанию текущий месяц (build-time, как trips-ссылка хаба).
 * @returns {{slug,nom,vP,why,goodNow}[]}
 */
export function similarDestinations(slug, n = 3, monthIdx = null) {
  const cur = monthIdx == null ? new Date().getMonth() : monthIdx;
  const a = DV.find((x) => x.d.slug === slug);
  if (!a) return [];
  const scored = DV
    .filter((x) => x.d.slug !== slug)
    .map((x) => {
      let s = 0;
      if (a.d.visa === x.d.visa) s += 3;              // одинаковая визовая «боль» — сильный сигнал
      if (a.d.budget === x.d.budget) s += 2;          // бюджетный уровень
      const vibeShared = a.vibe.filter((v) => x.vibe.includes(v));
      s += Math.min(vibeShared.length, 2) * 2;        // ВАЙБ важен, но капнут — мульти-вайб не убегает
      if (a.d.group === x.d.group) s += 3;            // регион — сильный сигнал «похоже/рядом»
      const goodNow = (RANK[x.d.r[cur]] || 0) >= 3;
      if (goodNow) s += 1.5;                          // приоритет тем, куда хорошо ехать сейчас
      return { d: x.d, vibeShared, goodNow, s };
    })
    .sort((p, q) => q.s - p.s)
    .slice(0, n);

  return scored.map((r) => {
    const why = [];
    if (a.d.visa === r.d.visa) why.push(VISA_RU[r.d.visa]);
    if (r.vibeShared.length) why.push(r.vibeShared.map((v) => VIBE_RU[v]).join('/'));
    if (a.d.budget === r.d.budget) why.push(BUDGET_RU[r.d.budget]);
    return {
      slug: r.d.slug,
      nom: r.d.cases.nom,
      vP: r.d.cases.vP,
      why: why.slice(0, 3).join(' · '),
      goodNow: r.goodNow,
    };
  });
}
