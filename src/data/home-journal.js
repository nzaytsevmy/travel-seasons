import { COUNTRY_PHOTOS } from './country-photos.js';

export const HOME_HERO = { key: 'src/assets/destinations/georgia.jpg', alt: 'Троицкая церковь в Гергети под Казбеком, Грузия' };
export const HOME_STORIES = [
  'patagonia-2026', 'chto-posmotret-v-gonkonge', 'nepal-everest-trek-2026', 'thailand-guide-2026',
  'machu-picchu-marshruty-bilety-2026', 'chto-vzyat-na-more-2026', 'antarctica-cruise-2026', 'tonga-whales',
];
export const HOME_STORY_PHOTOS = {
  'patagonia-2026': 'src/content/blog/_images/chile-own/torres.jpg',
  'chto-posmotret-v-gonkonge': 'src/content/blog/_images/chto-posmotret-v-gonkonge/harbour-night.jpg',
  'nepal-everest-trek-2026': 'src/content/blog/_images/nepal-everest-trek-2026/cover-everest-lhotse.jpg',
  'thailand-guide-2026': 'src/content/blog/_images/thailand/cover-guide.webp',
  'machu-picchu-marshruty-bilety-2026': 'src/content/blog/_images/peru-own/machu2.jpg',
  'chto-vzyat-na-more-2026': 'src/content/blog/_images/turkey-own/beach.jpg',
  'antarctica-cruise-2026': 'src/content/blog/_images/antarctica/iceberg-blue.jpg',
  'tonga-whales': 'src/content/blog/_images/tonga-whales/whale-underwater.jpg',
};
export const HOME_MOODS = [
  { vibe: 'beach', title: 'К морю', note: 'Острова, пляжи, тёплая вода', photo: COUNTRY_PHOTOS.thailand.wide },
  { vibe: 'mountains', title: 'В горы', note: 'Треки и большие пейзажи', photo: COUNTRY_PHOTOS.nepal.wide },
  { vibe: 'city', title: 'В города', note: 'Улицы, музеи и местная еда', photo: COUNTRY_PHOTOS.japan.practice[0] },
  { vibe: 'nature', title: 'На природу', note: 'Сафари, леса и национальные парки', photo: COUNTRY_PHOTOS.tanzania.practice[1] },
];

export function countryPhotoSources(slug) {
  const photos = COUNTRY_PHOTOS[slug];
  // Оман — отдельная авторская страница, её проверенные кадры не входят
  // в COUNTRY_PHOTOS. Те же исходники и лицензии на /legal/photos/.
  const oman = slug === 'oman' ? [
    { file: 'oman-v2/canyon.jpg', alt: 'Каньон Джебель-Шамс, Оман' },
    { file: 'oman-v2/nizwa.jpg', alt: 'Крепость Низва, Оман' },
    { file: 'oman-v2/wahiba.jpg', alt: 'Песчаные дюны Вахиба, Оман' },
    { file: 'oman-v2/mosque.jpg', alt: 'Мечеть султана Кабуса в Маскате, Оман' },
  ] : [];
  const antarctica = slug === 'antarctica' ? [
    { file: 'antarctica-blue-ice.jpg', alt: 'Голубая ледяная стена у воды, Антарктида' },
    { file: 'antarctica-gentoo.jpg', alt: 'Папуанские пингвины на каменистом берегу, Антарктида' },
  ] : [];
  const country = slug === 'australia-east'
    ? [photos.practice[2], photos.practice[0], photos.practice[1]]
    : [photos?.wide, ...(photos?.practice || [])];
  return [...country, ...oman, ...antarctica]
    .filter(Boolean).filter((p, i, all) => all.findIndex(x => x.file === p.file) === i);
}

// Один исходник — один кадр, независимо от размера WebP или кропа.
// Резервируем большие истории и обложки до распределения подборок.
export function allocateHomePhotos(collections, pools, reserved, month) {
  const used = new Set(reserved);
  const result = {};
  for (const [name, rows] of Object.entries(collections)) {
    result[name] = rows.map(row => {
      const photo = pools[row.slug]?.find(p => !used.has(p.id) && (!month || !p.months?.length || p.months.includes(month)));
      if (!photo) throw new Error(`Недостаточно разных сезонно подходящих фотографий: ${row.slug}, ${name}, ${month}`);
      used.add(photo.id);
      return { ...row, photo };
    });
  }
  return result;
}
