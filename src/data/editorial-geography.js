// Editorial geography is independent of recommendation order and commercial offers.
// [] is an intentional general subject, not an invitation to pick the first country.
import BLOG_GEOGRAPHY from './blog-geography.json' with { type: 'json' };
import { DIRECTIONS, bySlug } from './directions.js';

const REGION_COUNTRIES = {
  'australia-east':['australia'], 'australia-north':['australia'],
  bali:['indonesia'], 'sumatra-kalimantan':['indonesia'], 'raja-ampat':['indonesia'],
  'japan-hokkaido':['japan'], hainan:['china'], 'india-goa':['india'],
  'italy-north':['italy'], 'italy-south':['italy'],
  'canada-rockies':['canada'], 'canada-east':['canada'],
  'chile-patagonia':['chile'], 'chile-fjords':['chile'],
  kamchatka:['russia'], karelia:['russia'], dagestan:['russia'], altai:['russia'],
  'guatemala-belize':['guatemala','belize'], 'costa-rica-panama':['costa-rica','panama'],
};

// A country may exist in the editorial catalogue without a priced destination hub.
// Tag links below exist in the blog; no missing /country/ pages are manufactured.
const COUNTRIES = {
  australia:{label:'Австралия',tag:'Австралия'},
  indonesia:{label:'Индонезия',tag:'Индонезия'},
  india:{label:'Индия',tag:'Индия'},
  canada:{label:'Канада'},
  italy:{label:'Италия'},
  russia:{label:'Россия',tag:'Россия'},
  azerbaijan:{label:'Азербайджан',tag:'Азербайджан'},
  montenegro:{label:'Черногория',tag:'Черногория'},
  fiji:{label:'Фиджи',tag:'Фиджи'}, tonga:{label:'Тонга',tag:'Тонга'},
  uganda:{label:'Уганда',tag:'Уганда'}, namibia:{label:'Намибия'}, tunisia:{label:'Тунис'},
  botswana:{label:'Ботсвана'}, zambia:{label:'Замбия'}, zimbabwe:{label:'Зимбабве'},
  'papua-new-guinea':{label:'Папуа — Новая Гвинея'},
  'timor-leste':{label:'Восточный Тимор'}, rwanda:{label:'Руанда'},
  guatemala:{label:'Гватемала'}, belize:{label:'Белиз'},
  'costa-rica':{label:'Коста-Рика'}, panama:{label:'Панама'},
  poland:{label:'Польша'}, france:{label:'Франция'}, germany:{label:'Германия'},
  venezuela:{label:'Венесуэла'}, colombia:{label:'Колумбия'},
  'united-kingdom':{label:'Великобритания'}, ireland:{label:'Ирландия'},
  'french-polynesia':{label:'Французская Полинезия'},
  schengen:{label:'Шенген',tag:'Шенген',kind:'region'},
};

// Corrections from the full 252-story audit; article prose and event dates stay intact.
export const NEWS_GEOGRAPHY = {
  '2026-07-31-dfad-marine-protected-areas':['maldives','seychelles','french-polynesia'],
  '2026-08-16-mpa-sharks-rays-coverage-gap':[],
  '2026-08-21-el-nino-strongest-forecast':[],
  '2026-08-23-kluane-wolf-closure':['canada'],
  '2026-08-25-sepik-spinach-pipefish':['papua-new-guinea'],
  '2026-08-29-kluane-wolf-shot-trails-reopen':['canada'],
  '2026-08-30-eagle-migration-russia-uganda':['turkey','uganda','russia'],
  '2026-08-31-global-coral-cover-decline':[],
  '2026-09-06-anak-krakatau-ash-flights':['indonesia'],
  '2026-09-11-java-ijen-bromo-fire-closures':['indonesia'],
  '2026-09-13-canada-parks-paid-admission':['canada'],
  '2026-09-14-bromo-all-entrances-closed':['indonesia'],
  '2026-09-14-costa-rica-crabs-sea-snakes':['costa-rica'],
  '2026-09-18-goa-porvorim-scooter-restrictions':['india-goa'],
  '2026-09-19-zambia-wild-dogs-journey':['zambia'],
  '2026-09-21-studland-seagrass-moorings':['united-kingdom'],
  '2026-09-21-veduchi-ski-expansion-plan':['russia'],
  '2026-09-30-stena-ireland-wales-passports':['ireland','united-kingdom'],
  '2026-09-30-zimbabwe-cattle-eyespots':['zimbabwe'],
  '2026-10-10-panama-earthquake':['panama'],
  '2026-10-11-zimbabwe-musango-dinosaur':['zimbabwe'],
  '2026-10-13-fiji-bee-genetic-bottleneck':['fiji'],
  '2026-10-13-firefly-seletar-haze-cancellations':['malaysia','singapore'],
  '2026-10-13-uk-contactless-egates':['united-kingdom'],
  '2026-10-14-aeroflot-flight-changes':['russia'],
  '2026-10-14-banff-johnston-canyon-closure':['canada-rockies'],
  '2026-10-20-coral-clone-recovery':[],
  '2026-10-22-costa-rica-manta-coastal-nurseries':['costa-rica'],
};

const unique = values => [...new Set(values)];

export function placeForId(id) {
  const direction=bySlug(id);
  if(direction) return {id,label:direction.cases?.nom || direction.region,href:`/${id}/`,kind:'destination',direction};
  const country=COUNTRIES[id];
  if(!country) return null;
  return {id,label:country.label,href:country.tag?`/blog/tag/${country.tag}/`:null,kind:country.kind || 'country',direction:null};
}

function context(ids, source) {
  const normalized=unique(ids);
  const places=normalized.map(id=>placeForId(id));
  const unknown=normalized.filter((id,i)=>!places[i]);
  if(unknown.length) throw new Error(`Unknown editorial geography: ${unknown.join(', ')}`);
  const primaryDirection=places.length===1?places[0].direction:null;
  return {ids:normalized,places,directions:places.flatMap(p=>p.direction?[p.direction]:[]),primaryDirection,monetizationDestination:primaryDirection?.slug || '',source};
}

export function blogGeography({slug,data={}}) {
  if(Array.isArray(data.destinations)) return context(data.destinations,'frontmatter');
  if(Object.hasOwn(BLOG_GEOGRAPHY,slug)) return context(BLOG_GEOGRAPHY[slug],'reviewed-catalogue');
  // A new single-country article can use its canonical tag. Ambiguous tags remain
  // multiple destinations; the country cannot change when recommendations reorder.
  const tags=new Set((data.tags || []).map(t=>String(t).trim().toLowerCase()));
  const matches=DIRECTIONS.filter(d=>[d.slug,d.region,d.cases?.nom].some(t=>t&&tags.has(t.toLowerCase()))).map(d=>d.slug);
  const extra=Object.entries(COUNTRIES).filter(([,p])=>p.tag&&tags.has(p.tag.toLowerCase())).map(([id])=>id);
  const ids=unique([...matches,...extra]);
  return context(ids,ids.length?'tags':'unclassified');
}

export function newsCountryIds(entry) {
  return Object.hasOwn(NEWS_GEOGRAPHY,entry.slug)?NEWS_GEOGRAPHY[entry.slug]:entry.data.countries || [];
}
export function newsGeography(entry) {return context(newsCountryIds(entry),'news-metadata');}
export function countryIds(ids=[]) {return unique(ids.flatMap(id=>REGION_COUNTRIES[id] || [id]));}

// A country and one of its regions are not interchangeable. A Hainan story is
// relevant to the whole China hub, but a Beijing story does not belong to Hainan.
// A country without its own hub must not be silently replaced by one of its regions.
export function geographyMatches(ids,target) {
  const targetCountries=countryIds([target]);
  return ids.some(id=>id===target || countryIds([id]).some(country=>targetCountries.includes(country)&&(target===country||targetCountries.length>1)));
}

export { BLOG_GEOGRAPHY };
