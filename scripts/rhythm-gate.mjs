// Проверка ритма статей блога.
//
// Что ловим и почему именно это. Замер 02.08.2026 по 673 заголовкам показал: в
// вёрстке одинаково выглядят две разные вещи.
//
//   жирный ответ под заголовком-ВОПРОСОМ  — единица цитирования, её забирает
//     нейроответ. У эталонов голоса и у единственной цитируемой страницы сайта
//     таких 0–5. Трогать нельзя;
//   жирный лид под заголовком-УТВЕРЖДЕНИЕМ — ритуал. Он ничего не отвечает, а
//     держит форму. У эталонов 0–3, у худших 5–9. Именно от него текст читается
//     машинным.
//
// ⛔ Чего здесь НЕТ и не будет: плотности длинных тире на 1000 слов. Эталонный
// «Милфорд» даёт 44,8 и попадает в худшую дюжину — порога, который валит худших
// и пропускает канон, не существует. Вместо неё считаем предложения с двумя и
// более тире: там разрыв двукратный.

import { readFileSync } from 'node:fs';

const stripFrontmatter = (s) => s.replace(/^---\n[\s\S]*?\n---\n/, '');

/** Жирные лиды: отдельно под вопросом, отдельно под утверждением. */
export function boldLeads(src) {
  const lines = stripFrontmatter(src).split('\n');
  const out = { citable: [], ritual: [] };
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)$/);
    if (!m) continue;
    const head = m[1].trim();
    // Раздел вопросов пропускаем: там жирным размечен сам вопрос, а не лид.
    if (/^FAQ\b|Частые вопросы/i.test(head)) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    if (j >= lines.length) continue;
    const first = lines[j].trim();
    // Секция, начинающаяся с компонента, таблицы или списка — не проза.
    if (!first || '<|#>-'.includes(first[0])) continue;
    if (!first.startsWith('**')) continue;
    (head.endsWith('?') ? out.citable : out.ritual).push(head);
  }
  return out;
}

/** Доля предложений с двумя и более длинными тире, в процентах. */
export function multiDashShare(src) {
  const prose = stripFrontmatter(src)
    .split('\n')
    .filter((l) => {
      const s = l.trim();
      if (!s) return false;
      // ⛔ Звёздочку нельзя отбрасывать целиком: список — это «* », а «**» —
      // жирный лид, то есть обычная проза. Первый замер потерял из-за этого все
      // абзацы с жирным началом и дал ложные нули.
      // ⛔ Не проза, хотя и не начинается со спецсимвола: свойства компонентов
      // (`from: 'Москва', to: '…'`), сырые ссылки и картинки. Первый замер
      // засчитал их в предложения и завысил долю у трёх файлов.
      if (s.includes('![') || /<a\s|href=/.test(s)) return false;
      if (/^\s*\{?\s*\w+:\s*'/.test(s) || /',\s*$/.test(s)) return false;
      if (s.startsWith('**')) return s.split(/\s+/).length >= 5;
      return !'#>|-*<'.includes(s[0]) && !/^\d+\./.test(s) && s.split(/\s+/).length >= 5;
    })
    .join(' ');
  const sentences = prose.split(/(?<=[.!?])\s+/).filter((s) => s.split(/\s+/).length >= 3);
  if (sentences.length < 40) return { share: 0, total: sentences.length, hits: [] };
  const hits = sentences.filter((s) => (s.match(/—/g) || []).length >= 2);
  return { share: (hits.length / sentences.length) * 100, total: sentences.length, hits };
}

/** Разброс длин предложений. Печатаем, но не валим: он не подсказывает правку. */
export function sentenceLengthCV(src) {
  const words = stripFrontmatter(src)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().split(/\s+/).length)
    .filter((n) => n >= 3);
  if (words.length < 10) return 0;
  const mean = words.reduce((a, b) => a + b, 0) / words.length;
  const sd = Math.sqrt(words.reduce((a, b) => a + (b - mean) ** 2, 0) / words.length);
  return sd / mean;
}

export const MAX_RITUAL_LEADS = 3;   // максимум по эталонам голоса
// ⛔ 14, а не 12. Порог 12 был взят по прикидке и валил страницу про Рицу —
// единственную, которую реально цитируют (13,8%). Пересчёт по всем 60 статьям:
// максимум у эталонов голоса 13,8%, следующие за порогом — 15,3% и выше.
// Честно: эта метрика отделяет только крайности (валит 4 файла из 60, худшие
// 21,2% и 20,9%). Основную работу делает счётчик ритуальных лидов выше.
export const MAX_MULTIDASH_PCT = 14;

export function checkFile(path) {
  const src = readFileSync(path, 'utf8');
  const leads = boldLeads(src);
  const dash = multiDashShare(src);
  return {
    ritual: leads.ritual,
    citable: leads.citable,
    dashShare: dash.share,
    dashHits: dash.hits,
    cv: sentenceLengthCV(src),
    ok: leads.ritual.length <= MAX_RITUAL_LEADS && dash.share <= MAX_MULTIDASH_PCT,
  };
}
