import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const fontRegular = fs.readFileSync(path.resolve('./tools/og-fonts/NotoSans-Regular.ttf'));
const fontBold = fs.readFileSync(path.resolve('./tools/og-fonts/NotoSans-Bold.ttf'));

interface OgPostData {
  title: string;
  description: string;
  tag: string;
  isPersonal: boolean;
  tripPlace?: string;
}

function template(data: OgPostData): any {
  const accent = '#c9973a';
  const bg = '#0c0a08';
  const text = '#f5efe4';
  const textDim = '#a59c8b';

  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        background: bg,
        color: text,
        fontFamily: 'Inter',
        padding: '70px 80px',
        position: 'relative',
        backgroundImage: `radial-gradient(circle at 80% 20%, rgba(201,151,58,0.18) 0%, rgba(12,10,8,0) 55%), radial-gradient(circle at 10% 90%, rgba(74,158,255,0.06) 0%, rgba(12,10,8,0) 50%)`,
      },
      children: [
        // Top: brand + tag
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '14px' },
                  children: [
                    { type: 'div', props: { style: { width: '12px', height: '12px', background: accent, borderRadius: '50%' } } },
                    { type: 'div', props: { style: { fontSize: '32px', fontWeight: 700, letterSpacing: '-0.01em' }, children: 'TravelTribe' } },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '20px', letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: accent, border: `1px solid ${accent}`, padding: '8px 18px',
                    borderRadius: '40px', background: 'rgba(201,151,58,0.10)',
                  },
                  children: data.tag,
                },
              },
            ],
          },
        },
        // Spacer
        { type: 'div', props: { style: { flex: '1 1 auto' } } },
        // Title
        {
          type: 'div',
          props: {
            style: {
              fontSize: '64px', fontWeight: 700, lineHeight: 1.05,
              letterSpacing: '-0.02em', maxWidth: '1040px', color: text,
            },
            children: data.title,
          },
        },
        // Description / location
        data.tripPlace
          ? {
              type: 'div',
              props: {
                style: {
                  marginTop: '24px', fontSize: '24px', color: accent,
                  display: 'flex', alignItems: 'center', gap: '12px',
                },
                children: [
                  { type: 'div', props: { style: { width: '8px', height: '8px', background: accent, borderRadius: '50%' } } },
                  { type: 'div', props: { children: `Был лично — ${data.tripPlace}` } },
                ],
              },
            }
          : {
              type: 'div',
              props: {
                style: { marginTop: '24px', fontSize: '24px', color: textDim, maxWidth: '1040px', lineHeight: 1.4 },
                children: data.description.length > 130 ? data.description.slice(0, 130) + '…' : data.description,
              },
            },
        // Bottom: domain + author
        {
          type: 'div',
          props: {
            style: {
              marginTop: '40px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', borderTop: '1px solid rgba(201,151,58,0.25)', paddingTop: '22px',
            },
            children: [
              {
                type: 'div',
                props: { style: { fontSize: '22px', color: textDim, letterSpacing: '0.06em' }, children: 'traveltribe.ru' },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '22px', color: textDim, display: 'flex', gap: '10px' },
                  children: [
                    { type: 'div', props: { children: 'Никита Зайцев' } },
                    { type: 'div', props: { style: { color: accent }, children: '·' } },
                    { type: 'div', props: { children: '@traveltriberu' } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
    props: {
      title: post.data.title,
      description: post.data.description,
      tag: (post.data.tags && post.data.tags[0]) ? post.data.tags[0] : 'Travel',
      isPersonal: post.data.sourceType === 'personal',
      tripPlace: post.data.tripPlace,
    },
  }));
  // Hub pages
  paths.push({
    params: { slug: 'hub-antarctica' },
    props: {
      title: `Антарктида ${new Date().getFullYear()} — круизы, цены, маршрут из Москвы`,
      description: 'Цены круиза 750 000 – 4 500 000 ₽, виза в Аргентину не нужна, сезон ноябрь – март. Личный опыт.',
      tag: 'Антарктида',
      isPersonal: true,
      tripPlace: 'Антарктида, январь 2025',
    },
  });
  paths.push({
    params: { slug: 'hub-japan' },
    props: {
      title: `Япония ${new Date().getFullYear()} — виза, сезоны, бюджет для россиян`,
      description: 'Виза бесплатна (JVAC 970 ₽), бюджет $50 – 300 в день, лучший сезон момидзи в ноябре.',
      tag: 'Япония',
      isPersonal: false,
    },
  });
  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  const data = props as unknown as OgPostData;
  const tree = template(data);

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontRegular as any, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold as any, weight: 700, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
