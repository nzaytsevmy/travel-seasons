// POI (Points of Interest) для CountryMap.astro.
// Координаты в WGS84. center/zoom — для bbox карты OSM.
//
// Для стран где Никита был лично — POI из реальных пинов Я.Диск.
// Для непосещённых — обзорные must-see из открытых источников (OSM, Wikidata).
// В UI компонент помечает «обзорная карта» vs «мой маршрут».

export const POIS = {
  'china': {
    visited: false,
    center: { lat: 35.0, lng: 110.0, zoom: 4 },
    pois: [
      { name: 'Пекин',         lat: 39.9042, lng: 116.4074, type: 'city',    note: 'Запретный город, Великая стена в Бадалинге' },
      { name: 'Шанхай',        lat: 31.2304, lng: 121.4737, type: 'city',    note: 'Бунд, Pudong, magenkrupp' },
      { name: 'Сиань',         lat: 34.3416, lng: 108.9398, type: 'culture', note: 'Терракотовая армия, древняя столица' },
      { name: 'Гуйлинь / Яншо', lat: 24.7716, lng: 110.4978, type: 'nature',  note: 'карстовые горы реки Ли' },
      { name: 'Чэнду',         lat: 30.5728, lng: 104.0668, type: 'food',    note: 'панды + сычуаньская кухня' },
      { name: 'Чжанцзяцзе',    lat: 29.1271, lng: 110.4791, type: 'nature',  note: 'аватарские горы UNESCO' },
      { name: 'Гонконг',       lat: 22.3193, lng: 114.1694, type: 'city',    note: 'отдельная виза не нужна 14 дней' },
      { name: 'Пин-Яо',        lat: 37.2009, lng: 112.1751, type: 'culture', note: 'древний город Мин-Цин UNESCO' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'hainan': {
    visited: false,
    center: { lat: 19.2, lng: 109.7, zoom: 8 },
    pois: [
      { name: 'Санья (Yalong Bay)', lat: 18.2528, lng: 109.5119, type: 'beach', note: 'главный курорт, 5★ отели' },
      { name: 'Санья (Dadonghai)',  lat: 18.2256, lng: 109.5167, type: 'beach', note: 'городской пляж, доступно' },
      { name: 'Санья (Haitang Bay)', lat: 18.3306, lng: 109.6500, type: 'beach', note: 'премиум-курорты + duty-free Mall' },
      { name: 'Хайкоу',            lat: 20.0440, lng: 110.1992, type: 'city',  note: 'столица острова, аэропорт' },
      { name: 'Wuzhizhou Island',  lat: 18.3147, lng: 109.7611, type: 'beach', note: 'остров-парк, дайвинг' },
      { name: 'Nanshan Buddhism',  lat: 18.2814, lng: 109.1989, type: 'culture', note: 'статуя Гуаньинь 108м' },
      { name: 'Цинтоу (Ананас)',    lat: 18.4500, lng: 109.4500, type: 'nature', note: 'ананасовые поля + чай' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'egypt': {
    visited: false,
    center: { lat: 26.5, lng: 30.0, zoom: 5 },
    pois: [
      { name: 'Каир + Гиза',  lat: 29.9773, lng: 31.1325, type: 'culture', note: 'пирамиды Гизы, Сфинкс, Египетский музей' },
      { name: 'Луксор',       lat: 25.6872, lng: 32.6396, type: 'culture', note: 'Долина Царей, Карнакский храм' },
      { name: 'Асуан',        lat: 24.0889, lng: 32.8998, type: 'culture', note: 'Филе, Высокая плотина' },
      { name: 'Абу-Симбел',   lat: 22.3372, lng: 31.6258, type: 'culture', note: 'храмы Рамсеса II' },
      { name: 'Хургада',      lat: 27.2579, lng: 33.8116, type: 'beach',   note: 'главный курорт Красного моря' },
      { name: 'Шарм-эль-Шейх', lat: 27.9158, lng: 34.3300, type: 'beach',   note: 'премиум-курорты, Naama Bay' },
      { name: 'Дахаб',        lat: 28.5000, lng: 34.5167, type: 'beach',   note: 'фриденвящий, Blue Hole для дайверов' },
      { name: 'Александрия',  lat: 31.2001, lng: 29.9187, type: 'city',    note: 'средиземноморская, библиотека' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'south-korea': {
    visited: false,
    center: { lat: 36.5, lng: 127.8, zoom: 7 },
    pois: [
      { name: 'Сеул',     lat: 37.5665, lng: 126.9780, type: 'city',    note: 'Мёндон, Хондэ, Канвандэ + дворцы' },
      { name: 'Пусан',    lat: 35.1796, lng: 129.0756, type: 'beach',   note: 'Haeundae пляж + Гамчхон арт-район' },
      { name: 'Чеджу',    lat: 33.4996, lng: 126.5312, type: 'nature',  note: 'остров вулкан Халласан UNESCO' },
      { name: 'Кёнджу',   lat: 35.8562, lng: 129.2247, type: 'culture', note: 'столица Силла; UNESCO Bulguksa' },
      { name: 'Соннисан / Сораксан', lat: 38.1191, lng: 128.4655, type: 'nature', note: 'нацпарк, осенние клёны' },
      { name: 'DMZ',      lat: 38.0000, lng: 126.7000, type: 'culture', note: 'тур с гидом к границе с КНДР' },
      { name: 'Андон',    lat: 36.5684, lng: 128.7294, type: 'culture', note: 'традиционная деревня Хахве UNESCO' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'malaysia': {
    visited: false,
    center: { lat: 4.0, lng: 109.0, zoom: 6 },
    pois: [
      { name: 'Куала-Лумпур', lat: 3.1390, lng: 101.6869, type: 'city',    note: 'Башни Petronas, Бату-Кейвз' },
      { name: 'Пенанг (Джорджтаун)', lat: 5.4145, lng: 100.3292, type: 'culture', note: 'UNESCO стрит-арт + еда mainland Asia' },
      { name: 'Лангкави',     lat: 6.3500, lng: 99.8000,  type: 'beach',   note: 'duty-free остров, Sky Bridge' },
      { name: 'Кота-Кинабалу', lat: 5.9788, lng: 116.0753, type: 'nature',  note: 'Borneo, гора Кинабалу 4095м' },
      { name: 'Кучинг',       lat: 1.5535, lng: 110.3593, type: 'nature',  note: 'Sarawak, орангутаны в Semenggoh' },
      { name: 'Малакка',      lat: 2.1896, lng: 102.2501, type: 'culture', note: 'UNESCO колониальная история' },
      { name: 'Камеронские горы', lat: 4.4710, lng: 101.3760, type: 'nature', note: 'чайные плантации, прохлада' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'morocco': {
    visited: false,
    center: { lat: 31.5, lng: -7.0, zoom: 6 },
    pois: [
      { name: 'Марракеш',     lat: 31.6295, lng: -7.9811, type: 'culture', note: 'Джемаа-эль-Фна, рияды, Меллах' },
      { name: 'Фес',          lat: 34.0181, lng: -5.0078, type: 'culture', note: 'крупнейшая медина мира UNESCO' },
      { name: 'Шефшауэн',     lat: 35.1714, lng: -5.2697, type: 'culture', note: 'голубой город в горах Риф' },
      { name: 'Сахара (Мерзуга)', lat: 31.1000, lng: -4.0000, type: 'nature', note: 'дюны Erg Chebbi, ночёвка в кэмпе' },
      { name: 'Касабланка',   lat: 33.5731, lng: -7.5898, type: 'city',    note: 'мечеть Хасана II, экономический центр' },
      { name: 'Эссауира',     lat: 31.5125, lng: -9.7700, type: 'beach',   note: 'ветреная атлантическая, сёрф' },
      { name: 'Атлас (Имлиль)', lat: 31.1372, lng: -7.9189, type: 'nature',  note: 'базовый лагерь Toubkal (4167м)' },
      { name: 'Айт-Бен-Хадду', lat: 31.0470, lng: -7.1314, type: 'culture', note: 'ksar UNESCO, место съёмок «Игры престолов»' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'peru': {
    visited: false,
    center: { lat: -10.0, lng: -75.5, zoom: 6 },
    pois: [
      { name: 'Лима',         lat: -12.0464, lng: -77.0428, type: 'city',    note: 'столица + аэропорт; Мирафлорес' },
      { name: 'Куско',        lat: -13.5320, lng: -71.9675, type: 'culture', note: 'столица инков, 3400м — акклиматизация 2 дня' },
      { name: 'Мачу-Пикчу',   lat: -13.1631, lng: -72.5450, type: 'culture', note: 'UNESCO; билет за 6 мес' },
      { name: 'Священная долина', lat: -13.3193, lng: -72.0824, type: 'nature', note: 'Писак, Ольянтайтамбо' },
      { name: 'Радужная гора (Vinicunca)', lat: -13.8689, lng: -71.3017, type: 'nature', note: '5200м; треккинг с Куско' },
      { name: 'Озеро Титикака (Пуно)', lat: -15.8402, lng: -70.0219, type: 'nature', note: 'плавающие острова Урос' },
      { name: 'Арекипа',      lat: -16.4090, lng: -71.5375, type: 'culture', note: 'белый город + каньон Колка кондоры' },
      { name: 'Линии Наски',  lat: -14.7390, lng: -75.1300, type: 'culture', note: 'обзор только с самолёта (40 мин)' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'bolivia': {
    visited: false,
    center: { lat: -16.5, lng: -65.0, zoom: 6 },
    pois: [
      { name: 'Ла-Пас',       lat: -16.4897, lng: -68.1193, type: 'city',    note: 'столица 3650м, телеферико Mi Teleférico' },
      { name: 'Уюни (соляная пустыня)', lat: -20.1338, lng: -67.4891, type: 'nature', note: '10 000 км² — мировая визитка' },
      { name: 'Сукре',        lat: -19.0196, lng: -65.2619, type: 'culture', note: 'белая столица UNESCO' },
      { name: 'Потоси',       lat: -19.5722, lng: -65.7531, type: 'culture', note: 'серебряные шахты UNESCO, 4090м' },
      { name: 'Копакабана',   lat: -16.1668, lng: -69.0857, type: 'nature',  note: 'озеро Титикака + Isla del Sol' },
      { name: 'Тиуанако',     lat: -16.5547, lng: -68.6736, type: 'culture', note: 'доинкская столица UNESCO' },
      { name: 'Рурренабаке (Амазония)', lat: -14.4419, lng: -67.5293, type: 'nature', note: 'нацпарк Madidi, ягуары' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'chile': {
    visited: false,
    center: { lat: -33.0, lng: -71.0, zoom: 4 },
    pois: [
      { name: 'Сантьяго',     lat: -33.4489, lng: -70.6693, type: 'city',    note: 'столица + Анды видны' },
      { name: 'Вальпараисо',  lat: -33.0472, lng: -71.6127, type: 'culture', note: 'UNESCO, холмы, фуникулёры, стрит-арт' },
      { name: 'Атакама (Сан-Педро)', lat: -22.9098, lng: -68.1996, type: 'nature', note: 'самая сухая пустыня мира, гейзеры' },
      { name: 'Торрес-дель-Пайне', lat: -50.9423, lng: -73.4068, type: 'nature', note: 'патагония, W-trek 4-5 дней' },
      { name: 'Чилоэ',        lat: -42.6166, lng: -73.7768, type: 'culture', note: 'остров деревянных церквей UNESCO' },
      { name: 'Атакама обсерватория', lat: -24.6275, lng: -70.4044, type: 'nature', note: 'Paranal/ALMA, лучшие звёзды Земли' },
      { name: 'Пуэрто-Варас',  lat: -41.3194, lng: -72.9856, type: 'nature',  note: 'озёрный край, вулкан Osorno' },
      { name: 'Остров Пасхи',  lat: -27.1127, lng: -109.3497, type: 'culture', note: 'моаи; перелёт из Сантьяго 5ч' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'serbia': {
    visited: false,
    center: { lat: 44.0, lng: 21.0, zoom: 7 },
    pois: [
      { name: 'Белград',       lat: 44.7866, lng: 20.4489, type: 'city',    note: 'крепость Калемегдан, Скадарлия' },
      { name: 'Нови-Сад',      lat: 45.2671, lng: 19.8335, type: 'city',    note: 'Петроварадин = место Exit Festival' },
      { name: 'Златибор',      lat: 43.7286, lng: 19.7019, type: 'nature',  note: 'горный курорт, лыжи зимой, треккинг летом' },
      { name: 'Дрвенград (Мечавник)', lat: 43.8071, lng: 19.5081, type: 'culture', note: 'село Кустурицы + Šargan 8' },
      { name: 'Студеница',     lat: 43.4828, lng: 20.5375, type: 'culture', note: 'православный монастырь UNESCO' },
      { name: 'Тара (нацпарк)', lat: 43.9176, lng: 19.4239, type: 'nature',  note: 'каньон Дрина, дикая природа' },
      { name: 'Ниш',           lat: 43.3209, lng: 21.8954, type: 'culture', note: 'родина Константина, Челе-Кула' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'bali': {
    visited: false,
    center: { lat: -8.4095, lng: 115.1889, zoom: 9 },
    pois: [
      { name: 'Денпасар',     lat: -8.6500, lng: 115.2167, type: 'city',    note: 'столица + аэропорт' },
      { name: 'Семиньяк',     lat: -8.6900, lng: 115.1600, type: 'beach',   note: 'премиум пляж + закаты' },
      { name: 'Чангу',        lat: -8.6478, lng: 115.1385, type: 'beach',   note: 'сёрф + диджитал-номады' },
      { name: 'Убуд',         lat: -8.5069, lng: 115.2625, type: 'culture', note: 'арт-столица, рисовые террасы' },
      { name: 'Улувату',      lat: -8.8290, lng: 115.0850, type: 'beach',   note: 'клиффы + храм Pura Luhur' },
      { name: 'Нуса Пенида',  lat: -8.7270, lng: 115.5450, type: 'nature',  note: 'Kelingking Beach, дайвинг' },
      { name: 'Мунду',        lat: -8.2762, lng: 115.0383, type: 'nature',  note: 'север Бали, водопады' },
      { name: 'Танах Лот',    lat: -8.6212, lng: 115.0867, type: 'culture', note: 'храм на скале в океане' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'uae': {
    visited: false,
    center: { lat: 24.9, lng: 54.5, zoom: 7 },
    pois: [
      { name: 'Дубай',              lat: 25.2048, lng: 55.2708, type: 'city',    note: 'Бурдж-Халифа, Дубай-молл, Палма' },
      { name: 'Абу-Даби',           lat: 24.4539, lng: 54.3773, type: 'city',    note: 'мечеть Шейха Зайеда, Лувр Абу-Даби' },
      { name: 'Шарджа',             lat: 25.3463, lng: 55.4209, type: 'culture', note: 'культурная столица ОАЭ, музеи' },
      { name: 'Аль-Айн',            lat: 24.2075, lng: 55.7447, type: 'nature',  note: 'оазис, гора Джебель Хафит' },
      { name: 'Рас-эль-Хайма',      lat: 25.7895, lng: 55.9432, type: 'nature',  note: 'Джебель-Джейс, самая длинная зиплайн' },
      { name: 'Фуджейра',           lat: 25.1288, lng: 56.3265, type: 'beach',   note: 'восточный берег, дайвинг в Индийском океане' },
      { name: 'Хатта',              lat: 24.7980, lng: 56.1297, type: 'nature',  note: 'горы Хаджар, каяки на озере' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'vietnam': {
    visited: false,
    center: { lat: 16.0, lng: 107.5, zoom: 5 },
    pois: [
      { name: 'Ханой',         lat: 21.0285, lng: 105.8542, type: 'city',    note: 'Старый квартал, озеро Хоан Кьем' },
      { name: 'Халонг',        lat: 20.9101, lng: 107.1839, type: 'nature',  note: 'известняковые острова, круизы' },
      { name: 'Сапа',          lat: 22.3364, lng: 103.8438, type: 'nature',  note: 'рисовые террасы, треккинг' },
      { name: 'Хюэ',           lat: 16.4637, lng: 107.5909, type: 'culture', note: 'императорская столица, цитадель' },
      { name: 'Хойан',         lat: 15.8801, lng: 108.3380, type: 'culture', note: 'старый город, фонарики, шитьё одежды' },
      { name: 'Дананг',        lat: 16.0544, lng: 108.2022, type: 'beach',   note: 'My Khe Beach, Marble Mountains' },
      { name: 'Нячанг',        lat: 12.2388, lng: 109.1967, type: 'beach',   note: 'русский курорт, дайвинг' },
      { name: 'Хошимин',       lat: 10.8231, lng: 106.6297, type: 'city',    note: 'бывший Сайгон, тоннели Ку Чи' },
      { name: 'Фукуок',        lat: 10.2899, lng: 103.9840, type: 'beach',   note: 'остров, премиум-резорты' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'armenia': {
    visited: false,
    center: { lat: 40.3, lng: 45.0, zoom: 8 },
    pois: [
      { name: 'Ереван',      lat: 40.1792, lng: 44.4991, type: 'city',    note: 'Каскад, Республика, музей Параджанова' },
      { name: 'Гарни',       lat: 40.1129, lng: 44.7311, type: 'culture', note: 'эллинистический храм I века' },
      { name: 'Гегард',      lat: 40.1419, lng: 44.8210, type: 'culture', note: 'пещерный монастырь, UNESCO' },
      { name: 'Севан',       lat: 40.5697, lng: 45.0146, type: 'nature',  note: 'высокогорное озеро, монастырь Севанаванк' },
      { name: 'Дилижан',     lat: 40.7415, lng: 44.8625, type: 'nature',  note: '«армянская Швейцария», лес' },
      { name: 'Хор Вирап',   lat: 39.8788, lng: 44.5783, type: 'culture', note: 'вид на Арарат, древний монастырь' },
      { name: 'Татев',       lat: 39.3791, lng: 46.2502, type: 'culture', note: 'монастырь + канатка «Крылья Татева»' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'sri-lanka': {
    visited: false,
    center: { lat: 7.5, lng: 80.7, zoom: 7 },
    pois: [
      { name: 'Коломбо',      lat: 6.9271,  lng: 79.8612, type: 'city',    note: 'столица, Galle Face, аэропорт' },
      { name: 'Сигирия',      lat: 7.9569,  lng: 80.7600, type: 'culture', note: 'скала-крепость UNESCO, львиные лапы' },
      { name: 'Канди',        lat: 7.2906,  lng: 80.6337, type: 'culture', note: 'храм Зуба Будды, Перахера' },
      { name: 'Элла',         lat: 6.8716,  lng: 81.0463, type: 'nature',  note: 'Девятиарочный мост, чайные плантации' },
      { name: 'Унавантуна',   lat: 6.0125,  lng: 80.2491, type: 'beach',   note: 'пляж у Галле, сёрф' },
      { name: 'Мирисса',      lat: 5.9485,  lng: 80.4571, type: 'beach',   note: 'киты в сезоне декабрь-апрель' },
      { name: 'Анурадхапура', lat: 8.3114,  lng: 80.4037, type: 'culture', note: 'древняя столица UNESCO, ступы' },
      { name: 'Яла нацпарк',  lat: 6.3700,  lng: 81.5167, type: 'nature',  note: 'леопарды, слоны, сафари' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'maldives': {
    visited: false,
    center: { lat: 3.2, lng: 73.2, zoom: 7 },
    pois: [
      { name: 'Мале',                lat: 4.1755, lng: 73.5093, type: 'city',   note: 'столица + аэропорт Velana International' },
      { name: 'Маафуши',             lat: 3.9425, lng: 73.4906, type: 'beach',  note: 'местный остров, бюджетный вариант, гестхаусы' },
      { name: 'Атолл Северный Мале', lat: 4.4000, lng: 73.5000, type: 'beach',  note: 'премиум резорты: One&Only, W Maldives' },
      { name: 'Атолл Южный Ари',     lat: 3.5000, lng: 72.8500, type: 'nature', note: 'киты, манта-рэи, дайвинг класс-1 мирового уровня' },
      { name: 'Атолл Баа (UNESCO)',  lat: 5.1500, lng: 73.0667, type: 'nature', note: 'манты Hanifaru Bay в сезоне май-ноябрь' },
      { name: 'Гаафу-Алифу',         lat: 0.3000, lng: 73.4000, type: 'beach',  note: 'южные атоллы, дикий дайвинг' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'kenya': {
    visited: false,
    center: { lat: 0.5, lng: 37.5, zoom: 6 },
    pois: [
      { name: 'Найроби',           lat: -1.2864, lng: 36.8172, type: 'city',    note: 'столица, Nairobi NP в черте города' },
      { name: 'Масаи Мара',        lat: -1.5036, lng: 35.1430, type: 'nature',  note: 'Big Five, миграция гну июль-октябрь' },
      { name: 'Амбосели',          lat: -2.6450, lng: 37.2606, type: 'nature',  note: 'слоны на фоне Килиманджаро' },
      { name: 'Цаво',              lat: -2.9667, lng: 38.4667, type: 'nature',  note: 'крупнейший парк Кении, красные слоны' },
      { name: 'Озеро Накуру',      lat: -0.3700, lng: 36.0830, type: 'nature',  note: 'розовые фламинго, носороги' },
      { name: 'Ламу',              lat: -2.2717, lng: 40.9020, type: 'culture', note: 'UNESCO суахили-город, островная архитектура' },
      { name: 'Диани-Бич',         lat: -4.3000, lng: 39.5833, type: 'beach',   note: 'Индийский океан, главный курорт' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'mexico': {
    visited: false,
    center: { lat: 23.5, lng: -102.0, zoom: 5 },
    pois: [
      { name: 'Мехико',           lat: 19.4326, lng: -99.1332, type: 'city',    note: 'столица, Сокало, Теотиуакан рядом' },
      { name: 'Канкун',           lat: 21.1619, lng: -86.8515, type: 'beach',   note: 'all-inclusive курорт, Карибы' },
      { name: 'Плайя-дель-Кармен',lat: 20.6296, lng: -87.0739, type: 'beach',   note: '5-я авеню, sеноты + Тулум 1ч' },
      { name: 'Тулум',            lat: 20.2114, lng: -87.4654, type: 'culture', note: 'руины майя на скале + пляж' },
      { name: 'Чичен-Ица',        lat: 20.6843, lng: -88.5678, type: 'culture', note: 'UNESCO, пирамида Кукулькана' },
      { name: 'Оахака',           lat: 17.0732, lng: -96.7266, type: 'culture', note: 'мескаль, Día de Muertos, Монте-Альбан' },
      { name: 'Пуэрто-Вальярта',  lat: 20.6534, lng: -105.2253, type: 'beach',  note: 'тихоокеанский курорт' },
      { name: 'Сан-Кристобаль',   lat: 16.7370, lng: -92.6376, type: 'nature',  note: 'Чьяпас, каньон Sumidero' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'cuba': {
    visited: false,
    center: { lat: 21.5, lng: -77.8, zoom: 6 },
    pois: [
      { name: 'Гавана',         lat: 23.1136, lng: -82.3666, type: 'city',    note: 'Старая Гавана UNESCO, Малекон' },
      { name: 'Варадеро',       lat: 23.1394, lng: -81.2868, type: 'beach',   note: 'главный пляжный курорт' },
      { name: 'Тринидад',       lat: 21.8045, lng: -79.9846, type: 'culture', note: 'колониальный город UNESCO' },
      { name: 'Виньялес',       lat: 22.6168, lng: -83.7060, type: 'nature',  note: 'долина с моготес, табачные плантации' },
      { name: 'Сантьяго-де-Куба', lat: 20.0247, lng: -75.8219, type: 'culture', note: 'столица востока, кубинская колыбель Революции' },
      { name: 'Кайо-Коко',      lat: 22.5132, lng: -78.4053, type: 'beach',   note: 'дикий остров, all-inclusive резорты' },
      { name: 'Сьенфуэгос',     lat: 22.1499, lng: -80.4364, type: 'culture', note: 'французская колониальная архитектура UNESCO' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'italy-north': {
    visited: false,
    center: { lat: 45.5, lng: 11.0, zoom: 7 },
    pois: [
      { name: 'Венеция',         lat: 45.4408, lng: 12.3155, type: 'culture', note: 'лагуна, гондолы, Сан-Марко' },
      { name: 'Милан',           lat: 45.4642, lng: 9.1900,  type: 'city',    note: 'мода, Дуомо, Тайная вечеря' },
      { name: 'Озеро Комо',      lat: 45.9985, lng: 9.2580,  type: 'nature',  note: 'премиум вилла-зона, Bellagio' },
      { name: 'Озеро Гарда',     lat: 45.6385, lng: 10.6418, type: 'nature',  note: 'крупнейшее озеро Италии, виндсёрф' },
      { name: 'Доломиты',        lat: 46.4102, lng: 11.8440, type: 'nature',  note: 'UNESCO, треккинг + горнолыжка' },
      { name: 'Верона',          lat: 45.4384, lng: 10.9916, type: 'culture', note: 'дом Джульетты, римская арена' },
      { name: 'Чинкве-Терре',    lat: 44.1227, lng: 9.7173,  type: 'beach',   note: 'пять рыбацких деревень UNESCO' },
      { name: 'Турин',           lat: 45.0703, lng: 7.6869,  type: 'city',    note: 'столица Пьемонта, шоколад, барокко' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'italy-south': {
    visited: false,
    center: { lat: 40.5, lng: 14.5, zoom: 6 },
    pois: [
      { name: 'Рим',             lat: 41.9028, lng: 12.4964, type: 'city',    note: 'Колизей, Ватикан, Пантеон' },
      { name: 'Флоренция',       lat: 43.7696, lng: 11.2558, type: 'culture', note: 'Уффици, Понте-Веккьо, Тоскана' },
      { name: 'Тоскана (Сиена)', lat: 43.3188, lng: 11.3308, type: 'nature',  note: 'кипарисы, винодельни, Сан-Джиминьяно' },
      { name: 'Амальфи',         lat: 40.6346, lng: 14.6027, type: 'beach',   note: 'побережье UNESCO, Позитано' },
      { name: 'Помпеи',          lat: 40.7484, lng: 14.4854, type: 'culture', note: 'античный город, засыпанный Везувием' },
      { name: 'Капри',           lat: 40.5479, lng: 14.2426, type: 'beach',   note: 'остров, Голубой грот' },
      { name: 'Сицилия (Палермо)', lat: 38.1157, lng: 13.3615, type: 'culture', note: 'арабо-норманнское наследие, Этна' },
      { name: 'Сардиния (Кальяри)', lat: 39.2238, lng: 9.1217, type: 'beach', note: 'белые пляжи, Costa Smeralda' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'spain': {
    visited: false,
    center: { lat: 40.4, lng: -3.7, zoom: 6 },
    pois: [
      { name: 'Мадрид',          lat: 40.4168, lng: -3.7038,  type: 'city',    note: 'Прадо, Ретиро, тапас' },
      { name: 'Барселона',       lat: 41.3851, lng: 2.1734,   type: 'city',    note: 'Гауди, Готический квартал, пляж' },
      { name: 'Севилья',         lat: 37.3891, lng: -5.9845,  type: 'culture', note: 'Альказар, фламенко, Семана Санта' },
      { name: 'Гранада',          lat: 37.1773, lng: -3.5986,  type: 'culture', note: 'Альгамбра — UNESCO мавританская архитектура' },
      { name: 'Сан-Себастьян',   lat: 43.3183, lng: -1.9812,  type: 'food',    note: 'пинчос-столица + La Concha' },
      { name: 'Валенсия',        lat: 39.4699, lng: -0.3763,  type: 'city',    note: 'паэлья, Las Fallas, Город науки' },
      { name: 'Канарские острова (Тенерифе)', lat: 28.2916, lng: -16.6291, type: 'beach', note: 'вулкан Тейде, пляжи круглый год' },
      { name: 'Малага',          lat: 36.7213, lng: -4.4214,  type: 'beach',   note: 'Коста-дель-Соль + Пикассо музей' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'turkey': {
    visited: false,
    center: { lat: 39.0, lng: 35.0, zoom: 6 },
    pois: [
      { name: 'Стамбул',    lat: 41.0082, lng: 28.9784, type: 'city',    note: 'Айя-София, Топкапы, Босфор' },
      { name: 'Анталья',    lat: 36.8969, lng: 30.7133, type: 'beach',   note: 'основной курорт; пляжи + старый город' },
      { name: 'Каппадокия', lat: 38.6431, lng: 34.8289, type: 'nature',  note: 'воздушные шары на рассвете' },
      { name: 'Памуккале',  lat: 37.9137, lng: 29.1187, type: 'nature',  note: 'белые травертины + Иераполис' },
      { name: 'Эфес',       lat: 37.9412, lng: 27.3416, type: 'culture', note: 'античный город, библиотека Цельса' },
      { name: 'Бодрум',     lat: 37.0344, lng: 27.4305, type: 'beach',   note: 'премиум-курорт Эгейского моря' },
      { name: 'Анкара',     lat: 39.9334, lng: 32.8597, type: 'city',    note: 'столица; мавзолей Ататюрка' }
    ],
    sources: [
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' },
      { name: 'GoTürkiye — официальный туризм', url: 'https://goturkiye.com/' }
    ]
  },

  'thailand': {
    visited: false,
    center: { lat: 13.0, lng: 101.0, zoom: 5 },
    pois: [
      { name: 'Бангкок',    lat: 13.7563, lng: 100.5018, type: 'city',    note: 'Гранд-Палас, плавучие рынки' },
      { name: 'Пхукет',     lat: 7.8804,  lng: 98.3923,  type: 'beach',   note: 'крупнейший остров, пляжи + ночная жизнь' },
      { name: 'Чиангмай',   lat: 18.7883, lng: 98.9853,  type: 'nature',  note: 'горы, храмы, слоновьи парки' },
      { name: 'Краби',      lat: 8.0863,  lng: 98.9063,  type: 'beach',   note: 'известняковые скалы, Райли' },
      { name: 'Ко Самуи',   lat: 9.5018,  lng: 100.0136, type: 'beach',   note: 'пляжи + ангтонг национальный парк' },
      { name: 'Аютайя',     lat: 14.3692, lng: 100.5877, type: 'culture', note: 'древняя столица, руины храмов' },
      { name: 'Паттайя',    lat: 12.9236, lng: 100.8825, type: 'beach',   note: 'ближайший пляж от Бангкока' }
    ],
    sources: [
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' },
      { name: 'TAT — Tourism Authority of Thailand', url: 'https://www.tourismthailand.org/' }
    ]
  },

  'georgia': {
    visited: false,
    center: { lat: 42.0, lng: 43.5, zoom: 7 },
    pois: [
      { name: 'Тбилиси',    lat: 41.7151, lng: 44.8271, type: 'city',    note: 'старый город, серные бани, Нарикала' },
      { name: 'Батуми',     lat: 41.6168, lng: 41.6367, type: 'beach',   note: 'морской курорт + современная архитектура' },
      { name: 'Казбеги',    lat: 42.6587, lng: 44.6470, type: 'nature',  note: 'церковь Гергети + гора Казбек 5047м' },
      { name: 'Сванетия',   lat: 43.0028, lng: 42.7167, type: 'nature',  note: 'Местия, башни Чажаши, треккинг' },
      { name: 'Мцхета',     lat: 41.8458, lng: 44.7203, type: 'culture', note: 'древняя столица, Светицховели' },
      { name: 'Кахетия',    lat: 41.6500, lng: 45.6900, type: 'food',    note: 'винный регион; Сигнахи, Телави' },
      { name: 'Боржоми',    lat: 41.8404, lng: 43.3782, type: 'nature',  note: 'минеральные воды + национальный парк' }
    ],
    sources: [
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' },
      { name: 'GeorgianTravelGuide', url: 'https://georgiantravelguide.com/' }
    ]
  },

  'japan': {
    visited: true,            // Никита был — реальный маршрут ноябрь 2023
    center: { lat: 36.2, lng: 138.2, zoom: 5 },
    pois: [
      { name: 'Токио',     lat: 35.6762, lng: 139.6503, type: 'city',    note: 'стартовая точка Golden Route' },
      { name: 'Хаконе',    lat: 35.2324, lng: 139.1069, type: 'nature',  note: 'онсэн + вид на Фудзи' },
      { name: 'Киото',     lat: 35.0116, lng: 135.7681, type: 'city',    note: 'храмы, гэйши, момидзи' },
      { name: 'Осака',     lat: 34.6937, lng: 135.5023, type: 'city',    note: 'еда, такояки' },
      { name: 'Нара',      lat: 34.6851, lng: 135.8048, type: 'culture', note: 'олени, древняя столица' },
      { name: 'Фудзи',     lat: 35.3606, lng: 138.7274, type: 'nature',  note: 'восхождение 1 июля - 10 сент' },
      { name: 'Хиросима',  lat: 34.3853, lng: 132.4553, type: 'culture', note: 'мемориал, остров Миядзима' },
      { name: 'Никко',     lat: 36.7197, lng: 139.6982, type: 'nature',  note: 'храмы, водопад Кэгон' }
    ],
    sources: [
      { name: 'Реальный маршрут автора, ноябрь 2023', url: '/blog/japan-guide-2026/' },
      { name: 'OpenStreetMap (координаты)', url: 'https://www.openstreetmap.org/' }
    ]
  }
};

export function hasPois(slug) {
  return Boolean(POIS[slug]?.pois?.length);
}

export function getPois(slug) {
  return POIS[slug] || null;
}

// bbox для OSM embed iframe: [minLng, minLat, maxLng, maxLat]
export function getBbox(slug, padding = 0.5) {
  const data = POIS[slug];
  if (!data?.pois?.length) return null;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const p of data.pois) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return {
    minLng: minLng - padding,
    minLat: minLat - padding,
    maxLng: maxLng + padding,
    maxLat: maxLat + padding
  };
}
