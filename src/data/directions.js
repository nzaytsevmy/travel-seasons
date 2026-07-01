// Derived registry of all 70 destinations with stable slug, visa, budget, monthly
// data, and prices. Built from data/regions.js + data/prices.js — single source
// of truth for /visa/<slug>/ and /trips/<month>/<slug>/ programmatic pages.

import { data as regions } from './regions.js';
import { PRICES } from './prices.js';
import { regionMeta } from './regions-meta.js';

const TRANSLIT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'c','ч':'ch','ш':'sh','щ':'sch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
};
function slugify(s) {
  return s.toLowerCase()
    .split('').map(c => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Manual slug overrides — built from actual region|sub keys in regions.js
const SLUG_OVERRIDES = {
  'Австралия|Восток: Сидней, Мельбурн': 'australia-east',
  'Австралия|Север: Дарвин, Какаду': 'australia-north',
  'Бали & Lombok|Нуса Тенггара': 'bali',
  'Суматра & Калимантан|Орангутаны, джунгли': 'sumatra-kalimantan',
  'Раджа-Ампат|Папуа Барат, дайвинг': 'raja-ampat',
  'Кения|Масаи Мара, Найроби, сафари': 'kenya',
  'ЮАР|Кейптаун + Крюгер': 'south-africa',
  'ОАЭ|Дубай, Абу-Даби': 'uae',
  'Турция|Анталья, Стамбул, Каппадокия': 'turkey',
  'Египет|Хургада, Шарм-эль-Шейх, Каир': 'egypt',
  'Марокко|Маракеш, Касабланка, Атлас': 'morocco',
  'Япония|Токио, Киото, Осака': 'japan',
  'Южная Корея|Сеул, Пусан, Чеджудо': 'south-korea',
  'Таиланд|Пхукет, Самуи, Бангкок': 'thailand',
  'Вьетнам|Нячанг, Фукуок, Хошимин, Ханой': 'vietnam',
  'Индия (Гоа)|Север: Калангут, Юг: Палолем': 'india-goa',
  'Шри-Ланка|Юг + Запад / Восток (муссоны)': 'sri-lanka',
  'Мальдивы|Атоллы, дайвинг': 'maldives',
  'Грузия|Тбилиси, Батуми, Казбеги': 'georgia',
  'Армения|Ереван, Севан, Дилижан': 'armenia',
  'Кыргызстан|Юг: Ош, Сары-Таш, Алайская долина': 'kyrgyzstan',
  'Узбекистан|Самарканд, Бухара, Хива': 'uzbekistan',
  'Таджикистан|Памирский тракт, Душанбе': 'tajikistan',
  'Казахстан|Алматы, Чарынский каньон, степи': 'kazakhstan',
  'Швейцария|Альпы: Церматт, Интерлакен, Люцерн': 'switzerland',
  'Северная Италия|Озёра (Комо, Гарда), Доломиты, Венеция': 'italy-north',
  'Италия (Центр/Юг)|Рим, Тоскана, Сицилия, Амальфи': 'italy-south',
  'Испания|Барселона, Мадрид, Канары': 'spain',
  'Греция|Афины, Крит, Санторини, Корфу': 'greece',
  'Хорватия|Далмация: Дубровник, Сплит, острова': 'croatia',
  'Канада|Банф, Джаспер (горы)': 'canada-rockies',
  'Канада|Квебек, Онтарио (восток)': 'canada-east',
  'Мексика|Юкатан, Канкун, Мехико': 'mexico',
  'Куба|Варадеро, Гавана, Тринидад': 'cuba',
  'Доминикана|Пунта-Кана, Самана, Санто-Доминго': 'dominican-republic',
  'Гватемала & Белиз|Тикаль, Антигуа, Карибы': 'guatemala-belize',
  'Коста-Рика & Панама|Природа, пляжи обоих побережий': 'costa-rica-panama',
  'Чилийская Патагония|Торрес-дель-Пайне, Пуэрто-Наталес': 'chile-patagonia',
  'Чилийские фьорды|Каррера, Чилоэ, Айсен': 'chile-fjords',
  // Latam расширение
  'Перу|Куско, Мачу-Пикчу, Лима': 'peru',
  'Боливия|Уюни, Ла-Пас, Тити-кака': 'bolivia',
  'Чили|Атакама, Сантьяго': 'chile',
  'Аргентина|Буэнос-Айрес, Игуасу': 'argentina',
  'Эквадор|Галапагосы, Кито, Амазония': 'ecuador',
  'Бразилия|Рио, Игуасу, Пантанал': 'brazil',
  // Polar
  'Антарктида|Антарктический полуостров': 'antarctica',
  'Исландия|Рейкьявик, Голден круг, юг': 'iceland',
  'Норвегия|Лофотены, Тромсё, фьорды': 'norway',
  'Япония|Токио, Киото, Осака': 'japan',
  'Япония — Хоккайдо|Саппоро, Ниссеко, лыжи': 'japan-hokkaido',
  'Гонконг|Виктория-Пик, Коулун, Лантау': 'hong-kong',
  'США|Нью-Йорк, ЛА, нацпарки': 'usa',
  'Новая Зеландия|Юг + Север, фьорды': 'new-zealand',
  // Новые направления 2026 (топ-18 россиян)
  'Иран|Тегеран, Исфахан, Шираз, Йезд': 'iran',
  'Иордания|Петра, Мёртвое море, Вади-Рам': 'jordan',
  'Танзания|Серенгети, Занзибар, Килиманджаро': 'tanzania',
  'Мадагаскар|Антананариву, Нуси-Бе, Цинги': 'madagascar',
  'Маврикий|Гранд Бэ, Иль-о-Серф': 'mauritius',
  'Сейшелы|Маэ, Праслин, Ла-Диг': 'seychelles',
  'Израиль|Тель-Авив, Иерусалим, Эйлат, Мёртвое море': 'israel',
  'Китай|Пекин, Шанхай, Сиань, Гуанчжоу': 'china',
  'Хайнань|Санья, Хайкоу, тропики': 'hainan',
  'Малайзия|Куала-Лумпур, Лангкави, Борнео': 'malaysia',
  'Филиппины|Палаван, Бохол, Себу, Манила': 'philippines',
  'Камбоджа|Ангкор, Пном-Пень, Сиануквиль': 'cambodia',
  'Сингапур|Сити, Сентоса, Гарденс-бай-зе-Бэй': 'singapore',
  'Непал|Катманду, Покхара, Эверест-трек': 'nepal',
  'Абхазия|Гагра, Сухум, Рица': 'abkhazia',
  'Сербия|Белград, Нови-Сад, Златибор': 'serbia',
  'Финляндия|Хельсинки, Лапландия, северное сияние': 'finland',
  'Кипр|Лимасол, Пафос, Айя-Напа': 'cyprus',
  'Камчатка|Вулканы, гейзеры, медведи': 'kamchatka',
  'Карелия|Рускеала, Кижи, Валаам, озёра': 'karelia',
};

// Russian name in different cases (acc/prep) for natural headlines.
// Default: noun is fed into templates as-is (nominative).
// Fallback: same as nominative.
const COUNTRY_CASES = {
  'australia-east': { nom: 'Восточная Австралия', acc: 'Восточную Австралию', prep: 'Восточной Австралии', vP: 'в Восточную Австралию', loc: 'в Восточной Австралии' },
  'australia-north': { nom: 'Северная Австралия', acc: 'Северную Австралию', prep: 'Северной Австралии', vP: 'на севере Австралии' , loc: 'на севере Австралии' },
  'bali': { nom: 'Бали', acc: 'Бали', prep: 'Бали', vP: 'на Бали' , loc: 'на Бали' },
  'sumatra-kalimantan': { nom: 'Суматра и Калимантан', acc: 'Суматру и Калимантан', prep: 'Суматре', vP: 'на Суматре' , loc: 'на Суматре' },
  'raja-ampat': { nom: 'Раджа-Ампат', acc: 'Раджа-Ампат', prep: 'Раджа-Ампат', vP: 'в Раджа-Ампат' , loc: 'в Раджа-Ампат' },
  'kenya': { nom: 'Кения', acc: 'Кению', prep: 'Кении', vP: 'в Кению' , loc: 'в Кении' },
  'south-africa': { nom: 'ЮАР', acc: 'ЮАР', prep: 'ЮАР', vP: 'в ЮАР' , loc: 'в ЮАР' },
  'uae': { nom: 'ОАЭ', acc: 'ОАЭ', prep: 'ОАЭ', vP: 'в ОАЭ' , loc: 'в ОАЭ' },
  'turkey': { nom: 'Турция', acc: 'Турцию', prep: 'Турции', vP: 'в Турцию' , loc: 'в Турции' },
  'egypt': { nom: 'Египет', acc: 'Египет', prep: 'Египте', vP: 'в Египет' , loc: 'в Египте' },
  'morocco': { nom: 'Марокко', acc: 'Марокко', prep: 'Марокко', vP: 'в Марокко' , loc: 'в Марокко' },
  'tanzania': { nom: 'Танзания', acc: 'Танзанию', prep: 'Танзании', vP: 'в Танзанию' , loc: 'в Танзании' },
  'uganda': { nom: 'Уганда', acc: 'Уганду', prep: 'Уганде', vP: 'в Уганду' , loc: 'в Уганде' },
  'namibia': { nom: 'Намибия', acc: 'Намибию', prep: 'Намибии', vP: 'в Намибию' , loc: 'в Намибии' },
  'botswana': { nom: 'Ботсвана', acc: 'Ботсвану', prep: 'Ботсване', vP: 'в Ботсвану' , loc: 'в Ботсване' },
  'japan': { nom: 'Япония', acc: 'Японию', prep: 'Японии', vP: 'в Японию' , loc: 'в Японии' },
  'south-korea': { nom: 'Южная Корея', acc: 'Южную Корею', prep: 'Южной Корее', vP: 'в Южную Корею' , loc: 'в Южной Корее' },
  'hainan': { nom: 'Хайнань', acc: 'Хайнань', prep: 'Хайнане', vP: 'на Хайнань' , loc: 'на Хайнане' },
  'hong-kong': { nom: 'Гонконг', acc: 'Гонконг', prep: 'Гонконге', vP: 'в Гонконг' , loc: 'в Гонконге' },
  'vietnam': { nom: 'Вьетнам', acc: 'Вьетнам', prep: 'Вьетнаме', vP: 'во Вьетнам' , loc: 'во Вьетнаме' },
  'thailand': { nom: 'Таиланд', acc: 'Таиланд', prep: 'Таиланде', vP: 'в Таиланд' , loc: 'в Таиланде' },
  'cambodia': { nom: 'Камбоджа', acc: 'Камбоджу', prep: 'Камбодже', vP: 'в Камбоджу' , loc: 'в Камбодже' },
  'india': { nom: 'Индия', acc: 'Индию', prep: 'Индии', vP: 'в Индию' , loc: 'в Индии' },
  'sri-lanka': { nom: 'Шри-Ланка', acc: 'Шри-Ланку', prep: 'Шри-Ланке', vP: 'на Шри-Ланку' , loc: 'на Шри-Ланке' },
  'maldives': { nom: 'Мальдивы', acc: 'Мальдивы', prep: 'Мальдивах', vP: 'на Мальдивы' , loc: 'на Мальдивах' },
  'georgia': { nom: 'Грузия', acc: 'Грузию', prep: 'Грузии', vP: 'в Грузию' , loc: 'в Грузии' },
  'uzbekistan': { nom: 'Узбекистан', acc: 'Узбекистан', prep: 'Узбекистане', vP: 'в Узбекистан' , loc: 'в Узбекистане' },
  'armenia': { nom: 'Армения', acc: 'Армению', prep: 'Армении', vP: 'в Армению' , loc: 'в Армении' },
  'kazakhstan': { nom: 'Казахстан', acc: 'Казахстан', prep: 'Казахстане', vP: 'в Казахстан' , loc: 'в Казахстане' },
  'kyrgyzstan': { nom: 'Киргизия', acc: 'Киргизию', prep: 'Киргизии', vP: 'в Киргизию' , loc: 'в Киргизии' },
  'brazil': { nom: 'Бразилия', acc: 'Бразилию', prep: 'Бразилии', vP: 'в Бразилию' , loc: 'в Бразилии' },
  'peru': { nom: 'Перу', acc: 'Перу', prep: 'Перу', vP: 'в Перу' , loc: 'в Перу' },
  'bolivia': { nom: 'Боливия', acc: 'Боливию', prep: 'Боливии', vP: 'в Боливию' , loc: 'в Боливии' },
  'chile': { nom: 'Чили', acc: 'Чили', prep: 'Чили', vP: 'в Чили' , loc: 'в Чили' },
  'argentina': { nom: 'Аргентина', acc: 'Аргентину', prep: 'Аргентине', vP: 'в Аргентину' , loc: 'в Аргентине' },
  'ecuador': { nom: 'Эквадор', acc: 'Эквадор', prep: 'Эквадоре', vP: 'в Эквадор' , loc: 'в Эквадоре' },
  'cuba': { nom: 'Куба', acc: 'Кубу', prep: 'Кубе', vP: 'на Кубу' , loc: 'на Кубе' },
  'dominican-republic': { nom: 'Доминикана', acc: 'Доминикану', prep: 'Доминикане', vP: 'в Доминикану' , loc: 'в Доминикане' },
  'mexico': { nom: 'Мексика', acc: 'Мексику', prep: 'Мексике', vP: 'в Мексику' , loc: 'в Мексике' },
  'usa': { nom: 'США', acc: 'США', prep: 'США', vP: 'в США' , loc: 'в США' },
  'new-zealand': { nom: 'Новая Зеландия', acc: 'Новую Зеландию', prep: 'Новой Зеландии', vP: 'в Новую Зеландию' , loc: 'в Новой Зеландии' },
  'antarctica': { nom: 'Антарктида', acc: 'Антарктиду', prep: 'Антарктиде', vP: 'в Антарктиду' , loc: 'в Антарктиде' },
  'iceland': { nom: 'Исландия', acc: 'Исландию', prep: 'Исландии', vP: 'в Исландию' , loc: 'в Исландии' },
  'norway': { nom: 'Норвегия', acc: 'Норвегию', prep: 'Норвегии', vP: 'в Норвегию' , loc: 'в Норвегии' },
  'japan-hokkaido': { nom: 'Хоккайдо', acc: 'Хоккайдо', prep: 'Хоккайдо', vP: 'на Хоккайдо' , loc: 'на Хоккайдо' },
  'thailand-north': { nom: 'Север Таиланда', acc: 'Север Таиланда', prep: 'Севере Таиланда', vP: 'на север Таиланда' , loc: 'на севере Таиланда' },
  // Updated/new keys
  'india-goa': { nom: 'Гоа (Индия)', acc: 'Гоа', prep: 'Гоа', vP: 'на Гоа' , loc: 'на Гоа' },
  'tajikistan': { nom: 'Таджикистан', acc: 'Таджикистан', prep: 'Таджикистане', vP: 'в Таджикистан' , loc: 'в Таджикистане' },
  'switzerland': { nom: 'Швейцария', acc: 'Швейцарию', prep: 'Швейцарии', vP: 'в Швейцарию' , loc: 'в Швейцарии' },
  'italy-north': { nom: 'Северная Италия', acc: 'Северную Италию', prep: 'Северной Италии', vP: 'на север Италии' , loc: 'на севере Италии' },
  'italy-south': { nom: 'Италия (центр и юг)', acc: 'Италию', prep: 'Италии', vP: 'в Италию' , loc: 'в Италии' },
  'spain': { nom: 'Испания', acc: 'Испанию', prep: 'Испании', vP: 'в Испанию' , loc: 'в Испании' },
  'greece': { nom: 'Греция', acc: 'Грецию', prep: 'Греции', vP: 'в Грецию' , loc: 'в Греции' },
  'croatia': { nom: 'Хорватия', acc: 'Хорватию', prep: 'Хорватии', vP: 'в Хорватию' , loc: 'в Хорватии' },
  'canada-rockies': { nom: 'Канадские Скалистые горы', acc: 'Канадские Скалистые горы', prep: 'канадских Скалистых горах', vP: 'в Канадские Скалистые горы' , loc: 'в Канадских Скалистых горах' },
  'canada-east': { nom: 'Восточная Канада', acc: 'Восточную Канаду', prep: 'Восточной Канаде', vP: 'в Восточную Канаду' , loc: 'в Восточной Канаде' },
  'guatemala-belize': { nom: 'Гватемала и Белиз', acc: 'Гватемалу и Белиз', prep: 'Гватемале и Белизе', vP: 'в Гватемалу и Белиз' , loc: 'в Гватемале и Белизе' },
  'costa-rica-panama': { nom: 'Коста-Рика и Панама', acc: 'Коста-Рику и Панаму', prep: 'Коста-Рике и Панаме', vP: 'в Коста-Рику и Панаму' , loc: 'в Коста-Рике и Панаме' },
  'chile-patagonia': { nom: 'Чилийская Патагония', acc: 'Чилийскую Патагонию', prep: 'чилийской Патагонии', vP: 'в Чилийскую Патагонию' , loc: 'в Чилийской Патагонии' },
  'chile-fjords': { nom: 'Чилийские фьорды', acc: 'Чилийские фьорды', prep: 'чилийских фьордах', vP: 'в Чилийские фьорды' , loc: 'в Чилийских фьордах' },
  // Новые направления 2026
  'iran': { nom: 'Иран', acc: 'Иран', prep: 'Иране', vP: 'в Иран', loc: 'в Иране' },
  'jordan': { nom: 'Иордания', acc: 'Иорданию', prep: 'Иордании', vP: 'в Иорданию', loc: 'в Иордании' },
  'tanzania': { nom: 'Танзания', acc: 'Танзанию', prep: 'Танзании', vP: 'в Танзанию', loc: 'в Танзании' },
  'madagascar': { nom: 'Мадагаскар', acc: 'Мадагаскар', prep: 'Мадагаскаре', vP: 'на Мадагаскар', loc: 'на Мадагаскаре' },
  'mauritius': { nom: 'Маврикий', acc: 'Маврикий', prep: 'Маврикии', vP: 'на Маврикий', loc: 'на Маврикии' },
  'seychelles': { nom: 'Сейшелы', acc: 'Сейшелы', prep: 'Сейшелах', vP: 'на Сейшелы', loc: 'на Сейшелах' },
  'israel': { nom: 'Израиль', acc: 'Израиль', prep: 'Израиле', vP: 'в Израиль', loc: 'в Израиле' },
  'china': { nom: 'Китай', acc: 'Китай', prep: 'Китае', vP: 'в Китай', loc: 'в Китае' },
  'hainan': { nom: 'Хайнань', acc: 'Хайнань', prep: 'Хайнане', vP: 'на Хайнань', loc: 'на Хайнане' },
  'malaysia': { nom: 'Малайзия', acc: 'Малайзию', prep: 'Малайзии', vP: 'в Малайзию', loc: 'в Малайзии' },
  'philippines': { nom: 'Филиппины', acc: 'Филиппины', prep: 'Филиппинах', vP: 'на Филиппины', loc: 'на Филиппинах' },
  'cambodia': { nom: 'Камбоджа', acc: 'Камбоджу', prep: 'Камбодже', vP: 'в Камбоджу', loc: 'в Камбодже' },
  'singapore': { nom: 'Сингапур', acc: 'Сингапур', prep: 'Сингапуре', vP: 'в Сингапур', loc: 'в Сингапуре' },
  'nepal': { nom: 'Непал', acc: 'Непал', prep: 'Непале', vP: 'в Непал', loc: 'в Непале' },
  'abkhazia': { nom: 'Абхазия', acc: 'Абхазию', prep: 'Абхазии', vP: 'в Абхазию', loc: 'в Абхазии' },
  'serbia': { nom: 'Сербия', acc: 'Сербию', prep: 'Сербии', vP: 'в Сербию', loc: 'в Сербии' },
  'finland': { nom: 'Финляндия', acc: 'Финляндию', prep: 'Финляндии', vP: 'в Финляндию', loc: 'в Финляндии' },
  'cyprus': { nom: 'Кипр', acc: 'Кипр', prep: 'Кипре', vP: 'на Кипр', loc: 'на Кипре' },
  'kamchatka': { nom: 'Камчатка', acc: 'Камчатку', prep: 'Камчатке', vP: 'на Камчатку', loc: 'на Камчатке' },
  'karelia': { nom: 'Карелия', acc: 'Карелию', prep: 'Карелии', vP: 'в Карелию', loc: 'в Карелии' },
};

// Map slug → array of related blog post slugs (which already exist in content/blog/).
// Used by /visa/<slug>/ and /trips/<month>/<slug>/ to surface long-form content.
// Add a new entry whenever you publish a new post for an existing direction.
const RELATED_POSTS = {
  'abkhazia': [
    { slug: 'abkhazia-2026', title: 'Абхазия 2026: стоит ли ехать, цены, как добраться', kind: 'guide' },
  ],
  'japan': [
    { slug: 'japan-guide-2026', title: 'Япония 2026: гайд без воды', kind: 'guide' },
    { slug: 'japan-visa-2026', title: 'Виза в Японию для россиян 2026', kind: 'visa' },
    { slug: 'japan-golden-week-2026', title: 'Золотая неделя в Японии 2026', kind: 'season' },
  ],
  'antarctica': [
    { slug: 'antarctica-cruise-2026', title: 'Круиз в Антарктиду 2026: цена, маршрут, мой опыт', kind: 'guide' },
  ],
  'bali': [
    { slug: 'bali-guide-2026', title: 'Бали 2026: виза, цены, районы', kind: 'guide' },
  ],
  'hainan': [
    { slug: 'hainan-guide-2026', title: 'Хайнань 2026: безвиз, Alipay, VPN, цены', kind: 'guide' },
  ],
  'china': [
    { slug: 'china-guide-2026', title: 'Китай 2026 россиянам: безвиз 30 дней, цены, маршрут', kind: 'guide' },
    { slug: 'hainan-guide-2026', title: 'Хайнань 2026 — тропический Китай', kind: 'guide' },
    { slug: 'esim-zagranicey-2026', title: 'Связь за границей: обход файрвола Китая', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей: Alipay для Китая', kind: 'guide' },
  ],
  'uae': [
    { slug: 'uae-guide-2026', title: 'Дубай 2026 для россиян: безвиз 90 дней, цены, сезон', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'georgia': [
    { slug: 'georgia-guide-2026', title: 'Грузия 2026: виза 365 дней, страховка, цены, маршрут', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить в Грузии: карты РФ не работают', kind: 'guide' },
    { slug: 'turkey-guide-2026', title: 'Турция 2026 — соседнее безвизовое направление', kind: 'guide' },
  ],
  'turkey': [
    { slug: 'turkey-guide-2026', title: 'Турция 2026 россиянам: безвиз, цены, маршрут', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
    { slug: 'esim-zagranicey-2026', title: 'Связь за границей 2026: eSIM и SIM', kind: 'guide' },
  ],
  'uganda': [
    { slug: 'uganda-safari-2026', title: 'Уганда 2026: гориллы Бвинди и сафари', kind: 'guide' },
  ],
  'ecuador': [
    { slug: 'galapagos-2026', title: 'Галапагосы 2026: что я видел и сколько стоит', kind: 'guide' },
  ],
  'new-zealand': [
    { slug: 'aurora-new-zealand-2026', title: 'Южное сияние в Новой Зеландии 2026', kind: 'guide' },
    { slug: 'milford-sound-2026', title: 'Милфорд-Саунд 2026: каяк и круиз', kind: 'guide' },
  ],
  'bolivia': [
    { slug: 'bolivia-guide-2026', title: 'Боливия 2026: тур по Уюни за $130, безвиз 90 дней', kind: 'guide' },
    { slug: 'peru-guide-2026', title: 'Перу 2026 — соседний маршрут (Мачу-Пикчу)', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'chile': [
    { slug: 'chile-guide-2026', title: 'Чили 2026: Патагония и Атакама за $1500, безвиз', kind: 'guide' },
    { slug: 'peru-guide-2026', title: 'Перу 2026 — соседний маршрут (Мачу-Пикчу)', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'peru': [
    { slug: 'peru-guide-2026', title: 'Перу 2026 россиянам: 12 дней за $1200, Мачу-Пикчу', kind: 'guide' },
    { slug: 'bolivia-guide-2026', title: 'Боливия 2026 — соседний маршрут (Уюни)', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'vietnam': [
    { slug: 'vietnam-guide-2026', title: 'Вьетнам 2026: виза, Нячанг, Фукуок, цены', kind: 'guide' },
    { slug: 'nyachang-fukuok-2026', title: 'Нячанг или Фукуок 2026: где лучше отдыхать', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'thailand': [
    { slug: 'thailand-guide-2026', title: 'Таиланд 2026: виза, Пхукет, Самуи, цены', kind: 'guide' },
    { slug: 'phuket-samui-2026', title: 'Пхукет или Самуи 2026: где лучше отдыхать', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'egypt': [
    { slug: 'egypt-guide-2026', title: 'Египет 2026: виза, Хургада, Шарм, цены', kind: 'guide' },
    { slug: 'hurghada-sharm-2026', title: 'Хургада или Шарм 2026: где лучше отдыхать', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'kamchatka': [
    { slug: 'kamchatka-guide-2026', title: 'Камчатка 2026: что посмотреть, когда ехать, цены', kind: 'guide' },
  ],
  'karelia': [
    { slug: 'kareliya-guide-2026', title: 'Карелия 2026: что посмотреть, как добраться, цены', kind: 'guide' },
    { slug: 'gornyy-park-ruskeala-2026', title: 'Горный парк Рускеала 2026: билеты, как добраться', kind: 'guide' },
    { slug: 'ostrov-kizhi-2026', title: 'Остров Кижи 2026: метеор, билеты, что посмотреть', kind: 'guide' },
    { slug: 'ostrov-valaam-2026', title: 'Остров Валаам 2026: как добраться, монастырь', kind: 'guide' },
  ],
  'morocco': [
    { slug: 'morocco-guide-2026', title: 'Марокко 2026: безвиз 90 дней, маршрут, цены', kind: 'guide' },
  ],
  'kenya': [
    { slug: 'kenya-guide-2026', title: 'Кения 2026: сафари, виза eTA, бюджет', kind: 'guide' },
  ],
};

// EU/Шенген hub — связываем все европейские направления с шенгенским гайдом
const SCHENGEN_POSTS = [
  { slug: 'schengen-visa-2026', title: 'Шенгенская виза 2026: куда дают', kind: 'visa' },
  { slug: 'ees-shengen-2026', title: 'EES в Шенгене 2026: биометрия для россиян', kind: 'visa' },
];
const EUROPE_SLUGS = ['switzerland', 'italy-north', 'italy-south', 'spain', 'greece', 'croatia'];
for (const slug of EUROPE_SLUGS) {
  RELATED_POSTS[slug] = (RELATED_POSTS[slug] || []).concat(SCHENGEN_POSTS);
}

// Decorative emoji + gradient per slug, для programmatic page heroes
// (пока нет реальных фото на каждое направление — позже заменяем на Image src).
const DEST_VISUALS = {
  'antarctica':       { emoji: '🐧', g1: '#dbeafe', g2: '#bfdbfe' },
  'australia-east':   { emoji: '🦘', g1: '#fef3c7', g2: '#fde68a' },
  'australia-north':  { emoji: '🐊', g1: '#fef3c7', g2: '#fcd34d' },
  'bali':             { emoji: '🌴', g1: '#d1fae5', g2: '#a7f3d0' },
  'brazil':           { emoji: '🦜', g1: '#fef3c7', g2: '#fde68a' },
  'cambodia':         { emoji: '🛕', g1: '#fed7aa', g2: '#fdba74' },
  'canada-east':      { emoji: '🍁', g1: '#fee2e2', g2: '#fecaca' },
  'canada-rockies':   { emoji: '🏔️', g1: '#dbeafe', g2: '#bfdbfe' },
  'chile':            { emoji: '🏜️', g1: '#fde68a', g2: '#fbbf24' },
  'chile-fjords':     { emoji: '🌊', g1: '#cffafe', g2: '#a5f3fc' },
  'chile-patagonia':  { emoji: '🏔️', g1: '#dbeafe', g2: '#cbd5e1' },
  'costa-rica-panama':{ emoji: '🦥', g1: '#dcfce7', g2: '#bbf7d0' },
  'croatia':          { emoji: '🏖️', g1: '#cffafe', g2: '#a5f3fc' },
  'cuba':             { emoji: '🚗', g1: '#fed7aa', g2: '#fdba74' },
  'dominican-republic':{emoji: '🏝️', g1: '#cffafe', g2: '#bbf7d0' },
  'ecuador':          { emoji: '🐢', g1: '#dcfce7', g2: '#bbf7d0' },
  'egypt':            { emoji: '🐪', g1: '#fef3c7', g2: '#fde68a' },
  'georgia':          { emoji: '🍷', g1: '#fee2e2', g2: '#fecaca' },
  'greece':           { emoji: '🏛️', g1: '#dbeafe', g2: '#bfdbfe' },
  'guatemala-belize': { emoji: '🌋', g1: '#fed7aa', g2: '#fdba74' },
  'hainan':           { emoji: '🥥', g1: '#cffafe', g2: '#a7f3d0' },
  'hong-kong':        { emoji: '🌃', g1: '#fce7f3', g2: '#fbcfe8' },
  'iceland':          { emoji: '🌋', g1: '#dbeafe', g2: '#bfdbfe' },
  'india-goa':        { emoji: '🍛', g1: '#fed7aa', g2: '#fdba74' },
  'india':            { emoji: '🕉️', g1: '#fed7aa', g2: '#fdba74' },
  'italy-north':      { emoji: '⛰️', g1: '#dbeafe', g2: '#cbd5e1' },
  'italy-south':      { emoji: '🍕', g1: '#fee2e2', g2: '#fecaca' },
  'japan':            { emoji: '🍣', g1: '#fce7f3', g2: '#fbcfe8' },
  'japan-hokkaido':   { emoji: '❄️', g1: '#dbeafe', g2: '#e0e7ff' },
  'kazakhstan':       { emoji: '🏔️', g1: '#dbeafe', g2: '#cbd5e1' },
  'kenya':            { emoji: '🦁', g1: '#fef3c7', g2: '#fde68a' },
  'kyrgyzstan':       { emoji: '🐎', g1: '#dbeafe', g2: '#cbd5e1' },
  'maldives':         { emoji: '🐠', g1: '#cffafe', g2: '#a5f3fc' },
  'mexico':           { emoji: '🌶️', g1: '#fed7aa', g2: '#fdba74' },
  'morocco':          { emoji: '🕌', g1: '#fed7aa', g2: '#fdba74' },
  'new-zealand':      { emoji: '🥝', g1: '#dcfce7', g2: '#bbf7d0' },
  'norway':           { emoji: '🌌', g1: '#dbeafe', g2: '#e0e7ff' },
  'peru':             { emoji: '🦙', g1: '#fed7aa', g2: '#fdba74' },
  'raja-ampat':       { emoji: '🐠', g1: '#cffafe', g2: '#a5f3fc' },
  'south-africa':     { emoji: '🦓', g1: '#fef3c7', g2: '#fde68a' },
  'south-korea':      { emoji: '🏯', g1: '#fce7f3', g2: '#fbcfe8' },
  'spain':            { emoji: '💃', g1: '#fee2e2', g2: '#fecaca' },
  'sri-lanka':        { emoji: '🐘', g1: '#dcfce7', g2: '#bbf7d0' },
  'sumatra-kalimantan':{emoji: '🦧', g1: '#dcfce7', g2: '#bbf7d0' },
  'switzerland':      { emoji: '🏔️', g1: '#dbeafe', g2: '#e0e7ff' },
  'tajikistan':       { emoji: '🏔️', g1: '#dbeafe', g2: '#cbd5e1' },
  'thailand':         { emoji: '🏝️', g1: '#cffafe', g2: '#a7f3d0' },
  'thailand-north':   { emoji: '🐘', g1: '#dcfce7', g2: '#bbf7d0' },
  'turkey':           { emoji: '🎈', g1: '#fed7aa', g2: '#fdba74' },
  'uae':              { emoji: '🏙️', g1: '#fef3c7', g2: '#fde68a' },
  'uganda':           { emoji: '🦍', g1: '#dcfce7', g2: '#bbf7d0' },
  'usa':              { emoji: '🗽', g1: '#dbeafe', g2: '#bfdbfe' },
  'uzbekistan':       { emoji: '🕌', g1: '#fed7aa', g2: '#fdba74' },
  'vietnam':          { emoji: '🍜', g1: '#dcfce7', g2: '#bbf7d0' },
  // Новые направления 2026
  'iran':             { emoji: '🕌', g1: '#fef3c7', g2: '#fde68a' },
  'jordan':           { emoji: '🏛️', g1: '#fde68a', g2: '#fbbf24' },
  'tanzania':         { emoji: '🦒', g1: '#fde68a', g2: '#facc15' },
  'madagascar':       { emoji: '🌳', g1: '#dcfce7', g2: '#86efac' },
  'mauritius':        { emoji: '🐢', g1: '#cffafe', g2: '#67e8f9' },
  'seychelles':       { emoji: '🏖️', g1: '#cffafe', g2: '#a5f3fc' },
  'israel':           { emoji: '🕯️', g1: '#dbeafe', g2: '#93c5fd' },
  'china':            { emoji: '🏯', g1: '#fee2e2', g2: '#fca5a5' },
  'hainan':           { emoji: '🌴', g1: '#cffafe', g2: '#67e8f9' },
  'malaysia':         { emoji: '🌺', g1: '#fce7f3', g2: '#f9a8d4' },
  'philippines':      { emoji: '🏝️', g1: '#cffafe', g2: '#a5f3fc' },
  'cambodia':         { emoji: '🛕', g1: '#fed7aa', g2: '#fdba74' },
  'singapore':        { emoji: '🏙️', g1: '#dbeafe', g2: '#bfdbfe' },
  'nepal':            { emoji: '🏔️', g1: '#e0e7ff', g2: '#c7d2fe' },
  'abkhazia':         { emoji: '🌊', g1: '#cffafe', g2: '#67e8f9' },
  'serbia':           { emoji: '🏛️', g1: '#fef3c7', g2: '#fde68a' },
  'finland':          { emoji: '🌌', g1: '#e0e7ff', g2: '#c7d2fe' },
  'cyprus':           { emoji: '🏖️', g1: '#fef3c7', g2: '#fde68a' },
  'kamchatka':        { emoji: '🌋', g1: '#fee2e2', g2: '#fecaca' },
  'karelia':          { emoji: '🌲', g1: '#d1fae5', g2: '#a7f3d0' },
};

function findPrice(direction) {
  // Точный матч по каноническому IATA из regionMeta — снимает коллизии нечёткого матча
  // (Хоккайдо→Токио, Канада-Восток→Калгари, Чили→Патагония, Австралия-Север→Сидней).
  const metaIata = regionMeta[direction.sub]?.iata;
  if (metaIata) {
    const exact = PRICES.find((p) => p.iata === metaIata);
    if (exact) return exact;
  }
  // Fallback (страны, где PRICES использует другой аэропорт, чем regionMeta): нечёткий матч по имени.
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-zа-я0-9]/gi, '');
  const dn = norm(direction.region) + norm(direction.sub);
  return PRICES.find((p) => {
    const pn = norm(p.name);
    return dn.includes(norm(p.name.split(' ')[0])) || pn.includes(norm(direction.region));
  });
}

let groupLabel = '';
const enriched = [];
for (const r of regions) {
  if (r.group) {
    groupLabel = r.group.replace(/^[^\s]+\s/, '');
    continue;
  }
  const key = `${r.region}|${r.sub}`;
  const slug = SLUG_OVERRIDES[key] || slugify(`${r.region}-${r.sub.split(',')[0]}`);
  const cases = COUNTRY_CASES[slug] || { nom: r.region, acc: r.region, prep: r.region, vP: r.region };
  const price = findPrice(r);
  enriched.push({
    slug,
    region: r.region,
    sub: r.sub,
    visa: r.visa,
    budget: r.budget,
    r: r.r,
    t: r.t,
    group: groupLabel,
    cases,
    price: price || null,
    iata: regionMeta[r.sub]?.iata || price?.iata || null,   // канон. город для Aviasales deep-link
    relatedPosts: RELATED_POSTS[slug] || [],
    visual: DEST_VISUALS[slug] || { emoji: '🌍', g1: '#fef3c7', g2: '#fde68a' },
  });
}

export const DIRECTIONS = enriched;
export function bySlug(slug) { return DIRECTIONS.find(d => d.slug === slug); }

export const MONTHS = [
  { slug: 'january',   nom: 'январь',   prep: 'январе',   gen: 'января'   },
  { slug: 'february',  nom: 'февраль',  prep: 'феврале',  gen: 'февраля'  },
  { slug: 'march',     nom: 'март',     prep: 'марте',    gen: 'марта'    },
  { slug: 'april',     nom: 'апрель',   prep: 'апреле',   gen: 'апреля'   },
  { slug: 'may',       nom: 'май',      prep: 'мае',      gen: 'мая'      },
  { slug: 'june',      nom: 'июнь',     prep: 'июне',     gen: 'июня'     },
  { slug: 'july',      nom: 'июль',     prep: 'июле',     gen: 'июля'     },
  { slug: 'august',    nom: 'август',   prep: 'августе',  gen: 'августа'  },
  { slug: 'september', nom: 'сентябрь', prep: 'сентябре', gen: 'сентября' },
  { slug: 'october',   nom: 'октябрь',  prep: 'октябре',  gen: 'октября'  },
  { slug: 'november',  nom: 'ноябрь',   prep: 'ноябре',   gen: 'ноября'   },
  { slug: 'december',  nom: 'декабрь',  prep: 'декабре',  gen: 'декабря'  },
];
