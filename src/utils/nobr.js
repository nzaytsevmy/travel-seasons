// Составное слово с дефисом («Шри-Ланка», «Торрес-дель-Пайне», «e-Visa») в заголовке держится одним куском:
// браузер рвёт строку после дефиса, и заголовок читается «Шри-» на одной строке, «Ланку» на другой.
// Правило Никиты 10.09.2026 о некрасивых переносах; найдено 11.09.2026 в 27 статьях из 104 на ширине 360–402.
export const COMPOUND = /[\p{L}\p{N}]+(?:[-\u2011][\p{L}\p{N}]+)+/gu;

/** Текст → куски: составные слова помечены nobr, остальное как есть. */
export function splitCompounds(text) {
  if (typeof text !== 'string' || !text) return [];
  const out = []; let at = 0;
  for (const m of text.matchAll(new RegExp(COMPOUND.source, 'gu'))) {
    if (m.index > at) out.push({ t: text.slice(at, m.index), nobr: false });
    out.push({ t: m[0], nobr: true }); at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ t: text.slice(at), nobr: false });
  return out;
}
