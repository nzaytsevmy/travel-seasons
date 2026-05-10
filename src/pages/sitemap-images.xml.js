import { getCollection } from 'astro:content';

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
  }[c]));
}

// Extract inline markdown images that point to absolute URLs.
// Local _images get fingerprinted by Astro at build time and aren't easy to
// recover from raw markdown — crawlers will pick them up from the rendered HTML.
function extractInlineImages(body) {
  const out = [];
  const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const alt = m[1].trim();
    const src = m[2].trim();
    if (src.startsWith('http')) out.push({ src, alt });
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
