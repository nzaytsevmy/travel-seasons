// Универсальный датасет интерактивного чек-листа сборов в поездку.
// Оси фильтрации выведены из реального спроса (Wordstat): тип поездки × длительность ×
// кто (+возраст ребёнка) × транспорт. Компонент PackingChecklist.astro фильтрует по ним.
//
// Поле item:
//   id        — стабильный ключ (для localStorage и schema)
//   label     — текст пункта (для читателя; без внутренних идентификаторов)
//   cat       — категория (см. CATEGORIES)
//   trip      — [] = для всех типов; иначе массив id типов ('sea'|'city'|'winter')
//   who       — [] = для всех; 'woman' = только при «Женщина»; 'kids' = только при «С ребёнком»
//   kid       — [] = для всех возрастов; иначе ограничение по возрасту ребёнка
//   minNights — показывать, если длительность ≥ N ночей
//   liquid    — жидкость/гель: при транспорте «Самолёт» получает бейдж «≤100 мл»
//   transport — [] = для любого; иначе массив ('plane'|'train'|'car')
//   note      — короткое пояснение (опц.)
//   product   — товарный слот: null. ⚠️ Реальные партнёрские ссылки (Ozon/WB/Я.Маркет)
//               подставлять ТОЛЬКО когда получены (38-ФЗ: erid). Не выдумывать.

export const TRIP_TYPES = [
  { id: 'sea',    label: 'Море' },
  { id: 'city',   label: 'Город' },
  { id: 'winter', label: 'Зима' },
];

export const DURATIONS = [
  { id: 'short', label: '1–3 дня',     nights: 3 },
  { id: 'week',  label: 'Неделя',       nights: 7 },
  { id: 'long',  label: '10–14 дней',   nights: 14 },
  { id: 'month', label: 'Месяц+',       nights: 30 },
];

export const WHO = [
  { id: 'adult', label: 'Взрослый' },
  { id: 'woman', label: 'Женщина' },
  { id: 'kids',  label: 'С ребёнком' },
];

// Под-фильтр возраста — активен только при who = kids.
export const KID_AGES = [
  { id: 'baby',      label: '0–1 год' },
  { id: 'toddler',   label: '1–3 года' },
  { id: 'preschool', label: '3–7 лет' },
  { id: 'school',    label: '7+ лет' },
];

export const TRANSPORT = [
  { id: 'plane', label: 'Самолёт' },
  { id: 'train', label: 'Поезд' },
  { id: 'car',   label: 'Машина' },
];

export const CATEGORIES = [
  { id: 'docs',         label: 'Документы и деньги' },
  { id: 'clothes',      label: 'Одежда и обувь' },
  { id: 'hygiene',      label: 'Гигиена и косметика' },
  { id: 'meds',         label: 'Аптечка' },
  { id: 'tech',         label: 'Техника и гаджеты' },
  { id: 'extra',        label: 'Полезные мелочи' },
  { id: 'predeparture', label: 'Перед выходом из дома' },
];

// Пресеты для страниц: фиксируют тип поездки (на пилларе/стране — залочен).
export const PRESETS = {
  sea:    { trip: 'sea',    title: 'Чек-лист на море' },
  city:   { trip: 'city',   title: 'Чек-лист в город' },
  winter: { trip: 'winter', title: 'Чек-лист зимой' },
  any:    { trip: null,     title: 'Чек-лист в поездку' },
};

const F = (id, label, cat, opts = {}) => ({
  id, label, cat,
  trip: opts.trip || [],
  who: opts.who || [],
  kid: opts.kid || [],
  minNights: opts.minNights || 0,
  liquid: !!opts.liquid,
  transport: opts.transport || [],
  note: opts.note || '',
  product: null,
});

export const ITEMS = [
  // ─── Документы и деньги ───
  F('passport-int', 'Загранпаспорт', 'docs', { note: 'срок действия 6+ месяцев на дату въезда' }),
  F('passport-ru', 'Внутренний паспорт', 'docs', { note: 'нужен при потере загранпаспорта для возврата' }),
  F('tickets', 'Билеты и посадочные', 'docs', { note: 'распечатать или сохранить в телефон офлайн' }),
  F('hotel', 'Бронь отеля или жилья', 'docs', { note: 'распечатка пригодится на границе и при заселении' }),
  F('visa', 'Виза или разрешение на въезд', 'docs', { note: 'если требуется — проверить заранее на сайте консульства' }),
  F('insurance', 'Медицинская страховка', 'docs', { note: 'за границей часто обязательна; для визы — нужна' }),
  F('oms', 'Полис ОМС', 'docs', { note: 'для поездок по России' }),
  F('cards', 'Банковские карты', 'docs', { note: 'проверить, работают ли в стране назначения' }),
  F('cash', 'Наличные', 'docs', { note: '$200–300 или в местной валюте на непредвиденное' }),
  F('license', 'Водительские права', 'docs', { note: 'нац. + международные, если планируете за рулём' }),
  F('doc-copies', 'Копии документов', 'docs', { note: 'фото паспорта и броней в облаке и в телефоне' }),

  // ─── Одежда и обувь (база) ───
  F('underwear', 'Нижнее бельё', 'clothes', { note: 'по числу дней + запас' }),
  F('socks', 'Носки', 'clothes'),
  F('tshirts', 'Футболки', 'clothes'),
  F('comfy-shoes', 'Удобная обувь', 'clothes', { note: 'разношенная, чтобы не натереть' }),
  F('sleepwear', 'Одежда для сна', 'clothes'),
  F('warm-layer', 'Кофта или толстовка на вечер', 'clothes', { note: 'вечера бывают прохладными даже летом' }),
  // Море
  F('swimwear', 'Купальник или плавки ×2', 'clothes', { trip: ['sea'], note: 'один сохнет — во втором купаетесь' }),
  F('beach-shoes', 'Пляжная обувь, сланцы', 'clothes', { trip: ['sea'] }),
  F('aqua-shoes', 'Аквашузы', 'clothes', { trip: ['sea'], note: 'для галечного пляжа и камней' }),
  F('sun-hat', 'Головной убор от солнца', 'clothes', { trip: ['sea'], note: 'панама, кепка или шляпа с полями' }),
  F('sunglasses', 'Солнцезащитные очки', 'clothes', { trip: ['sea'], note: 'с UV-фильтром' }),
  F('beach-cover', 'Лёгкая накидка или рубашка', 'clothes', { trip: ['sea'], note: 'прикрыться в самый солнечный час' }),
  // Город
  F('smart-casual', 'Комплект «на выход»', 'clothes', { trip: ['city'], note: 'для ресторанов и культурной программы' }),
  F('walk-shoes', 'Обувь для долгой ходьбы', 'clothes', { trip: ['city'] }),
  // Зима
  F('thermal', 'Термобельё', 'clothes', { trip: ['winter'] }),
  F('winter-coat', 'Тёплая куртка или пуховик', 'clothes', { trip: ['winter'] }),
  F('hat-scarf-gloves', 'Шапка, шарф, перчатки', 'clothes', { trip: ['winter'] }),
  F('warm-socks', 'Тёплые носки', 'clothes', { trip: ['winter'] }),
  F('waterproof-boots', 'Непромокаемая обувь', 'clothes', { trip: ['winter'] }),
  // Женщина
  F('dresses', 'Платья и юбки', 'clothes', { who: ['woman'] }),
  // Дети
  F('kids-clothes', 'Детская одежда по погоде', 'clothes', { who: ['kids'], note: 'с запасом — дети пачкаются' }),
  F('kids-hat', 'Детский головной убор', 'clothes', { who: ['kids'], trip: ['sea'] }),

  // ─── Гигиена и косметика ───
  F('toothbrush', 'Зубная щётка и паста', 'hygiene', { liquid: true }),
  F('deodorant', 'Дезодорант', 'hygiene', { note: 'твёрдый — в ручную кладь, аэрозоль — в багаж' }),
  F('comb', 'Расчёска', 'hygiene'),
  F('wipes', 'Влажные и сухие салфетки', 'hygiene'),
  F('hand-sanitizer', 'Антисептик для рук', 'hygiene', { liquid: true }),
  F('lip-balm', 'Гигиеническая помада', 'hygiene', { trip: ['sea', 'winter'] }),
  F('face-cream', 'Увлажняющий крем', 'hygiene', { liquid: true }),
  F('shampoo', 'Шампунь и гель для душа', 'hygiene', { liquid: true, note: 'в мини-флаконах или купить на месте' }),
  // Море
  F('sunscreen', 'Солнцезащитный крем SPF50', 'hygiene', { trip: ['sea'], liquid: true, note: 'наносить каждые 2 часа' }),
  F('after-sun', 'Средство после загара', 'hygiene', { trip: ['sea'], liquid: true, note: 'с пантенолом или алоэ' }),
  // Линзы
  F('lens-care', 'Раствор и контейнер для линз', 'hygiene', { liquid: true, note: 'или однодневные линзы на все дни; запас в ручную кладь' }),
  // Женщина
  F('makeup', 'Декоративная косметика', 'hygiene', { who: ['woman'], note: '+ средство для снятия макияжа' }),
  F('hygiene-products', 'Средства личной гигиены', 'hygiene', { who: ['woman'] }),
  // Дети
  F('diapers', 'Подгузники', 'hygiene', { who: ['kids'], kid: ['baby', 'toddler'] }),
  F('baby-cream', 'Детский крем и присыпка', 'hygiene', { who: ['kids'], kid: ['baby', 'toddler'], liquid: true }),

  // ─── Аптечка (YMYL: категории, не бренды; состав — с врачом) ───
  F('meds-pain', 'Обезболивающее и жаропонижающее', 'meds', { note: 'привычное вам — состав уточнить у врача' }),
  F('meds-allergy', 'От аллергии (антигистаминное)', 'meds'),
  F('meds-stomach', 'От расстройства ЖКТ и отравления', 'meds', { trip: ['sea'] }),
  F('meds-antiseptic', 'Антисептик, пластыри, бинт', 'meds'),
  F('meds-motion', 'От укачивания', 'meds', { transport: ['car', 'train', 'plane'] }),
  F('meds-bites', 'От укусов насекомых', 'meds', { trip: ['sea'] }),
  F('meds-personal', 'Индивидуальные лекарства', 'meds', { note: 'с запасом + назначение врача; в ручную кладь' }),
  F('meds-kids', 'Детская аптечка отдельно', 'meds', { who: ['kids'], note: 'состав — с педиатром' }),

  // ─── Техника и гаджеты ───
  F('phone-charger', 'Смартфон и зарядка', 'tech'),
  F('powerbank', 'Повербанк', 'tech', { transport: ['plane'], note: 'только в ручную кладь' }),
  F('powerbank-2', 'Повербанк', 'tech', { transport: ['train', 'car'] }),
  F('headphones', 'Наушники', 'tech'),
  F('plug-adapter', 'Переходник для розеток', 'tech', { note: 'если в стране другой стандарт' }),
  F('chargers-all', 'Зарядки для всех устройств', 'tech', { note: 'камера, часы, наушники, повербанк' }),
  F('esim', 'eSIM или местная симка', 'tech', { note: 'вместо дорогого роуминга' }),
  F('camera', 'Фотоаппарат и карты памяти', 'tech', { minNights: 7 }),
  F('e-reader', 'Электронная книга или планшет', 'tech', { minNights: 7 }),

  // ─── Полезные мелочи ───
  F('beach-bag', 'Пляжная сумка', 'extra', { trip: ['sea'] }),
  F('wet-bag', 'Мешок для мокрых и грязных вещей', 'extra'),
  F('water-bottle', 'Многоразовая бутылка для воды', 'extra'),
  F('neck-pillow', 'Дорожная подушка', 'extra', { transport: ['plane', 'train'], minNights: 7 }),
  F('luggage-lock', 'Замок для багажа', 'extra', { transport: ['plane'] }),
  F('umbrella', 'Зонт или дождевик', 'extra'),
  F('snacks', 'Перекус в дорогу', 'extra', { transport: ['train', 'car'] }),
  F('entertainment', 'Книги, скачанные фильмы', 'extra', { note: 'скоротать дорогу' }),
  F('laundry', 'Мыло или порошок для стирки', 'extra', { minNights: 14, note: 'чтобы не везти вещи на все дни' }),
  F('shopper', 'Сумка-шопер для покупок', 'extra'),
  // Дети
  F('kids-toys', 'Игрушки для пляжа и дороги', 'extra', { who: ['kids'] }),
  F('kids-carrier', 'Слинг или эргорюкзак', 'extra', { who: ['kids'], kid: ['baby', 'toddler'] }),
  F('kids-food', 'Детское питание или смесь', 'extra', { who: ['kids'], kid: ['baby'] }),

  // ─── Перед выходом из дома (задачи) ───
  F('check-weather', 'Проверить погоду в месте назначения', 'predeparture'),
  F('download-maps', 'Скачать офлайн-карты и приложения', 'predeparture'),
  F('print-docs', 'Распечатать билеты, брони, страховку', 'predeparture'),
  F('check-cards', 'Уточнить про карты в стране назначения', 'predeparture'),
  F('online-checkin', 'Онлайн-регистрация на рейс', 'predeparture', { transport: ['plane'] }),
  F('charge-all', 'Зарядить все гаджеты', 'predeparture'),
  F('download-media', 'Скачать фильмы, книги, музыку', 'predeparture'),
  F('free-storage', 'Освободить память в телефоне', 'predeparture'),
  F('home-water', 'Перекрыть воду, выключить приборы', 'predeparture'),
  F('home-windows', 'Закрыть окна, полить цветы', 'predeparture'),
  F('check-departure', 'Проверить аэропорт и разницу во времени', 'predeparture'),
];

// Сводка для schema ItemList (плоский список названий под выбранный тип, без фильтров).
export function itemsForTrip(tripId) {
  return ITEMS.filter((it) => !it.trip.length || (tripId && it.trip.includes(tripId)));
}
