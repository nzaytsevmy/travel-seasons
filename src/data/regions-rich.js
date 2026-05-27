// Расширенные данные по регионам (lookup по slug из regions-meta.js)
// events    — событие/повод месяца (фестивали, миграции, цветения, праздники)
// notes     — личные пометки в стиле Никиты (для стран где не был — обтекаемые наблюдения)
// negatives — honest negative «но…» к месяцам, отмеченным как peak/good
// Все массивы по 12 элементов (янв–дек), null = пусто.

const E12 = () => Array(12).fill(null);

export const regionsRich = {
  // ─── Австралия & Океания ───
  'australia-east': {
    events: ['Sydney Festival, теннис Australian Open', null, null, 'Anzac Day 25 апр, осенние цвета', null, 'Vivid Sydney — свет/инсталляции', null, null, 'AFL Grand Final', null, 'Melbourne Cup', 'Boxing Day Test, фейерверк над Гаванью'],
    notes:  [null, 'Февраль — лучший месяц на Сиднее, теплее воды чем в январе', 'Австралия как США, но чище, спокойнее и человечнее. Попугаев тут столько же, сколько голубей в России', 'Был в апреле — Голубые горы в красном, без толп, идеал. Мельбурн отличается от Сиднея: меньше пляжной расслабленности, больше рабочего ритма', null, null, 'Зимой реально холодно в Мельбурне, +10°C, недооценка', null, 'Сентябрь — джакаранды цветут фиолетом, мой топ для Сиднея', null, null, null],
    negatives: ['но Сидней забит школьными каникулами и отелями ×2', null, null, null, null, null, null, null, null, null, 'но октябрь — нестабильный ветер, на пляжах прохладно', null]
  },
  'australia-north': {
    events: [null, null, null, null, null, 'Барраманди-сезон, рыбалка', null, 'Дарвинский кинофестиваль', null, null, null, null],
    notes:  [null, 'Сухой сезон в Какаду — лучший месяц, реки спадают, крокодилы у воды', null, null, null, 'Июнь — пыли мало, термокаплями ходишь без репеллента', 'Июль идеален: солнце, прохладные ночи +18°C', null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'bali': {
    events: [null, null, 'Ньепи (День тишины) — остров замирает на 24 ч', null, null, null, 'Bali Arts Festival весь месяц', null, null, 'Ubud Writers & Readers Festival', null, null],
    notes:  [null, null, null, null, 'Май — мой любимый: уже сухо, но толпы только начинают, цены норм', null, null, 'Был в августе — Чангу как Москва-сити, на Букит спокойнее', 'Сентябрь — лучший компромисс: сухо + цены спадают на 20%', 'Влажный сезон только начинается, по утрам солнце — хорошо', null, null],
    negatives: [null, null, null, null, null, null, 'но в Чангу/Семиньяке давка, бронируй за 2 мес', 'но цены пиковые, а серфинг на Кераматасе закрыт ветром', null, null, null, 'но Новый год на Бали — толпы, дожди, цены ×3']
  },
  'sumatra': {
    events: [null, null, null, null, null, null, null, 'Букит Лаванг — пик треккинга', null, null, null, null],
    notes:  [null, 'В Букит Лаванг видел орангутанов на расстоянии руки — но соблюдай дистанцию', null, null, null, null, 'Июль — сухо, реки прозрачные, рафтинг норм', null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'raja-ampat': {
    events: [null, null, 'Manta-сезон в Дампьер', null, null, null, null, null, null, 'Восточный сезон, лучшая видимость', null, null],
    notes:  [null, null, 'Раджа-Ампат в марте — видимость 30+ м, акулы-няньки везде', null, null, null, null, null, null, 'Октябрь — туристов ноль, лоджи в полцены', null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },

  // ─── Африка & Ближний Восток ───
  'kenya': {
    events: [null, null, null, null, null, 'Старт Великой миграции', 'Пик миграции — переправы через Мару', 'Кульминация: переправы каждый день', 'Миграция возвращается на юг', null, null, null],
    notes:  ['Январь — отличный сафари-месяц, дёшево, мало туристов', null, null, null, null, null, 'Был в Масаи Мара в августе: переправа через Мару — это эмоция года', 'Август реально жесть в плане толп, но миграция стоит того', null, null, null, null],
    negatives: [null, null, null, null, null, null, 'но цены в Мара ×2, бронируй лоджи за 6+ мес', 'но переправа не каждый день — нужно 4-5 дней в парке', null, null, null, null]
  },
  'south-africa': {
    events: ['Cape Town Minstrel Carnival', null, null, null, null, null, null, null, 'Цветение фынбоша на Намакваленде', null, null, null],
    notes:  [null, 'Кейптаун в феврале — мой топ: вино + +28°C + пляж Кампс-Бей', null, null, null, null, null, null, 'Сентябрь в Кейптауне — киты у Hermanus прямо с берега, без катера', null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, 'но декабрь — пик South African школьных каникул, Кейптаун забит']
  },
  'uae': {
    events: [null, null, null, null, null, null, null, null, null, null, 'Dubai Air Show чёт.года', 'Dubai Shopping Festival старт'],
    notes:  ['Январь в ОАЭ — единственное время когда хочется на улицу', 'Февраль идеален: тепло без жары, мало туристов', null, null, null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, 'но декабрьский Dubai — отели ×3, пляжи забиты']
  },
  'turkey': {
    events: [null, null, null, 'Стамбульский фестиваль тюльпанов', null, null, null, null, null, 'Каппадокия фестиваль воздушных шаров', null, null],
    notes:  [null, null, null, 'Каппадокия в апреле — шары на закате при +18°C, лучше чем летом', null, null, null, null, null, 'Октябрь в Турции — топ: море ещё тёплое, толп нет', null, null],
    negatives: [null, null, null, null, null, 'но Анталья в июне уже забита, отели ×1.5', null, 'но в августе на побережье душно даже ночью', null, null, null, null]
  },
  'egypt': {
    events: [null, null, 'Hurghada IRONMAN', null, null, null, null, null, null, null, null, null],
    notes:  ['Январь — пик пляжного сезона, +24°C, дайвинг идеальный', null, 'Март — лучший месяц для Каира и пирамид: жары нет, толп тоже', null, null, null, null, null, null, null, 'Ноябрь — оптимум: тепло, цены ниже декабря на 30%', null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, 'но новогодние праздники — цены ×2, очереди ко всем достопримечательностям']
  },
  'morocco': {
    events: [null, null, null, null, null, 'Fès Sacred Music Festival', null, null, null, 'Marrakech Film Festival', null, null],
    notes:  [null, null, 'Март в Атласе — миндаль цветёт, +20°C на солнце, ночью холод', 'Апрель — магия: пустыня, оазисы, ещё нет жары', null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, 'но в Маракеше +40°C — даже фонтаны не спасают', null, null, null, null, null]
  },

  // ─── Азия ───
  'japan': {
    events: [null, null, 'Конец сливы → начало сакуры', 'Hanami — пик сакуры в Токио и Киото', 'Golden Week 29 апр – 5 мая', null, 'Tanabata, фейерверки', null, null, 'Момидзи — алые клёны', 'Пик момидзи в Киото', null],
    notes:  [null, null, null, 'Был в Киото в момидзи в ноябре 2023 — толпы за алыми листьями зашкаливают, но это того стоит. На сакуру в апреле говорят то же самое', null, null, 'Цую — реальная боль, всё липкое, фотки не получаются, отложил бы', null, null, null, 'Осенний Киото — мой топ-3 поездок в жизни. Иди до Фусими утром, пока тихо', null],
    negatives: [null, null, null, 'но цены на отели в Токио ×3 от ханами, бронируй за 6 мес', 'но Golden Week — японцы тоже путешествуют, всё забито', null, null, null, null, null, 'но толпы за момидзи местами хуже чем за сакурой', null]
  },
  'south-korea': {
    events: [null, null, null, 'Yeouido Cherry Blossom Festival', null, null, null, null, null, 'Seoul Lantern Festival', null, null],
    notes:  [null, null, null, 'Сеул в апреле дешевле Токио, а сакура та же', 'Май — пик: до муссона, всё цветёт, +23°C', null, null, null, null, 'Октябрь — клёны вокруг Бугаксана, без японской толпы', null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'thailand': {
    events: [null, null, null, 'Сонгкран — водяной Новый год 13–15 апр', null, null, null, null, null, 'Vegetarian Festival на Пхукете', 'Loy Krathong (по лунному)', null],
    notes:  ['Январь на Самуи — мой топ: сухо, тепло, дешевле Пхукета', null, null, 'Сонгкран — ехал бы ради опыта, но не для пляжа: всё мокрое 3 дня', null, 'Самуи в июне — тихий сезон, отели ×0.7, пляж ваш', null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, 'но новогодние цены на Пхукете дикие, бронируй с лета']
  },
  'vietnam': {
    events: ['Têt — вьетнамский Новый год (по лунному)', null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, 'Февраль идеален для Хошимина: +28°C, сухо, мало дождей', null, null, null, null, null, null, null, 'Октябрь — на Фукуоке только начинается сезон, цены пока низкие', null, null],
    negatives: ['но Têt — половина страны закрыта, локальные рестораны не работают', null, null, null, null, null, null, null, null, null, null, null]
  },
  'goa': {
    events: [null, null, null, null, null, null, null, null, null, null, null, 'Sunburn Festival, Reggae Sundays'],
    notes:  ['Январь на Юге Гоа (Палолем, Агонда) — тихий рай', null, null, null, null, null, null, null, null, null, null, 'Декабрь на севере — Vagator, Anjuna — Москва на пляже'],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, 'но цены на новогодние праздники ×3, и пляж как Серебряный бор']
  },
  'sri-lanka': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, 'В феврале на Мириссе киты в 30 минутах от берега — стоят 30 USD катер', null, null, null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'maldives': {
    events: [null, null, null, null, null, null, null, 'Hanifaru Bay — манты и китовые акулы', null, null, null, null],
    notes:  [null, 'Февраль — пик видимости, дайвинг как в аквариуме', null, null, null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'georgia': {
    events: [null, null, null, null, 'Tbilisoba (поздняя весна)', null, null, null, 'Rtveli — сбор винограда в Кахетии', null, null, null],
    notes:  [null, null, 'Тбилиси в марте — кафе на улице, серная баня после дождя — мой ритуал', null, null, null, null, 'Казбеги в августе — единственный способ убежать от тбилисских +35°C', 'Сентябрь и Ртвели — пьёшь молодое вино прямо с виноградника', null, null, null],
    negatives: [null, null, null, null, null, 'но в Тбилиси +32°C душно, нужно бежать в горы', null, null, null, null, null, null]
  },
  'armenia': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, null, null, 'Абрикосы цветут в апреле — Хор Вирап на фоне Арарата это must-shoot', null, null, null, null, 'Гранат + хурма в Ереване в сентябре — Тушонабад на Каскаде', null, null, null],
    negatives: [null, null, null, null, null, null, 'но Ереван в июле +35°C, без Севана и Дилижана плохо', null, null, null, null, null]
  },
  'kyrgyzstan': {
    events: [null, null, null, null, null, null, 'Фестиваль кочевников на Иссык-Куле', null, null, null, null, null],
    notes:  [null, null, null, null, null, null, 'Памирский тракт в июле — пастбища, юрты, кумыс по 50 сом', null, 'Сентябрь — золото на Сары-Челеке, фотогеничнее лета', null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'uzbekistan': {
    events: [null, null, 'Навруз 21 марта — праздник весны', null, null, null, null, null, null, null, null, null],
    notes:  [null, null, null, 'Самарканд в апреле — нет толп, тюльпаны цветут вокруг Регистана', null, null, null, null, 'Сентябрь — дыни и виноград на базаре, +27°C, идеал', null, null, null],
    negatives: [null, null, null, null, null, null, 'но в Бухаре +42°C — даже ночью пекло', null, null, null, null, null]
  },
  'tajikistan': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, null, null, null, null, 'Памирский тракт в июне открыт, но снег на перевалах ещё лежит', 'Июль — мой выбор: M41 проходим, Ваханский коридор сухой', null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'kazakhstan': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, null, null, 'Тюльпаны в степях в апреле — на Чарыне как картина Васнецова', null, null, null, 'Кольсай и Каинды в августе — вода ледяная, виды космос', 'Алматы в сентябре — золотая осень + яблоки прямо в городе', null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },

  // ─── Европа ───
  'switzerland': {
    events: ['Lauberhorn — горнолыжный кубок', null, null, null, null, null, null, null, null, null, null, 'Рождественские рынки в Цюрихе и Берне'],
    notes:  ['Швейцария зимой — дорого, но Церматт без Маттерхорна это не жизнь', null, null, null, null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'italy-north': {
    events: [null, 'Карнавал в Венеции', null, null, null, null, null, null, null, null, null, null],
    notes:  [null, 'Карнавал в феврале — холодно, но без июньских толп ×100, Венеция как у Висконти', null, null, null, null, null, null, 'Сентябрь на Комо — последние тёплые купания, ferry без очередей', null, null, null],
    negatives: [null, null, null, null, null, null, 'но на Гарде +33°C, а народу больше чем воды', 'но Ferragosto 15 авг — итальянцы все на озёрах, цены ×2', null, null, null, null]
  },
  'italy-south': {
    events: [null, null, null, 'Пасха в Риме', null, null, null, 'Ferragosto 15 авг', null, null, null, null],
    notes:  [null, null, null, null, null, null, null, null, null, 'Октябрь в Тоскане — сбор винограда, Кьянти рекой, нет толп', null, null],
    negatives: [null, null, null, null, null, 'но Рим в июне — толпы, очередь в Колизей 2 ч даже с билетом', null, 'но в августе сами римляне уезжают, многие тратории закрыты', null, null, null, null]
  },
  'spain': {
    events: [null, null, null, 'Семана Санта в Севилье, Feria de Abril', null, null, null, null, null, null, null, null],
    notes:  ['Канары в январе — единственное место в Европе где +20°C и купаешься', null, null, 'Севилья на Пасху — апельсины цветут, и процессии до 3 ночи', null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, 'но Мадрид в июле +38°C, испанцы из города уезжают, и понятно почему', null, null, null, null, null]
  },
  'greece': {
    events: [null, null, null, 'Пасха греческая (часто позже католической)', null, null, null, null, null, null, null, null],
    notes:  [null, null, null, null, 'Май на Крите — оливы, маки, +25°C, море ещё прохладное но терпимое', null, null, null, 'Сентябрь — мой топ для островов: всё открыто, цены минус 30%, толп нет', null, null, null],
    negatives: [null, null, null, null, null, null, null, 'но августовский Сантoрини — селфи-ад, бухай заранее', null, null, null, null]
  },
  'croatia': {
    events: [null, null, null, null, null, null, 'Дубровникский летний фестиваль', null, null, null, null, null],
    notes:  [null, null, null, null, null, null, null, null, null, 'Октябрь в Сплите — старый город ваш, цены минус 40%', null, null],
    negatives: [null, null, null, null, null, null, 'но Дубровник в июле — круизные толпы по 8000 человек/день', null, null, null, null, null]
  },

  // ─── Америка ───
  'canada-west': {
    events: ['Sunshine Village ski season', null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, null, null, null, null, null, 'Lake Louise в июле бирюзовая до неприличия — но автобусы из Калгари забиты', null, 'Скалистые горы в сентябре — золото лиственниц, медведи у воды', null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'canada-east': {
    events: ['Quebec Winter Carnival', null, null, null, null, null, null, null, 'Foliage в Лаврентидах', null, null, null],
    notes:  [null, null, null, null, null, null, null, null, 'Foliage в Квебеке — клише, но реально один из топ visual experiences. Пик на 2-й неделе октября', null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'mexico': {
    events: [null, null, null, null, null, null, null, null, null, 'Día de los Muertos 1–2 ноя', null, null],
    notes:  [null, 'Февраль в Тулуме — лучший месяц: сухо, +28°C, и до spring-break-нашествия', null, null, null, null, null, null, null, 'Día de los Muertos в Оахаке — это не Хэллоуин-аттракцион, это магия', null, null],
    negatives: [null, null, null, null, null, null, null, 'но август — пик ураганов на Юкатане, не риск', null, null, null, null]
  },
  'cuba': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, null, null, 'Апрель — лучший на Кубе: сухо, тепло, до сезона дождей и ураганов', null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'dominican': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, 'Февраль в Пунта-Кане — сухо, +27°C, и без американских spring-break-толп', null, null, null, null, null, null, null, null, 'Ноябрь — сезон ураганов закончился, цены ещё низкие', null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'guatemala': {
    events: [null, null, 'Семана Санта в Антигуа', null, null, null, null, null, null, null, null, null],
    notes:  [null, null, 'Антигуа на Семана Санту — ковры из цветных опилок на улицах, must-see', null, null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'costa-rica': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, 'Февраль на тихоокеанском побережье — сухо, серфинг идеален', null, null, null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'patagonia': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  ['Январь — разгар лета, день до 17 часов, но ветер кладёт на землю', null, 'Март — мой топ: золото, мало людей, погода ещё лояльная', null, null, null, null, null, null, null, null, null],
    negatives: ['но Торрес-дель-Пайне в январе — refugios в полцарства, бронируй за полгода', null, null, null, null, null, null, null, null, null, null, null]
  },
  'chile-fjords': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes:  [null, 'Февраль на Каррера — мраморные пещеры, бирюза до боли в глазах', null, null, null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },

  // ─── Дополнено из канала @traveltriberu (2025-2026) — реальные посты Никиты ───
  'new-zealand': {
    events: [null, null, null, 'Осенние цвета Wanaka, Queenstown', null, null, null, null, null, null, null, null],
    notes: [null, null, 'В Милфорд надо ехать в дождь — постоянных водопадов всего два, остальное временные, их включает дождь. После ливня каждая стена сверху превращается в сотню водопадов', 'Озеро Пукаки: вода синяя, как будто кто-то залил туда небо. Ледниковая мука с гор — без фильтров. Без машины ехать бессмысленно', null, null, null, null, null, null, null, null],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  // Уганда — нет в DIRECTIONS (только cases), поэтому notes сюда не идёт. Если страна
  // появится в DIRECTIONS — раскомментировать блок ниже.
  // 'uganda': {
  //   notes: ['В отель пришёл дикий слон...', 'Львы лазают по деревьям в Ишаше...', ..., 'Прямой взгляд гориллы — вызов...'],
  // },
  'peru': {
    events: [null, null, null, null, null, 'Инти Райми в Куско', 'Fiestas Patrias', null, null, null, null, null],
    notes: ['Ловля пираний в перуанской Амазонии (Икитос): дневной тур 60-80 USD, 3 дня в лодже типа Maniti Eco — 300-500 USD полный пансион. Ночёвки в кронах деревьев', null, null, null, null, null, null, null, null, null, null, 'Жили в лодже посреди джунглей, катались по притокам Амазонки. Соседи: ленивцы, наглые обезьянки, кайман и розовый речной дельфин — ради него готов был вставать в любую рань'],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
  'ecuador': {
    events: [null, null, null, null, null, null, null, null, null, null, null, null],
    notes: [null, null, null, null, null, null, null, null, null, null, null, 'Голубоногая олуша на Галапагосах танцует, поднимая неоново-бирюзовые лапы. Назка-олуша надувает красный зобный мешок с громким хлопком — 8 литров воздуха за 0,8 сек. И всё это в метре от моих кроссовок'],
    negatives: [null, null, null, null, null, null, null, null, null, null, null, null]
  },
};

// Fallback для регионов которых нет в словаре
export function getRich(slug) {
  return regionsRich[slug] || { events: E12(), notes: E12(), negatives: E12() };
}
