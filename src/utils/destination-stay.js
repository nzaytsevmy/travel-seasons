import { ostrovokCountry, sutochnoRegion } from '../data/affiliate.js';

// Реальные региональные страницы Суточно.ру, проверены 10.10.2026.
// Регион, а не город: подбор не ограничивается одной точкой маршрута.
const REGIONS = Object.freeze({
  dagestan: 'https://mahachkala.sutochno.ru/region',
  altai: 'https://gorno-altaysk.sutochno.ru/region',
  karelia: 'https://petrozavodsk.sutochno.ru/region',
  kamchatka: 'https://pk.sutochno.ru/region',
  abkhazia: 'https://abkhazia.sutochno.ru/',
});

export function destinationStay(slug, subId) {
  return Object.hasOwn(REGIONS, slug)
    ? { partner: 'sutochno', href: sutochnoRegion(REGIONS[slug], subId) }
    : { partner: 'ostrovok', href: ostrovokCountry(slug, subId) };
}
