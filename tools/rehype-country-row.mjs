import { directionForTags, countryLinks } from '../src/data/article-country.js';

/**
 * Строка «ещё по стране» сразу под капсулой-ответом «Если коротко».
 *
 * Зачем: замер 13.08.2026 показал, что 88% визитов заканчиваются на первой же
 * странице, а первая ссылка на соседнюю тему в визовой статье стоит на 16-м
 * экране телефона. Уйти вглубь сайта человеку негде, пока он не дочитает почти
 * всё. Строка ставится ровно после ответа: ответ остаётся первым (правило
 * первого экрана), но следующий шаг виден сразу.
 *
 * Почему плагин, а не шаблон: капсула живёт ВНУТРИ текста статьи, шаблон
 * вставить после неё не может — он видит текст целиком одним куском.
 *
 * Ставим только в статьи блога и только если капсула есть; ссылок не больше трёх.
 *
 * ⛔ Правка ЭТОГО файла не сбрасывает кеш собранного текста статей: Astro
 * держит отрисованные .md/.mdx между сборками, и страницы молча остаются
 * старыми. Проверяя правку плагина, сначала снести кеш (.astro и
 * node_modules/.astro), иначе будешь смотреть на прошлую сборку и считать,
 * что код не работает.
 */
export default function rehypeCountryRow() {
  return (tree, file) => {
    const path = String(file.history?.[0] || file.path || '');
    if (!/src\/content\/blog\//.test(path)) return;

    const fm = file.data?.astro?.frontmatter || {};
    const direction = directionForTags(fm.tags || []);
    if (!direction) return;

    const children = tree.children || [];
    // Ищем именно капсулу-ответ, а не первую попавшуюся цитату: в части статей
    // первой стоит врезка про партнёрские ссылки, и строка встала бы перед
    // ответом — то есть выталкивала бы его. Нет капсулы — строки нет.
    const text = (n) => (n.type === 'text' ? n.value
      : (n.children || []).map(text).join(''));
    const capsuleAt = children.findIndex(
      (n) => n.type === 'element' && n.tagName === 'blockquote' && /коротко/i.test(text(n)),
    );
    if (capsuleAt === -1) return;

    // Дубль убираем только ВНУТРИ капсулы: два одинаковых адреса рядом друг с
    // другом заставляют перечитывать оба (NN/g). Ссылку, стоящую где-то в
    // тексте на 16-м экране, дублем не считаем — ради неё строка и делается:
    // первый замер с дедупом по всей статье оставил без строки 20 статей из 66,
    // включая Дагестан и Алтай, где ссылка на страну была, но глубоко внизу.
    const seen = new Set();
    const walk = (n) => {
      if (n.type === 'element' && n.tagName === 'a' && n.properties?.href) {
        seen.add(String(n.properties.href));
      }
      (n.children || []).forEach(walk);
    };
    walk(children[capsuleAt]);

    const slug = path.split('/').pop().replace(/\.mdx?$/, '');
    // Статья сама про визу — не предлагать ей визовую страницу того же
    // направления: это то же намерение, читатель уже здесь.
    const tags = (fm.tags || []).map((t) => String(t).toLowerCase().trim());
    if (tags.includes('виза')) seen.add(`/visa/${direction.slug}/`);
    const links = countryLinks(direction, { skip: seen, selfPath: `/blog/${slug}/` });
    if (!links.length) return;

    const label = direction.region.split(/[&(,—-]/)[0].trim();
    const kids = [
      { type: 'element', tagName: 'span', properties: { className: ['country-row-label'] },
        children: [{ type: 'text', value: `Ещё по направлению «${label}»:` }] },
    ];
    links.forEach((l) => {
      kids.push({ type: 'element', tagName: 'a', properties: { href: l.href },
        children: [{ type: 'text', value: l.label }] });
    });

    children.splice(capsuleAt + 1, 0, {
      type: 'element',
      tagName: 'nav',
      properties: { className: ['country-row'], 'aria-label': `Ещё по направлению «${label}»` },
      children: kids,
    });
  };
}
