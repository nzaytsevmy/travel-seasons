import costaRicaPanamaHotels from './hotel-guides/costa-rica-panama.json' with { type: 'json' };
import guatemalaBelizeHotels from './hotel-guides/guatemala-belize.json' with { type: 'json' };
import kamchatkaHotels from './hotel-guides/kamchatka.json' with { type: 'json' };
import altaiHotels from './hotel-guides/altai.json' with { type: 'json' };
import ecuadorHotels from './hotel-guides/ecuador.json' with { type: 'json' };
import boliviaHotels from './hotel-guides/bolivia.json' with { type: 'json' };
import cubaHotels from './hotel-guides/cuba.json' with { type: 'json' };
import tajikistanHotels from './hotel-guides/tajikistan.json' with { type: 'json' };
import nepalHotels from './hotel-guides/nepal.json' with { type: 'json' };
import japanHokkaidoHotels from './hotel-guides/japan-hokkaido.json' with { type: 'json' };
import dagestanHotels from './hotel-guides/dagestan.json' with { type: 'json' };
import kareliaHotels from './hotel-guides/karelia.json' with { type: 'json' };
import mexicoHotels from './hotel-guides/mexico.json' with { type: 'json' };
import madagascarHotels from './hotel-guides/madagascar.json' with { type: 'json' };
import rajaAmpatHotels from './hotel-guides/raja-ampat.json' with { type: 'json' };
import peruHotels from './hotel-guides/peru.json' with { type: 'json' };
import argentinaHotels from './hotel-guides/argentina.json' with { type: 'json' };
import canadaHotels from './hotel-guides/canada.json' with { type: 'json' };
import tanzaniaHotels from './hotel-guides/tanzania.json' with { type: 'json' };
import philippinesHotels from './hotel-guides/philippines.json' with { type: 'json' };
import iranHotels from './hotel-guides/iran.json' with { type: 'json' };
import dominicanRepublicHotels from './hotel-guides/dominican-republic.json' with { type: 'json' };
import sumatraKalimantanHotels from './hotel-guides/sumatra-kalimantan.json' with { type: 'json' };
import chileHotels from './hotel-guides/chile.json' with { type: 'json' };
import indiaGoaHotels from './hotel-guides/india-goa.json' with { type: 'json' };
import newZealandHotels from './hotel-guides/new-zealand.json' with { type: 'json' };
import australiaHotels from './hotel-guides/australia.json' with { type: 'json' };
import kyrgyzstanHotels from './hotel-guides/kyrgyzstan.json' with { type: 'json' };
import kenyaHotels from './hotel-guides/kenya.json' with { type: 'json' };
import brazilHotels from './hotel-guides/brazil.json' with { type: 'json' };
import southAfricaHotels from './hotel-guides/south-africa.json' with { type: 'json' };
import usaHotels from './hotel-guides/usa.json' with { type: 'json' };
import cambodiaHotels from './hotel-guides/cambodia.json' with { type: 'json' };
import icelandHotels from './hotel-guides/iceland.json' with { type: 'json' };
import norwayHotels from './hotel-guides/norway.json' with { type: 'json' };
import serbiaHotels from './hotel-guides/serbia.json' with { type: 'json' };
// Редакционные подборки: объекты, кадры и ссылки проверяются по отдельности.
// Отсутствие подборки не подменяется общим поиском с обещанием «топ-10».
import { tpkDeep } from './affiliate.js';
import { bySlug } from './directions.js';
import galleries from './hotel-galleries.json' with { type: 'json' };
import finlandHotels from './hotel-guides/finland.json' with { type: 'json' };
import abkhaziaHotels from './hotel-guides/abkhazia.json' with { type: 'json' };
import chinaHotels from './hotel-guides/china.json' with { type: 'json' };
import israelHotels from './hotel-guides/israel.json' with { type: 'json' };
import jordanHotels from './hotel-guides/jordan.json' with { type: 'json' };
import saudiArabiaHotels from './hotel-guides/saudi-arabia.json' with { type: 'json' };
import seychellesHotels from './hotel-guides/seychelles.json' with { type: 'json' };
import southKoreaHotels from './hotel-guides/south-korea.json' with { type: 'json' };
import armeniaHotels from './hotel-guides/armenia.json' with { type: 'json' };
import uzbekistanHotels from './hotel-guides/uzbekistan.json' with { type: 'json' };
import kazakhstanHotels from './hotel-guides/kazakhstan.json' with { type: 'json' };
import sriLankaHotels from './hotel-guides/sri-lanka.json' with { type: 'json' };
import italyHotels from './hotel-guides/italy.json' with { type: 'json' };
import turkeyHotels from './hotel-guides/turkey.json' with { type: 'json' };
import egyptHotels from './hotel-guides/egypt.json' with { type: 'json' };
import spainHotels from './hotel-guides/spain.json' with { type: 'json' };
import switzerlandHotels from './hotel-guides/switzerland.json' with { type: 'json' };
import croatiaHotels from './hotel-guides/croatia.json' with { type: 'json' };
import greeceHotels from './hotel-guides/greece.json' with { type: 'json' };
import malaysiaHotels from './hotel-guides/malaysia.json' with { type: 'json' };
import vietnamHotels from './hotel-guides/vietnam.json' with { type: 'json' };
import cyprusHotels from './hotel-guides/cyprus.json' with { type: 'json' };
import georgiaHotels from './hotel-guides/georgia.json' with { type: 'json' };
import hongKongHotels from './hotel-guides/hong-kong.json' with { type: 'json' };
import japanHotels from './hotel-guides/japan.json' with { type: 'json' };
import baliHotels from './hotel-guides/bali.json' with { type: 'json' };
import omanHotels from './hotel-guides/oman.json' with { type: 'json' };
import uaeHotels from './hotel-guides/uae.json' with { type: 'json' };
import qatarHotels from './hotel-guides/qatar.json' with { type: 'json' };
import mauritiusHotels from './hotel-guides/mauritius.json' with { type: 'json' };
import maldivesHotels from './hotel-guides/maldives.json' with { type: 'json' };
import thailandHotels from './hotel-guides/thailand.json' with { type: 'json' };
import moroccoHotels from './hotel-guides/morocco.json' with { type: 'json' };

const property = (id, name, location, reason, caveat, path, checked = '2026-10-16') => ({
  id, name, location, reason, caveat,
  image: galleries[`singapore/${id}`]?.[0]?.image || `singapore/${id}.webp`,
  photoCreditKey: galleries[`singapore/${id}`]?.[0]?.creditKey || id,
  photoAlt: galleries[`singapore/${id}`]?.[0]?.alt,
  photoCaption: galleries[`singapore/${id}`]?.[0]?.caption,
  sources: [`https://ostrovok.ru/hotel/singapore/singapore2/${path}/`],
  booking: { partner: 'ostrovok', target: `https://ostrovok.ru/hotel/singapore/singapore2/${path}/` },
  checked,
});

export const HOTEL_COLLECTIONS = {
  'costa-rica-panama': costaRicaPanamaHotels,
  'guatemala-belize': guatemalaBelizeHotels,
  'kamchatka': kamchatkaHotels,
  'altai': altaiHotels,
  'ecuador': ecuadorHotels,
  'bolivia': boliviaHotels,
  'cuba': cubaHotels,
  'tajikistan': tajikistanHotels,
  'nepal': nepalHotels,
  'japan-hokkaido': japanHokkaidoHotels,
  'dagestan': dagestanHotels,
  'karelia': kareliaHotels,
  'mexico': mexicoHotels,
  'madagascar': madagascarHotels,
  'raja-ampat': rajaAmpatHotels,
  'peru': peruHotels,
  'argentina': argentinaHotels,
  'canada': canadaHotels,
  'tanzania': tanzaniaHotels,
  'philippines': philippinesHotels,
  'iran': iranHotels,
  'dominican-republic': dominicanRepublicHotels,
  'sumatra-kalimantan': sumatraKalimantanHotels,
  'chile': chileHotels,
  'india-goa': indiaGoaHotels,
  'new-zealand': newZealandHotels,
  'australia': australiaHotels,
  'kyrgyzstan': kyrgyzstanHotels,
  'kenya': kenyaHotels,
  'brazil': brazilHotels,
  'south-africa': southAfricaHotels,
  'usa': usaHotels,
  'cambodia': cambodiaHotels,
  'iceland': icelandHotels,
  'norway': norwayHotels,
  'serbia': serbiaHotels,
  finland: finlandHotels, abkhazia: abkhaziaHotels,
  china: chinaHotels, israel: israelHotels, jordan: jordanHotels, 'saudi-arabia': saudiArabiaHotels,
  seychelles: seychellesHotels, 'south-korea': southKoreaHotels,
  armenia: armeniaHotels, uzbekistan: uzbekistanHotels, kazakhstan: kazakhstanHotels,
  malaysia: malaysiaHotels, vietnam: vietnamHotels, cyprus: cyprusHotels, georgia: georgiaHotels,
  spain: spainHotels, switzerland: switzerlandHotels, croatia: croatiaHotels, greece: greeceHotels,
  italy: italyHotels,
  turkey: turkeyHotels,
  egypt: egyptHotels,
  'sri-lanka': sriLankaHotels,
  'hong-kong': hongKongHotels,
  'japan': japanHotels,
  'bali': baliHotels,
  oman: omanHotels, uae: uaeHotels, qatar: qatarHotels,
  mauritius: mauritiusHotels, maldives: maldivesHotels, thailand: thailandHotels, morocco: moroccoHotels,
  singapore: {
    title: '10 лучших отелей Сингапура',
    heading: 'Лучшие отели Сингапура',
    intro: 'Бассейн над городом, белые аркады Raffles, зелёные террасы PARKROYAL Pickering. Десять разных способов остаться в Сингапуре чуть дольше.',
    // Release candidate. Publication still requires the full repository gate and verified live redirects.
    status: 'ready',
    hotels: [
      property('fullerton-bay', 'The Fullerton Bay Hotel', 'Набережная Марина-Бэй', 'Остановиться у самой воды и выходить вечером на набережную. Стекло, свет и отражения залива вместо высотной башни.', 'При бронировании отдельно проверьте, на какую сторону выходят окна.', 'mid7385556/the_fullerton_bay_hotel'),
      property('raffles', 'Raffles Singapore', 'Бич-роуд', 'Белые аркады, внутренние дворы и колониальная архитектура. Для поездки, в которой сам отель становится частью маршрута.', 'Это городской отель; за пляжным отдыхом лучше отправиться на Сентозу.', 'mid7548048/raffles_hotel'),
      property('fullerton', 'The Fullerton Hotel Singapore', 'Устье реки Сингапур', 'Монументальный фасад бывшего почтамта, река и набережные рядом. Для пеших прогулок между старым городом и заливом.', 'У отеля есть номера с видом во внутренний двор; уточните вид до оплаты.', 'mid7385381/the_fullerton_hotel_singapore'),
      property('marina-bay-sands', 'Marina Bay Sands', 'Марина-Бэй', 'Тот самый бассейн над линией небоскрёбов. Выбирать ради вида на город и вечера у залива.', 'Проверьте категорию номера: вид на залив и вид на город отличаются.', 'mid7376183/marina_bay_sands'),
      property('parkroyal-pickering', 'PARKROYAL COLLECTION Pickering', 'Пикеринг-стрит, рядом с Чайна-тауном', 'Зелёные террасы, плавные линии фасада и бассейн над улицами. Для тех, кому хочется жить внутри необычной архитектуры и гулять по центру.', 'Городской отель без пляжа: бассейн и садовые террасы здесь важнее морского отдыха.', 'mid7702852/parkroyal_on_pickering', '2026-10-17'),
      property('ritz-carlton', 'The Ritz-Carlton, Millenia Singapore', 'Марина-Бэй', 'Светлые общественные пространства и залив рядом. Вариант для тех, кто хочет жить возле музеев, набережной и Gardens by the Bay.', 'Панорама зависит от категории номера; фотография вида не относится ко всем номерам.', 'mid7548785/the_ritzcarlton_millenia_singapore'),
      property('mandarin-oriental', 'Mandarin Oriental, Singapore', 'Марина-Сквер', 'Городской отель рядом с заливом и Эспланадой. Удобная база для прогулок с возвращением в отель между выходами.', 'Выбирайте конкретную категорию и вид, а не только название отеля.', 'mid7548797/mandarin_oriental_singapore'),
      property('shangri-la', 'Shangri-La Singapore', 'Орчард', 'Зелень, бассейн и территория вдали от воды Марина-Бэй. Для тех, кому после города нужен более спокойный ритм.', 'Не путайте с Shangri-La Rasa Sentosa: это другой отель, без островного пляжа.', 'mid7573351/shangrila_hotel_singapore'),
      property('swissotel', 'Swissôtel The Stamford', 'Сити-Холл', 'Высотная башня у City Hall: выбирать ради центрального положения и городской панорамы.', 'Высокий этаж и нужный вид проверяйте в условиях конкретного номера.', 'mid7548087/swissotel_the_stamford'),
      property('pan-pacific', 'Pan Pacific Singapore', 'Марина-Сентр', 'Отель в высотной части Марина-Сентр, рядом с торговыми галереями и прогулками у залива.', 'Это Pan Pacific Singapore, а не Pan Pacific Orchard; проверьте адрес в бронировании.', 'mid7548080/pan_pacific_singapore'),
    ],
  },
};

export function hotelGallery(country, hotel) {
  return hotel.photos || galleries[`${country}/${hotel.id}`] || (hotel.image ? [{
    image: hotel.image, creditKey: hotel.photoCreditKey || hotel.id,
    alt: hotel.photoAlt || `${hotel.name}, ${hotel.location}`,
    caption: hotel.photoCaption || `${hotel.name}, ${hotel.location}`,
  }] : []);
}

export function collectionHasCompleteGalleries(country, collection) {
  return collection.hotels.length === 10 && collection.hotels.every(hotel => {
    const photos = hotelGallery(country, hotel);
    return photos.length >= 3 && photos.length <= 5 &&
      photos.every(photo => photo.image && photo.creditKey && photo.alt) &&
      new Set(photos.map(photo => photo.image)).size === photos.length &&
      new Set(photos.map(photo => photo.creditKey)).size === photos.length;
  });
}

const HOTEL_HUB_COUNTRIES = { 'italy-north': 'italy', 'italy-south': 'italy', china: 'china', hainan: 'china', 'australia-east': 'australia', 'australia-north': 'australia', chile: 'chile', 'chile-patagonia': 'chile', 'chile-fjords': 'chile', 'canada-east': 'canada', 'canada-rockies': 'canada' };
const HOTEL_HUB_PICKS = {
  'canada-east': ['fairmont-frontenac', 'le-germain-toronto', 'w-montreal'],
  'canada-rockies': ['fairmont-lake-louise', 'moose-banff', 'buffalo-banff'],
  chile: ['cumbres-lastarria', 'singular-patagonia', 'novotel-puerto-montt'],
  'chile-patagonia': ['singular-patagonia', 'weskar-lodge', 'noi-indigo'],
  'chile-fjords': ['novotel-puerto-montt', 'don-luis-puerto-montt', 'departamentos-del-sur'],
  'sumatra-kalimantan': ['taman-simalem', 'jw-marriott-medan', 'gardenia-pontianak'],
  'italy-north': ['grand-hotel-tremezzo', 'villa-serbelloni', 'aman-venice'],
  'italy-south': ['hassler-roma', 'sirenuse-positano', 'santa-caterina-amalfi'],
  hainan: ['edition-sanya', 'atlantis-sanya', 'mandarin-sanya'],
  'australia-east': ['park-hyatt-sydney', 'kimpton-margot', 'vibe-melbourne'],
  'australia-north': ['hilton-garden-darwin', 'zen-quarter-darwin', 'hilton-darwin'],
};

export function hotelCountrySlug(destination) {
  return Object.hasOwn(HOTEL_HUB_COUNTRIES, destination) ? HOTEL_HUB_COUNTRIES[destination] : destination;
}

export function hotelGuideHubs(country) {
  const canonical = hotelCountrySlug(country);
  const aliases = Object.entries(HOTEL_HUB_COUNTRIES).filter(([, target]) => target === canonical).map(([slug]) => slug);
  return (aliases.length ? aliases : [canonical]).map(slug => {
    const hub = bySlug(slug);
    if (!hub) throw new Error(`У подборки нет путеводителя: ${country}/${slug}`);
    return hub;
  });
}

export function hotelHubPicks(destination, collection) {
  if (!collection) return [];
  const picks = !Object.hasOwn(HOTEL_HUB_PICKS, destination) ? collection.hotels.slice(0, 3) : HOTEL_HUB_PICKS[destination].map(id => {
    const hotel = collection.hotels.find(hotel => hotel.id === id);
    if (!hotel) throw new Error(`Отель регионального блока отсутствует в подборке: ${destination}/${id}`);
    return hotel;
  });
  return picks.map(hotel => {
    const cover = hotelGallery(hotelCountrySlug(destination), hotel)[0];
    return { ...hotel, image: cover?.image, photoAlt: cover?.alt, photoCaption: cover?.caption, photoCreditKey: cover?.creditKey };
  });
}

export function hotelCollection(slug, { includeDraft = false } = {}) {
  const country = hotelCountrySlug(slug);
  const collection = Object.hasOwn(HOTEL_COLLECTIONS, country) ? HOTEL_COLLECTIONS[country] : null;
  return collection && (includeDraft || (collection.status === 'ready' && collectionHasCompleteGalleries(country, collection))) ? collection : null;
}

export function readyHotelCollections() {
  return Object.entries(HOTEL_COLLECTIONS).filter(([country, collection]) => collection.status === 'ready' && collectionHasCompleteGalleries(country, collection));
}

// Astro dev serves complete drafts for local review; production keeps the ready gate.
export function hotelRouteCollections({ development = false } = {}) {
  return development
    ? Object.entries(HOTEL_COLLECTIONS).filter(([country, collection]) => collectionHasCompleteGalleries(country, collection))
    : readyHotelCollections();
}

export function hotelBookingUrl(country, hotel) {
  const allowedHosts = { ostrovok: 'ostrovok.ru', yandexTravel: 'travel.yandex.ru', otello: 'otello.ru' };
  const { partner, target } = hotel.booking;
  const url = new URL(target);
  if (url.protocol !== 'https:' || url.hostname !== allowedHosts[partner] || url.port || url.username || url.password) {
    throw new Error(`Неверная страница отеля: ${country}/${hotel.id}`);
  }
  if (partner === 'ostrovok' && (!/^\/hotel\/(?:[a-z0-9_-]+\/){1,4}mid[0-9]+\/[a-z0-9_-]+\/$/.test(url.pathname) || url.search || url.hash)) {
    throw new Error(`Ссылка должна открывать конкретный отель: ${country}/${hotel.id}`);
  }
  if (!/^[a-z0-9-]+$/.test(country) || !/^[a-z0-9-]+$/.test(hotel.id)) throw new Error('Некорректный идентификатор отеля');
  return tpkDeep(partner, url.href, `hotels_${country}_${hotel.id}`);
}
