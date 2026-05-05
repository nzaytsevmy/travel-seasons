import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog');

  const urls = posts.map(post => {
    const url = `https://traveltribe.ru/blog/${post.slug}/`;
    const cover = post.data.coverImage;
    const coverUrl = typeof cover === 'string'
      ? cover
      : `https://traveltribe.ru${cover.src}`;
    const title = post.data.title.replace(/[<>&"']/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
    }[c]));

    return `  <url>
    <loc>${url}</loc>
    <image:image>
      <image:loc>${coverUrl}</image:loc>
      <image:title>${title}</image:title>
    </image:image>
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
