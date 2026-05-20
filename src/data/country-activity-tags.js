// Activity-tags per direction slug — curated, не автодетекшн.
// Используется в /packing/[c]/[m] для блока «Что взять под местные занятия».
// Если slug нет в карте — блок не показывается (graceful degrade).
// Теги: beach, safari, mountain, altitude, jungle, ski, dive, desert, city, culture, food, photo

export const ACTIVITY_TAGS = {
  // Океания + Австралия
  'australia-east':       ['beach','city','culture'],
  'australia-north':      ['desert','safari','beach'],
  'bali':                 ['beach','culture','dive','jungle'],
  'sumatra-kalimantan':   ['jungle','culture'],
  'raja-ampat':           ['dive','beach'],
  'new-zealand-north':    ['mountain','beach','culture'],
  'new-zealand-south':    ['mountain','ski'],
  'fiji':                 ['beach','dive'],

  // Африка + Ближний Восток
  'kenya':                ['safari','culture'],
  'south-africa':         ['safari','beach','culture','mountain'],
  'uganda':               ['safari','jungle','mountain'],
  'tanzania':             ['safari','beach','mountain'],
  'uae':                  ['desert','city','beach'],
  'turkey':               ['beach','culture','city'],
  'egypt':                ['desert','beach','culture','dive'],
  'morocco':              ['desert','culture','mountain'],
  'jordan':               ['desert','culture'],
  'israel':               ['beach','culture','city'],

  // Азия
  'japan':                ['culture','city','food','photo'],
  'japan-hokkaido':       ['ski','mountain','culture'],
  'south-korea':          ['city','culture','food','ski'],
  'thailand':             ['beach','culture','dive','food'],
  'vietnam':              ['beach','culture','food','jungle'],
  'india-goa':            ['beach','culture'],
  'sri-lanka':            ['beach','culture','safari','mountain'],
  'maldives':             ['beach','dive'],
  'cambodia':             ['culture','beach','jungle'],
  'laos':                 ['culture','jungle','mountain'],
  'myanmar':              ['culture','beach'],
  'philippines':          ['beach','dive','jungle'],
  'china':                ['city','culture','mountain','food'],
  'hainan':               ['beach','food'],

  // Центральная Азия / Кавказ
  'georgia':              ['mountain','culture','food'],
  'armenia':              ['mountain','culture'],
  'kyrgyzstan':           ['mountain','altitude','culture'],
  'uzbekistan':           ['desert','culture','city'],
  'tajikistan':           ['mountain','altitude'],
  'kazakhstan':           ['mountain','desert','city'],
  'azerbaijan':           ['city','culture'],

  // Европа
  'switzerland':          ['mountain','ski','culture','city'],
  'italy-north':          ['mountain','ski','culture','food'],
  'italy-south':          ['beach','culture','food','city'],
  'spain':                ['beach','culture','city','food'],
  'greece':               ['beach','culture'],
  'croatia':              ['beach','culture'],
  'france':               ['culture','city','food'],
  'portugal':             ['beach','culture','city','food'],
  'germany':              ['city','culture'],
  'austria':              ['ski','mountain','culture'],
  'czech-republic':       ['city','culture'],
  'poland':               ['city','culture'],
  'norway':               ['mountain','photo'],
  'norway-arctic':        ['photo','mountain'], // aurora

  // Северная Америка
  'canada-rockies':       ['mountain','ski','photo'],
  'canada-east':          ['city','culture','photo'],
  'usa-west':             ['mountain','city','desert'],
  'usa-east':             ['city','culture'],
  'mexico':               ['beach','culture','dive','food'],
  'cuba':                 ['beach','culture','city'],
  'dominican-republic':   ['beach','dive'],
  'guatemala-belize':     ['jungle','culture','dive'],
  'costa-rica-panama':    ['jungle','beach','safari'],

  // Южная Америка
  'peru':                 ['mountain','altitude','culture','jungle'],
  'bolivia':              ['mountain','altitude','desert','culture'],
  'chile':                ['mountain','desert','city'],
  'chile-patagonia':      ['mountain','photo'],
  'argentina':            ['mountain','city','culture','food'],
  'brazil':               ['beach','jungle','city'],
  'colombia':             ['culture','beach','jungle','mountain'],
  'ecuador':              ['mountain','altitude','jungle','beach'],
  'galapagos':            ['dive','beach','photo'],
  'venezuela':            ['mountain','jungle','beach'],
  'uruguay':              ['beach','culture'],
  'paraguay':             ['culture','jungle'],

  // Полярные
  'antarctica':           ['photo','mountain'],
  'iceland':              ['mountain','photo'],
};

// Лейблы для display
export const ACTIVITY_LABEL = {
  beach: 'пляж и купание',
  safari: 'сафари',
  mountain: 'горы и треккинг',
  altitude: 'высокогорье',
  jungle: 'джунгли',
  ski: 'горные лыжи / сноуборд',
  dive: 'дайвинг / снорклинг',
  desert: 'пустыня',
  city: 'город',
  culture: 'культурные объекты',
  food: 'гастрономия',
  photo: 'фотография',
};

// Что брать под каждую активность (универсально, поверх weather-bucket)
export const ACTIVITY_GEAR = {
  beach:    ['Купальник или плавки (2 шт — один сохнет)', 'Маска + трубка (свой комплект дешевле проката)', 'Пляжное полотенце микрофибра'],
  safari:   ['Бинокль 8×42 минимум (lodges дают разное качество)', 'Камера с зумом ≥200 мм (без зума животных не видно)', 'Шляпа широкополая', 'Одежда хаки/беж (синий/чёрный привлекает муху цеце)'],
  mountain: ['Треккинговые палки (снижают нагрузку на колени на 25%)', 'Разношенные треккинг-ботинки', 'Day-pack 25–30 л с поясным ремнём'],
  altitude: ['Диамокс по совету врача (от горной болезни)', 'Электролиты — на высоте обезвоживание быстрое', 'Очки UV 400 категория 3+'],
  jungle:   ['Перметрин для обработки одежды (заранее, дома)', 'Гамаши от пиявок и шипов', 'Налобный фонарь'],
  ski:      ['Горнолыжная маска (свою лучше брать — прокат изношен)', 'Защита спины и шлем (можно в прокат)', 'Тёплые перчатки + сменные внутренние'],
  dive:     ['Сертификат PADI/SSI если есть', 'Свой компьютер если планируешь >5 дайвов (прокат $10+/день)', 'Маска под глаза — личная (чужая течёт)'],
  desert:   ['Шемаг или buff на голову/шею', 'Фляга 1.5 л + 2-я (в пустыне +2 л/день)', 'Закрытая обувь — песок +60 °C обжигает'],
  city:     ['Удобные кроссовки для 10–15 км ходьбы в день', 'Power bank 10 000+ мАч (всё больше в кафе/музеях)'],
  culture:  ['Одежда закрывающая плечи/колени для храмов и церквей', 'Носки чистые без дыр (в мечетях и буддистских храмах — без обуви)'],
  food:     ['Пробиотики — поможет адаптации к новой кухне', 'Влажные салфетки антисептик'],
  photo:    ['Запасные карты SD (минимум 2)', 'Power bank крупный 20 000+ мАч', 'Чехол изотермический если в холоде/жаре'],
};
