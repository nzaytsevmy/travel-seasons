import { getCollection } from 'astro:content';

// Дзен-совместимый RSS feed для авто-импорта в Дзен-канал.
// Документация: https://dzen.ru/help/ru/export-content/export.html
// Обновляется при каждом деплое (новые материалы — за последние 7 дней попадают в Дзен).

const SITE = 'https://traveltribe.ru';

function escapeXml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mdToHtml(md) {
  let s = md;

  const absUrl = (u) => {
    if (u.startsWith('http')) return u;
    let clean = u.replace(/^\.\//, '').replace(/^_images\//, '/_images/');
    if (!clean.startsWith('/')) clean = '/' + clean;
    return `${SITE}${clean}`;
  };

  // картинки: оставляем только публичные/абсолютные URL.
  // Локальные _images/ не доступны напрямую в dist (Astro оптимизирует в /_astro/*.webp с хешем),
  // поэтому исключаем из RSS — cover показывается через <enclosure>, читатель идёт на сайт за полной версией.
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
    if (src.startsWith('http')) return `<figure><img src="${src}" alt="${escapeXml(alt)}"/></figure>`;
    return '';
  });

  // ссылки [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) =>
    `<a href="${absUrl(url)}">${text}</a>`);

  // заголовки
  s = s.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // bold/italic
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<![*\w])\*([^*\n]+)\*(?!\w)/g, '<em>$1</em>');

  // blockquote (одностроковые > ...)
  s = s.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // списки
  s = s.replace(/(?:^- .+(?:\n|$))+/gm, (m) => {
    const items = m.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  s = s.replace(/(?:^\d+\. .+(?:\n|$))+/gm, (m) => {
    const items = m.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // параграфы из остальных строк
  const lines = s.split('\n');
  const out = [];
  let buf = [];
  const isBlock = (l) => /^<(h\d|ul|ol|li|figure|blockquote|p|img)/.test(l.trim());
  for (const line of lines) {
    if (line.trim() === '') {
      if (buf.length) { out.push(`<p>${buf.join(' ')}</p>`); buf = []; }
    } else if (isBlock(line)) {
      if (buf.length) { out.push(`<p>${buf.join(' ')}</p>`); buf = []; }
      out.push(line);
    } else {
      buf.push(line.trim());
    }
  }
  if (buf.length) out.push(`<p>${buf.join(' ')}</p>`);

  return out.join('\n');
}

export async function GET() {
  const posts = (await getCollection('blog'))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const items = posts.map(post => {
    const link = `${SITE}/blog/${post.slug}/`;
    const cover = typeof post.data.coverImage === 'string'
      ? post.data.coverImage
      : `${SITE}${post.data.coverImage.src}`;

    const html = mdToHtml(post.body);
    const ctaHtml = `<p><a href="${link}">Читать полностью на TravelTribe →</a></p>`;
    const fullHtml = html + '\n' + ctaHtml;

    return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
      <author>nzaytsev.my@gmail.com (${escapeXml(post.data.author)})</author>
      <description>${escapeXml(post.data.description)}</description>
      <enclosure url="${cover}" type="image/jpeg"/>
      ${post.data.tags.map(t => `<category>${escapeXml(t)}</category>`).join('\n      ')}
      <content:encoded><![CDATA[${fullHtml}]]></content:encoded>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     version="2.0">
  <channel>
    <title>TravelTribe — личные путешествия Никиты Зайцева</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/dzen-rss.xml" rel="self" type="application/rss+xml"/>
    <description>Реальные поездки на 7 континентов. Япония, Африка, Бали, Антарктида, Латам. Цены 2026, маршруты, личный опыт.</description>
    <language>ru</language>
    <copyright>© Никита Зайцев</copyright>
    <managingEditor>nzaytsev.my@gmail.com (Никита Зайцев)</managingEditor>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
