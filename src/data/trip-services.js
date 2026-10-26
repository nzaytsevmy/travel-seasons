import { bySlug } from './directions.js';
import { classifyPage, buildCtaId } from './monetization.js';
import { blogGeography } from './editorial-geography.js';
import { aviasalesRoute, aviasalesUrl, cherehapaCountry, cherehapaTravel, ostrovokCountry, ostrovokCity, ostrovokSearch } from './affiliate.js';

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const PAGE_TYPES = new Set(['home','hotels_country','hotels_index','blog_article','blog_index','blog_tag','news_article','news_index','country_hub','packing_month','packing_country','packing_index','trips_country_month','trips_month','trips_index','visa_country','visa_index','calculator','cards','countries','bezviz','seasons_index','seasons_detail','events_index','events_month','compare_index','compare_page']);

// Article destinations. Missing city keeps the country catalogue; null airport uses general search.
const CITY_POSTS = {
  'sao-paulo-two-three-days': { destination:'brazil', country:'brazil', city:'sao_paulo', iata:'GRU', loc:'в Сан-Паулу', route:'Сан-Паулу' },
  'zion-bryce-horseshoe-bend-usa': { destination:'usa', iata:'LAS', route:'Лас-Вегас' },
  'norway-trolltunga-lofoten': { destination:'norway', iata:null },
  'madrid-gde-ostanovitsya': { destination:'spain', country:'spain', city:'madrid', iata:'MAD', loc:'в Мадриде', route:'Мадрид' },
  'chto-posmotret-v-gonkonge': { destination:'hong-kong', country:'china', city:'hong_kong', iata:'HKG', loc:'в Гонконге', route:'Гонконг' },
  'hanoi-one-day': { destination:'vietnam', country:'vietnam', city:'hanoi', iata:'HAN', loc:'в Ханое', route:'Ханой' },
};
const MULTI_COUNTRY=new Set(['guatemala-belize','costa-rica-panama']);
const REGIONAL_STAY_CATALOG={
  'australia-east':'Австралии','australia-north':'Австралии',
  bali:'Индонезии','sumatra-kalimantan':'Индонезии','raja-ampat':'Индонезии',
  'japan-hokkaido':'Японии','india-goa':'Индии',
  'italy-north':'Италии','italy-south':'Италии',
  'canada-rockies':'Канады','canada-east':'Канады',
  'chile-patagonia':'Чили','chile-fjords':'Чили',
  kamchatka:'России',karelia:'России',dagestan:'России',altai:'России',
};

export function planningEligible(pathname = '/') {
  const path = String(pathname).split(/[?#]/)[0];
  if (/\.(?:json|xml|txt|html)$/.test(path) || /^\/(?:data|go|api|legal|my|about)(?:\/|$)/.test(path)) return false;
  return PAGE_TYPES.has(classifyPage(path).type);
}

export function tripServices({ pathname='/', destination, placement='planning', geography } = {}) {
  const path = String(pathname).split(/[?#]/)[0];
  const slug = /^\/blog\/([^/]+)\//.exec(path)?.[1];
  const cityProfile = CITY_POSTS[slug];
  const inferred = path.startsWith('/trips/') ? path.split('/')[3]
    : /^\/(?:packing|seasons|visa)\//.test(path) ? path.split('/')[2] : classifyPage(path).destination;
  const article = geography || (slug ? blogGeography({slug}) : null);
  const selected = article && article.source !== 'unclassified' ? article.monetizationDestination
    : destination === undefined ? inferred : destination;
  const city = cityProfile && (!article || article.source === 'unclassified' || cityProfile.destination === selected) ? cityProfile : null;
  const dir = bySlug(city?.destination || selected);
  const known = Boolean(dir);
  const dest = dir?.slug || '';
  const loc = city?.loc || dir?.cases?.loc || '';
  const month = path.startsWith('/trips/') ? path.split('/')[2]
    : /^\/(?:packing|seasons)\//.test(path) ? path.split('/')[3] : '';
  const monthIdx = MONTHS.indexOf(month);
  const airport = city && Object.hasOwn(city,'iata') ? city.iata : (dest==='cambodia' ? 'SAI' : dir?.iata);
  const route = city?.route || (dest==='antarctica' ? 'Ушуая' : dest==='cambodia' ? 'Сиемреап' : dir?.cases?.nom || dir?.region?.split(/[&(,—]/)[0].trim());
  const flightSpecific = known && !MULTI_COUNTRY.has(dest) && /^[A-Z]{3}$/.test(airport || '');
  const staySpecific=known && dest!=='antarctica' && !MULTI_COUNTRY.has(dest);
  const make = (partner, offer, label, note, generic, href) => {
    const ctaId = buildCtaId(path, partner, placement);
    return {partner,offer,label,note,generic,destination:dest,ctaId,placement,href:href(ctaId)};
  };
  return [
    make('ostrovok','stay', dest==='antarctica' ? 'Найти жильё перед экспедицией' : staySpecific ? `Выбрать жильё ${loc}`.trim() : 'Выбрать жильё',
      dest==='antarctica' ? 'Выберите город ночёвки до и после экспедиции, даты и условия отмены.'
        : dest==='hainan' ? 'В каталоге Китая выберите Санью или Хайкоу, затем свои даты и число гостей; сравните адрес и полный тариф.'
        : REGIONAL_STAY_CATALOG[dest] ? `В каталоге ${REGIONAL_STAY_CATALOG[dest]} сначала выберите нужный регион или город, затем даты и число гостей; проверьте адрес и отмену.`
        : staySpecific ? 'Выберите нужный город, даты и число гостей; сравните адрес, полный тариф и отмену.' : 'Выберите город, даты и число гостей.', !staySpecific,
      id => city?.city ? ostrovokCity(city.country,city.city,id) : dest==='hong-kong' ? ostrovokCity('china','hong_kong',id) : staySpecific ? ostrovokCountry(dest,id) : ostrovokSearch(id)),
    make('aviasales','flight', flightSpecific ? `Посмотреть билеты Москва — ${route}` : 'Найти авиабилеты',
      dest==='antarctica' ? 'Это перелёт до Ушуаи перед экспедицией. Измените город вылета и даты; дальнейший маршрут согласуйте с оператором.'
        : flightSpecific ? 'В поиске задан вылет из Москвы. Измените город вылета и дату под свою поездку.' : 'Выберите город вылета, направление и свои даты.', !flightSpecific,
      id => flightSpecific ? aviasalesRoute('MOW',airport,id,monthIdx >= 0 ? monthIdx : undefined) : aviasalesUrl('',id)),
    make('cherehapa','insurance', 'Сравнить страховки для поездки',
      dest === 'tanzania' ? 'Проверьте даты и риски. Этот подбор не заменяет обязательную въездную страховку Танзании и Занзибара.'
        : dest === 'nepal' ? 'До оплаты проверьте покрытие трекинга, высоты маршрута и эвакуации.'
        : dest === 'antarctica' ? 'Для экспедиции подтвердите у страховой территорию, активности и эвакуацию до оплаты.'
        : known ? 'Укажите даты, проверьте территорию и нужные риски перед оплатой.' : 'Выберите все страны поездки, даты и нужные риски.', !known,
      id => known ? cherehapaCountry(dest,id) : cherehapaTravel(id)),
  ];
}
