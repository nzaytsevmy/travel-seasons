import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';

// Дзен-совместимый RSS feed (Native, не Турбо/Новости).
// Документация: https://dzen.ru/help/ru/website/site-to-channel.html
//
// Обязательные элементы для Дзена:
//   - title, link, guid, pubDate, description, enclosure
//   - content:encoded (HTML)
//   - <category> со специальными значениями: native (или native-draft),
//     format-article (или format-post), index/noindex, comment-all/subscribers/none
//   - Минимум 10 материалов, ≥3 за последний месяц, без UTM, картинки ≥700px

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

  // Убираем MDX-импорты (import X from 'Y') — они валидны в .mdx но в RSS текст
  s = s.replace(/^import\s+.+from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Убираем JSX-компоненты <PricingCards tiers={...} /> и подобные
  // Простая эвристика: блоки <Capitalized.../> или <Capitalized>...</Capitalized>
  s = s.replace(/<[A-Z][a-zA-Z]*[\s\S]*?\/>/g, '');
  s = s.replace(/<([A-Z][a-zA-Z]*)[^>]*>[\s\S]*?<\/\1>/g, '');
  // Hr-разделители ---
  s = s.replace(/^---\s*$/gm, '');
  const absUrl = (u) => {
    if (u.startsWith('http')) return u;
    let clean = u.replace(/^\.\//, '').replace(/^_images\//, '/_images/');
    if (!clean.startsWith('/')) clean = '/' + clean;
    return `${SITE}${clean}`;
  };

  // Inline-картинки: оставляем только публичные http URLs (Wikimedia и т.п.)
  // Локальные _images/* выбрасываем — Astro их оптимизирует с hash, в RSS не передать.
  // Статья в Дзене будет без inline-картинок, читатель идёт на сайт через CTA.
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
    if (src.startsWith('http')) return `<figure><img src="${src}" alt="${escapeXml(alt)}"/></figure>`;
    return '';
  });

  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) =>
    `<a href="${absUrl(url)}">${text}</a>`);

  s = s.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<![*\w])\*([^*\n]+)\*(?!\w)/g, '<em>$1</em>');
  s = s.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');
  s = s.replace(/(?:^- .+(?:\n|$))+/gm, (m) => {
    const items = m.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  s = s.replace(/(?:^\d+\. .+(?:\n|$))+/gm, (m) => {
    const items = m.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Параграфы
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

  const items = [];
  for (const post of posts) {
    const link = `${SITE}/blog/${post.slug}/`;

    // Cover: получаем оптимизированный URL через astro:assets.
    // Дзен требует картинку ≥700px, JPEG/PNG/GIF.
    let coverUrl;
    if (typeof post.data.coverImage === 'string') {
      coverUrl = post.data.coverImage.startsWith('http')
        ? post.data.coverImage
        : `${SITE}${post.data.coverImage}`;
    } else {
      const optimized = await getImage({
        src: post.data.coverImage,
        width: 1400,
        format: 'jpeg',
        quality: 82,
      });
      coverUrl = `${SITE}${optimized.src}`;
    }

    const html = mdToHtml(post.body);
    const ctaHtml = `<p><a href="${link}">Читать полностью на TravelTribe →</a></p>`;
    const fullHtml = html + '\n' + ctaHtml;

    items.push(`    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${link}</link>
      <pdalink>${link}</pdalink>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description)}</description>
      <enclosure url="${coverUrl}" type="image/jpeg"/>
      <category>native</category>
      <category>format-article</category>
      <category>index</category>
      <category>comment-all</category>
      <content:encoded><![CDATA[${fullHtml}]]></content:encoded>
    </item>`);
  }

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
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
