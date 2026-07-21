import { getCollection } from 'astro:content';

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
  }[c]));
}

// Локальные фото постов (src/content/blog/_images/**): резолвим относительный
// markdown-путь в собранный URL через import.meta.glob — чтобы инлайн-фото попадали
// в image-sitemap (раньше шли только обложки, инлайн выпадали; из HTML они и так
// краулятся — это добавляет явный листинг + caption для Яндекс.Картинок).
// meta.src = URL ПОЛНОРАЗМЕРНОГО оригинала (Astro эмитит его при обращении к .src),
// он отличается от оптимизированной версии на странице (…_<hash2>.webp), но валиден,
// servable и для Картинок даже лучше — выше разрешение. Берём только контентные фото
// поста (обложка + markdown-картинки тела), UI-хлам (аватар/логотип) сюда не попадает.
const LOCAL_IMAGES = import.meta.glob(
  '/src/content/blog/_images/**/*.{webp,jpg,jpeg,png,avif}',
  { eager: true }
);
function resolveLocal(src) {
  const key = src.replace(/^\.\//, '/src/content/blog/');
  const meta = LOCAL_IMAGES[key]?.default;
  return meta?.src ? `https://traveltribe.ru${meta.src}` : null;
}

// Инлайн markdown-картинки поста: абсолютные (unsplash и т.п.) — как есть,
// локальные — резолвим в собранный URL.
function extractInlineImages(body) {
  const out = [];
  const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const alt = m[1].trim();
    const src = m[2].trim();
    if (src.startsWith('http')) { out.push({ src, alt }); continue; }
    const abs = resolveLocal(src);
    if (abs) out.push({ src: abs, alt });
  }
  return out;
}

export async function GET() {
  const posts = await getCollection('blog');

  const urls = posts.map(post => {
    const url = `https://traveltribe.ru/blog/${post.slug}/`;
    const cover = post.data.coverImage;
    const coverUrl = typeof cover === 'string'
      ? cover
      : `https://traveltribe.ru${cover.src}`;
    const title = escapeXml(post.data.title);
    const description = escapeXml(post.data.description);

    const blocks = [
      `    <image:image>
      <image:loc>${coverUrl}</image:loc>
      <image:title>${title}</image:title>
      <image:caption>${description}</image:caption>
    </image:image>`
    ];
    for (const img of extractInlineImages(post.body)) {
      blocks.push(
`    <image:image>
      <image:loc>${escapeXml(img.src)}</image:loc>
      <image:title>${escapeXml(img.alt || title)}</image:title>
      <image:caption>${escapeXml(img.alt || title)}</image:caption>
    </image:image>`
      );
    }

    return `  <url>
    <loc>${url}</loc>
${blocks.join('\n')}
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
