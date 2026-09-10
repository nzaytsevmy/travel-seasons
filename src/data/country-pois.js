// ⛔ Метки «датированная фактура» у файла нет — снята 11.09.2026. Здесь названия мест, координаты и кадры,
//   читают их только страница страны и список мест на карте (CountryMap). С меткой генератор дат
//   (scripts/gen-page-lastmod.mjs) отдавал правку этого файла ВСЕМ страницам страны: переписанные описания
//   мест у 26 стран дали сегодняшнюю дату 759 адресам (35%) — сборам и поездкам, где мест нет вовсе,
//   и проверка карты сайта (tests/sitemap-dates.spec.ts) справедливо не пустила отправку.
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
      { name: 'Пекин', lat: 39.9042, lng: 116.4074, type: 'city', note: 'Запретный город, за городом — Великая стена у Бадалина', photo: 'poi/china/01-pekin.jpg', alt: 'Храм Неба в Пекине' },
      { name: 'Шанхай', lat: 31.2304, lng: 121.4737, type: 'city', note: 'Набережная Бунд и небоскрёбы Пудуна', photo: 'poi/china/02-shankhay.jpg', alt: 'Небоскрёбы Пудуна в Шанхае вечером' },
      { name: 'Сиань', lat: 34.3416, lng: 108.9398, type: 'culture', note: 'Древняя столица и Терракотовая армия', photo: 'poi/china/03-sian.jpg', alt: 'Башни городской стены Сианя' },
      { name: 'Гуйлинь / Яншо', lat: 24.7716, lng: 110.4978, type: 'nature', note: 'Карстовые горы вдоль реки Ли', photo: 'poi/china/04-guylin-yansho.jpg', alt: 'Карстовые горы над рекой Ли' },
      { name: 'Чэнду', lat: 30.5728, lng: 104.0668, type: 'food', note: 'Панды и сычуаньская кухня', photo: 'poi/china/05-chendu.jpg', alt: 'Детёныш панды в Чэнду' },
      { name: 'Чжанцзяцзе', lat: 29.1271, lng: 110.4791, type: 'nature', note: 'Скалы-столбы из «Аватара», парк в списке ЮНЕСКО', photo: 'poi/china/06-chzhantszyatsze.jpg', alt: 'Скалы-столбы Чжанцзяцзе в тумане' },
      { name: 'Гонконг', lat: 22.3193, lng: 114.1694, type: 'city', note: 'Свои правила въезда: россиянам без визы до 14 дней', photo: 'poi/china/07-gonkong.jpg', alt: 'Джонка с красными парусами на фоне небоскрёбов Гонконга' },
      { name: 'Пинъяо', lat: 37.2009, lng: 112.1751, type: 'culture', note: 'Город эпох Мин и Цин, объект ЮНЕСКО', photo: 'poi/china/08-pinyao.jpg', alt: 'Улица и башня старого города Пинъяо' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'hainan': {
    visited: false,
    center: { lat: 19.2, lng: 109.7, zoom: 8 },
    pois: [
      { name: 'Санья, бухта Ялунвань', lat: 18.2528, lng: 109.5119, type: 'beach', note: 'Главная курортная бухта, отели 5★', photo: 'poi/hainan/01-sanya-bukhta-yalunvan.jpg', alt: 'Пирс и бирюзовая вода в бухте Ялунвань' },
      { name: 'Санья, бухта Дадунхай', lat: 18.2256, lng: 109.5167, type: 'beach', note: 'Городской пляж, жильё дешевле', photo: 'poi/hainan/02-sanya-bukhta-dadunkhay.jpg', alt: 'Пляж Дадунхай с зонтиками из пальмовых листьев' },
      { name: 'Санья, бухта Хайтан', lat: 18.3306, lng: 109.6500, type: 'beach', note: 'Дорогие курорты и большой магазин дьюти-фри', photo: 'poi/hainan/03-sanya-bukhta-khaytan.jpg', alt: 'Пирс в бухте Хайтан' },
      { name: 'Хайкоу', lat: 20.0440, lng: 110.1992, type: 'city', note: 'Столица острова и аэропорт', photo: 'poi/hainan/04-khaykou.jpg', alt: 'Старая улица с аркадами в Хайкоу' },
      { name: 'Остров Учжичжоу', lat: 18.3147, lng: 109.7611, type: 'beach', note: 'Остров-парк, дайвинг', photo: 'poi/hainan/05-ostrov-uchzhichzhou.jpg', alt: 'Белый пляж на острове Учжичжоу' },
      { name: 'Наньшань', lat: 18.2814, lng: 109.1989, type: 'culture', note: 'Буддийский парк со статуей Гуаньинь высотой 108 м', photo: 'poi/hainan/06-nanshan.jpg', alt: 'Статуя Гуаньинь в море у парка Наньшань' },
      { name: 'Янода', lat: 18.4591, lng: 109.6445, type: 'nature', note: 'Тропический лес в горах к северу от Саньи', photo: 'poi/hainan/07-yanoda.jpg', alt: 'Пруд и беседка в тропическом лесу Янода' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'egypt': {
    visited: false,
    center: { lat: 26.5, lng: 30.0, zoom: 5 },
    pois: [
      { name: 'Каир и Гиза', lat: 29.9773, lng: 31.1325, type: 'culture', note: 'Пирамиды Гизы, Сфинкс и Египетский музей', photo: 'poi/egypt/01-kair-i-giza.jpg', alt: 'Сфинкс и пирамида Хефрена в Гизе' },
      { name: 'Луксор', lat: 25.6872, lng: 32.6396, type: 'culture', note: 'Долина Царей и Карнакский храм', photo: 'poi/egypt/02-luksor.jpg', alt: 'Колоссы Мемнона в Луксоре и воздушные шары над ними' },
      { name: 'Асуан', lat: 24.0889, lng: 32.8998, type: 'culture', note: 'Храм Филе и Асуанская плотина', photo: 'poi/egypt/03-asuan.jpg', alt: 'Мечеть с двумя минаретами в Асуане' },
      { name: 'Абу-Симбел', lat: 22.3372, lng: 31.6258, type: 'culture', note: 'Скальные храмы Рамсеса II', photo: 'poi/egypt/04-abu-simbel.jpg', alt: 'Большой храм Рамсеса II в Абу-Симбеле' },
      { name: 'Хургада', lat: 27.2579, lng: 33.8116, type: 'beach', note: 'Главный курорт на Красном море', photo: 'poi/egypt/05-khurgada.jpg', alt: 'Рыбацкие лодки в гавани Хургады' },
      { name: 'Шарм-эль-Шейх', lat: 27.9158, lng: 34.3300, type: 'beach', note: 'Курорты подороже и бухта Наама-Бей', photo: 'poi/egypt/06-sharm-el-sheykh.jpg', alt: 'Красное море и белые отели Шарм-эль-Шейха' },
      { name: 'Дахаб', lat: 28.5000, lng: 34.5167, type: 'beach', note: 'Фридайвинг и Голубая дыра для дайверов', photo: 'poi/egypt/07-dakhab.jpg', alt: 'Бухта Дахаба с лодкой и кафе на берегу' },
      { name: 'Александрия', lat: 31.2001, lng: 29.9187, type: 'city', note: 'Город на Средиземном море и Александрийская библиотека', photo: 'poi/egypt/08-aleksandriya.jpg', alt: 'Городской пляж Александрии с зонтиками' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'south-korea': {
    visited: false,
    center: { lat: 36.5, lng: 127.8, zoom: 7 },
    pois: [
      { name: 'Сеул', lat: 37.5665, lng: 126.9780, type: 'city', note: 'Дворцы и районы Мёндон и Хондэ', photo: 'poi/south-korea/01-seul.jpg', alt: 'Павильон Кёнхверу во дворце Кёнбоккун в Сеуле' },
      { name: 'Пусан', lat: 35.1796, lng: 129.0756, type: 'beach', note: 'Пляж Хэундэ и арт-деревня Камчхон', photo: 'poi/south-korea/02-pusan.jpg', alt: 'Пляж Хэундэ в Пусане' },
      { name: 'Чеджу', lat: 33.4996, lng: 126.5312, type: 'nature', note: 'Вулканический остров с горой Халласан, объект ЮНЕСКО', photo: 'poi/south-korea/03-chedzhu.jpg', alt: 'Гора Сонсан-Ильчхульбон на Чеджу' },
      { name: 'Кёнджу', lat: 35.8562, lng: 129.2247, type: 'culture', note: 'Столица царства Силла, храм Пульгукса из списка ЮНЕСКО', photo: 'poi/south-korea/04-kendzhu.jpg', alt: 'Храм Пульгукса в Кёнджу' },
      { name: 'Соннисан / Сораксан', lat: 38.1191, lng: 128.4655, type: 'nature', note: 'Национальный парк, осенью — красные клёны', photo: 'poi/south-korea/05-sonnisan-soraksan.jpg', alt: 'Осенний лес и ручей в национальном парке' },
      { name: 'Демилитаризованная зона', lat: 38.0000, lng: 126.7000, type: 'culture', note: 'Поездка с гидом к границе с КНДР', photo: 'poi/south-korea/06-demilitarizovannaya-zona.jpg', alt: 'Синие домики переговоров в Пханмунджоме' },
      { name: 'Андон', lat: 36.5684, lng: 128.7294, type: 'culture', note: 'Традиционная деревня Хахве, объект ЮНЕСКО', photo: 'poi/south-korea/07-andon.jpg', alt: 'Деревня Хахве у реки' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'malaysia': {
    visited: false,
    center: { lat: 4.0, lng: 109.0, zoom: 6 },
    pois: [
      { name: 'Куала-Лумпур', lat: 3.1390, lng: 101.6869, type: 'city', note: 'Башни Петронас и пещеры Бату', photo: 'poi/malaysia/01-kuala-lumpur.jpg', alt: 'Башни Петронас в Куала-Лумпуре на закате' },
      { name: 'Пенанг (Джорджтаун)', lat: 5.4145, lng: 100.3292, type: 'culture', note: 'Старый город из списка ЮНЕСКО: стрит-арт и уличная еда', photo: 'poi/malaysia/02-penang-dzhordzhtaun.jpg', alt: 'Старые дома-лавки в Джорджтауне' },
      { name: 'Лангкави', lat: 6.3500, lng: 99.8000, type: 'beach', note: 'Остров без пошлин и подвесной мост Скай-Бридж', photo: 'poi/malaysia/03-langkavi.jpg', alt: 'Пляж Лангкави у поросшей лесом горы' },
      { name: 'Кота-Кинабалу', lat: 5.9788, lng: 116.0753, type: 'nature', note: 'Борнео и гора Кинабалу высотой 4095 м', photo: 'poi/malaysia/04-kota-kinabalu.jpg', alt: 'Гора Кинабалу над зелёными холмами' },
      { name: 'Кучинг', lat: 1.5535, lng: 110.3593, type: 'nature', note: 'Столица Саравака, орангутаны в центре Семенгох', photo: 'poi/malaysia/05-kuching.jpg', alt: 'Статуя кошки у китайских ворот в Кучинге' },
      { name: 'Малакка', lat: 2.1896, lng: 102.2501, type: 'culture', note: 'Колониальный центр, объект ЮНЕСКО', photo: 'poi/malaysia/06-malakka.jpg', alt: 'Красные колониальные здания в Малакке' },
      { name: 'Камеронское нагорье', lat: 4.4710, lng: 101.3760, type: 'nature', note: 'Чайные плантации и прохлада', photo: 'poi/malaysia/07-kameronskoe-nagore.jpg', alt: 'Чайные плантации Камеронского нагорья' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'morocco': {
    visited: false,
    center: { lat: 31.5, lng: -7.0, zoom: 6 },
    pois: [
      { name: 'Марракеш', lat: 31.6295, lng: -7.9811, type: 'culture', note: 'Площадь Джемаа-эль-Фна, рияды и квартал Меллах', photo: 'poi/morocco/01-marrakesh.jpg', alt: 'Лампы и фонари в лавке на рынке Марракеша' },
      { name: 'Фес', lat: 34.0181, lng: -5.0078, type: 'culture', note: 'Крупнейшая медина мира, объект ЮНЕСКО', photo: 'poi/morocco/02-fes.jpg', alt: 'Золотые ворота королевского дворца в Фесе' },
      { name: 'Шефшауэн', lat: 35.1714, lng: -5.2697, type: 'culture', note: 'Голубой город в горах Риф', photo: 'poi/morocco/03-shefshauen.jpg', alt: 'Голубая стена и дверь в переулке Шефшауэна' },
      { name: 'Сахара (Мерзуга)', lat: 31.1000, lng: -4.0000, type: 'nature', note: 'Дюны Эрг-Шебби и ночь в лагере в пустыне', photo: 'poi/morocco/04-sakhara-merzuga.jpg', alt: 'Караван верблюдов в дюнах Мерзуги на закате' },
      { name: 'Касабланка', lat: 33.5731, lng: -7.5898, type: 'city', note: 'Мечеть Хасана II и деловой центр страны', photo: 'poi/morocco/05-kasablanka.jpg', alt: 'Силуэт мечети Хасана II в Касабланке на закате' },
      { name: 'Эссауира', lat: 31.5125, lng: -9.7700, type: 'beach', note: 'Ветреный город на Атлантике, сёрфинг', photo: 'poi/morocco/06-essauira.jpg', alt: 'Городские ворота Эссауиры с пушкой' },
      { name: 'Атлас (Имлиль)', lat: 31.1372, lng: -7.9189, type: 'nature', note: 'Отсюда идут на Тубкаль (4167 м)', photo: 'poi/morocco/07-atlas-imlil.jpg', alt: 'Горная деревня в Атласе рядом с Имлилем' },
      { name: 'Айт-Бен-Хадду', lat: 31.0470, lng: -7.1314, type: 'culture', note: 'Глиняная крепость, объект ЮНЕСКО, здесь снимали «Игру престолов»', photo: 'poi/morocco/08-ayt-ben-khaddu.jpg', alt: 'Глиняная крепость Айт-Бен-Хадду' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'peru': {
    visited: false,
    center: { lat: -10.0, lng: -75.5, zoom: 6 },
    pois: [
      { name: 'Лима', lat: -12.0464, lng: -77.0428, type: 'city', note: 'Столица и аэропорт, район Мирафлорес', photo: 'poi/peru/01-lima.jpg', alt: 'Обрывы Мирафлореса и побережье Лимы' },
      { name: 'Куско', lat: -13.5320, lng: -71.9675, type: 'culture', note: 'Столица инков на высоте 3400 м, на акклиматизацию — два дня', photo: 'poi/peru/02-kusko.jpg', alt: 'Церковь на главной площади Куско' },
      { name: 'Мачу-Пикчу', lat: -13.1631, lng: -72.5450, type: 'culture', note: 'Объект ЮНЕСКО, билеты покупают за полгода', photo: 'poi/peru/03-machu-pikchu.jpg', alt: 'Мачу-Пикчу и гора Уайна-Пикчу' },
      { name: 'Священная долина', lat: -13.3193, lng: -72.0824, type: 'nature', note: 'Писак и Ольянтайтамбо', photo: 'poi/peru/04-svyashchennaya-dolina.jpg', alt: 'Священная долина инков с полями и посёлком' },
      { name: 'Радужная гора', lat: -13.8689, lng: -71.3017, type: 'nature', note: 'Высота 5200 м, поход из Куско', photo: 'poi/peru/05-raduzhnaya-gora.jpg', alt: 'Разноцветные склоны Радужной горы' },
      { name: 'Озеро Титикака (Пуно)', lat: -15.8402, lng: -70.0219, type: 'nature', note: 'Плавучие острова урос', photo: 'poi/peru/06-ozero-titikaka-puno.jpg', alt: 'Озеро Титикака у Пуно' },
      { name: 'Арекипа', lat: -16.4090, lng: -71.5375, type: 'culture', note: 'Белый город и каньон Колка с кондорами', photo: 'poi/peru/07-arekipa.jpg', alt: 'Собор Арекипы и вулкан Мисти' },
      { name: 'Линии Наски', lat: -14.7390, lng: -75.1300, type: 'culture', note: 'Видны только с самолёта, полёт около 40 минут', photo: 'poi/peru/08-linii-naski.jpg', alt: 'Геоглиф на склоне холма в Наске, вид с самолёта' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'bolivia': {
    visited: false,
    center: { lat: -16.5, lng: -65.0, zoom: 6 },
    pois: [
      { name: 'Ла-Пас', lat: -16.4897, lng: -68.1193, type: 'city', note: 'Столица на высоте 3650 м, городская канатная дорога', photo: 'poi/bolivia/01-la-pas.jpg', alt: 'Ла-Пас и заснеженная гора Ильимани' },
      { name: 'Уюни', lat: -20.1338, lng: -67.4891, type: 'nature', note: 'Солончак площадью 10 000 км², главная картинка страны', photo: 'poi/bolivia/02-uyuni.jpg', alt: 'Соляные холмики на солончаке Уюни' },
      { name: 'Сукре', lat: -19.0196, lng: -65.2619, type: 'culture', note: 'Белая столица, объект ЮНЕСКО', photo: 'poi/bolivia/03-sukre.jpg', alt: 'Белый монастырский двор в Сукре' },
      { name: 'Потоси', lat: -19.5722, lng: -65.7531, type: 'culture', note: 'Серебряные рудники на высоте 4090 м, объект ЮНЕСКО', photo: 'poi/bolivia/04-potosi.jpg', alt: 'Потоси и гора Серро-Рико' },
      { name: 'Копакабана', lat: -16.1668, lng: -69.0857, type: 'nature', note: 'Озеро Титикака и остров Солнца', photo: 'poi/bolivia/05-kopakabana.jpg', alt: 'Бухта Копакабаны на озере Титикака' },
      { name: 'Тиуанако', lat: -16.5547, lng: -68.6736, type: 'culture', note: 'Столица культуры, жившей до инков, объект ЮНЕСКО', photo: 'poi/bolivia/06-tiuanako.jpg', alt: 'Ворота Солнца в Тиуанако' },
      { name: 'Рурренабаке (Амазония)', lat: -14.4419, lng: -67.5293, type: 'nature', note: 'Национальный парк Мадиди, здесь водятся ягуары', photo: 'poi/bolivia/07-rurrenabake-amazoniya.jpg', alt: 'Река и покрытые лесом холмы у Рурренабаке' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'chile': {
    visited: false,
    center: { lat: -33.0, lng: -71.0, zoom: 4 },
    pois: [
      { name: 'Сантьяго', lat: -33.4489, lng: -70.6693, type: 'city', note: 'Столица, с улиц видны Анды', photo: 'poi/chile/01-santyago.jpg', alt: 'Небоскрёбы Сантьяго и зелёные холмы' },
      { name: 'Вальпараисо', lat: -33.0472, lng: -71.6127, type: 'culture', note: 'Холмы, фуникулёры и стрит-арт, объект ЮНЕСКО', photo: 'poi/chile/02-valparaiso.jpg', alt: 'Порт и холмы Вальпараисо' },
      { name: 'Атакама (Сан-Педро)', lat: -22.9098, lng: -68.1996, type: 'nature', note: 'Самая сухая пустыня мира и гейзеры', photo: 'poi/chile/03-atakama-san-pedro.jpg', alt: 'Долина Луны в пустыне Атакама' },
      { name: 'Торрес-дель-Пайне', lat: -50.9423, lng: -73.4068, type: 'nature', note: 'Патагония, маршрут W на 4–5 дней', photo: 'poi/chile/04-torres-del-payne.jpg', alt: 'Башни Торрес-дель-Пайне над ледниковым озером' },
      { name: 'Чилоэ', lat: -42.6166, lng: -73.7768, type: 'culture', note: 'Остров деревянных церквей из списка ЮНЕСКО', photo: 'poi/chile/05-chiloe.jpg', alt: 'Цветные дома на сваях на острове Чилоэ' },
      { name: 'Обсерватории Атакамы', lat: -24.6275, lng: -70.4044, type: 'nature', note: 'Параналь и ALMA: одно из лучших мест на Земле, чтобы смотреть на звёзды', photo: 'poi/chile/06-observatorii-atakamy.jpg', alt: 'Млечный Путь над обсерваторией в Атакаме' },
      { name: 'Пуэрто-Варас', lat: -41.3194, lng: -72.9856, type: 'nature', note: 'Озёрный край и вулкан Осорно', photo: 'poi/chile/07-puerto-varas.jpg', alt: 'Церковь Святого Сердца в Пуэрто-Варасе' },
      { name: 'Остров Пасхи', lat: -27.1127, lng: -109.3497, type: 'culture', note: 'Моаи, перелёт из Сантьяго около 5 часов', photo: 'poi/chile/08-ostrov-paskhi.jpg', alt: 'Моаи на острове Пасхи на закате' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'serbia': {
    visited: false,
    center: { lat: 44.0, lng: 21.0, zoom: 7 },
    pois: [
      { name: 'Белград', lat: 44.7866, lng: 20.4489, type: 'city', note: 'Крепость Калемегдан и улица Скадарлия', photo: 'poi/serbia/01-belgrad.jpg', alt: 'Стены крепости Калемегдан в Белграде осенью' },
      { name: 'Нови-Сад', lat: 45.2671, lng: 19.8335, type: 'city', note: 'Петроварадинская крепость, где проходит фестиваль Exit', photo: 'poi/serbia/02-novi-sad.jpg', alt: 'Петроварадинская крепость над Дунаем' },
      { name: 'Златибор', lat: 43.7286, lng: 19.7019, type: 'nature', note: 'Горный курорт: зимой лыжи, летом походы', photo: 'poi/serbia/03-zlatibor.jpg', alt: 'Лошади и красная скамейка на холме Златибора' },
      { name: 'Дрвенград (Мечавник)', lat: 43.8071, lng: 19.5081, type: 'culture', note: 'Деревня Кустурицы и узкоколейка «Шарганская восьмёрка»', photo: 'poi/serbia/04-drvengrad-mechavnik.jpg', alt: 'Деревянная церковь и колокольня в Дрвенграде' },
      { name: 'Студеница', lat: 43.4828, lng: 20.5375, type: 'culture', note: 'Православный монастырь, объект ЮНЕСКО', photo: 'poi/serbia/05-studenitsa.jpg', alt: 'Монастырь Студеница' },
      { name: 'Тара (нацпарк)', lat: 43.9176, lng: 19.4239, type: 'nature', note: 'Каньон Дрины и дикая природа', photo: 'poi/serbia/06-tara-natspark.jpg', alt: 'Излучина Дрины в национальном парке Тара' },
      { name: 'Ниш', lat: 43.3209, lng: 21.8954, type: 'culture', note: 'Родина императора Константина и Башня черепов', photo: 'poi/serbia/07-nish.jpg', alt: 'Ворота Нишской крепости' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'bali': {
    visited: false,
    center: { lat: -8.4095, lng: 115.1889, zoom: 9 },
    pois: [
      { name: 'Денпасар', lat: -8.6500, lng: 115.2167, type: 'city', note: 'Столица острова и аэропорт', photo: 'poi/bali/01-denpasar.jpg', alt: 'Храм Пура Джаганнатха в Денпасаре' },
      { name: 'Семиньяк', lat: -8.6900, lng: 115.1600, type: 'beach', note: 'Пляж подороже и закаты', photo: 'poi/bali/02-seminyak.jpg', alt: 'Зонтики на пляже Семиньяк на закате' },
      { name: 'Чангу', lat: -8.6478, lng: 115.1385, type: 'beach', note: 'Сёрфинг и удалёнщики', photo: 'poi/bali/03-changu.jpg', alt: 'Рисовое поле-терраса в Чангу' },
      { name: 'Убуд', lat: -8.5069, lng: 115.2625, type: 'culture', note: 'Столица искусств и рисовые террасы', photo: 'poi/bali/04-ubud.jpg', alt: 'Павильон дворца в Убуде' },
      { name: 'Улувату', lat: -8.8290, lng: 115.0850, type: 'beach', note: 'Скалы над океаном и храм Пура-Лухур', photo: 'poi/bali/05-uluvatu.jpg', alt: 'Бугенвиллея у храма Улувату' },
      { name: 'Нуса Пенида', lat: -8.7270, lng: 115.5450, type: 'nature', note: 'Пляж Келингкинг и дайвинг', photo: 'poi/bali/06-nusa-penida.jpg', alt: 'Скалы и бирюзовая вода у берега Нуса-Пениды' },
      { name: 'Мунду', lat: -8.2762, lng: 115.0383, type: 'nature', note: 'Север Бали, водопады', photo: 'poi/bali/07-mundu.jpg', alt: 'Рисовые поля на севере Бали на закате' },
      { name: 'Танах Лот', lat: -8.6212, lng: 115.0867, type: 'culture', note: 'Храм на скале в океане', photo: 'poi/bali/08-tanakh-lot.jpg', alt: 'Храм Танах Лот на скале в океане' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'uae': {
    visited: false,
    center: { lat: 24.9, lng: 54.5, zoom: 7 },
    pois: [
      { name: 'Дубай', lat: 25.2048, lng: 55.2708, type: 'city', note: 'Бурдж-Халифа, Дубай Молл и остров Пальма', photo: 'poi/uae/01-dubay.jpg', alt: 'Небоскрёбы Дубай-Марины' },
      { name: 'Абу-Даби', lat: 24.4539, lng: 54.3773, type: 'city', note: 'Мечеть шейха Зайда и Лувр Абу-Даби', photo: 'poi/uae/02-abu-dabi.jpg', alt: 'Силуэт мечети шейха Зайда на закате' },
      { name: 'Шарджа', lat: 25.3463, lng: 55.4209, type: 'culture', note: 'Культурная столица страны, музеи', photo: 'poi/uae/03-shardzha.jpg', alt: 'Старое деревянное судно на берегу в Шардже' },
      { name: 'Аль-Айн', lat: 24.2075, lng: 55.7447, type: 'nature', note: 'Оазис и гора Джебель-Хафит', photo: 'poi/uae/04-al-ayn.jpg', alt: 'Дорога на гору Джебель-Хафит' },
      { name: 'Рас-эль-Хайма', lat: 25.7895, lng: 55.9432, type: 'nature', note: 'Гора Джебель-Джайс и один из самых длинных зиплайнов в мире', photo: 'poi/uae/05-ras-el-khayma.jpg', alt: 'Горы Джебель-Джайс и серпантин' },
      { name: 'Фуджейра', lat: 25.1288, lng: 56.3265, type: 'beach', note: 'Восточный берег, дайвинг в Индийском океане', photo: 'poi/uae/06-fudzheyra.jpg', alt: 'Мечеть шейха Зайда в Фуджейре вечером' },
      { name: 'Хатта', lat: 24.7980, lng: 56.1297, type: 'nature', note: 'Горы Хаджар и каяки на озере', photo: 'poi/uae/07-khatta.jpg', alt: 'Горы Хаджар и озеро у Хатты' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'vietnam': {
    visited: false,
    center: { lat: 16.0, lng: 107.5, zoom: 5 },
    pois: [
      { name: 'Ханой', lat: 21.0285, lng: 105.8542, type: 'city', note: 'Старый квартал и озеро Хоанкьем', photo: 'poi/vietnam/01-khanoy.jpg', alt: 'Пагода на одном столбе в Ханое' },
      { name: 'Халонг', lat: 20.9101, lng: 107.1839, type: 'nature', note: 'Известняковые острова и круизы по бухте', photo: 'poi/vietnam/02-khalong.jpg', alt: 'Скалы бухты Халонг в дымке' },
      { name: 'Сапа', lat: 22.3364, lng: 103.8438, type: 'nature', note: 'Рисовые террасы и треккинг', photo: 'poi/vietnam/03-sapa.jpg', alt: 'Рисовые террасы Сапы' },
      { name: 'Хюэ', lat: 16.4637, lng: 107.5909, type: 'culture', note: 'Императорская столица и цитадель', photo: 'poi/vietnam/04-khyue.jpg', alt: 'Мост Чыонгтьен и лодка на реке Ароматов в Хюэ' },
      { name: 'Хойан', lat: 15.8801, lng: 108.3380, type: 'culture', note: 'Старый город, фонарики и пошив одежды', photo: 'poi/vietnam/05-khoyan.jpg', alt: 'Старый город Хойана с фонарями вечером' },
      { name: 'Дананг', lat: 16.0544, lng: 108.2022, type: 'beach', note: 'Пляж Микхе и Мраморные горы', photo: 'poi/vietnam/06-danang.jpg', alt: 'Мост Дракона в Дананге ночью' },
      { name: 'Нячанг', lat: 12.2388, lng: 109.1967, type: 'beach', note: 'Курорт, где много туристов из России, дайвинг', photo: 'poi/vietnam/07-nyachang.jpg', alt: 'Пальмы и зонтики на пляже Нячанга' },
      { name: 'Хошимин', lat: 10.8231, lng: 106.6297, type: 'city', note: 'Бывший Сайгон, рядом тоннели Кути', photo: 'poi/vietnam/08-khoshimin.jpg', alt: 'Небоскрёбы Хошимина ночью' },
      { name: 'Фукуок', lat: 10.2899, lng: 103.9840, type: 'beach', note: 'Остров с дорогими курортами', photo: 'poi/vietnam/09-fukuok.jpg', alt: 'Рыбацкая лодка у Фукуока на закате' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'armenia': {
    visited: false,
    center: { lat: 40.3, lng: 45.0, zoom: 8 },
    pois: [
      { name: 'Ереван', lat: 40.1792, lng: 44.4991, type: 'city', note: 'Каскад, площадь Республики и музей Параджанова', photo: 'poi/armenia/01-erevan.jpg', alt: 'Ереван и гора Арарат' },
      { name: 'Гарни', lat: 40.1129, lng: 44.7311, type: 'culture', note: 'Античный храм I века', photo: 'poi/armenia/02-garni.jpg', alt: 'Храм Гарни над ущельем' },
      { name: 'Гегард', lat: 40.1419, lng: 44.8210, type: 'culture', note: 'Пещерный монастырь, объект ЮНЕСКО', photo: 'poi/armenia/03-gegard.jpg', alt: 'Монастырь Гегард в скалах' },
      { name: 'Севан', lat: 40.5697, lng: 45.0146, type: 'nature', note: 'Высокогорное озеро и монастырь Севанаванк', photo: 'poi/armenia/04-sevan.jpg', alt: 'Семинария монастыря Севанаванк над озером Севан' },
      { name: 'Дилижан', lat: 40.7415, lng: 44.8625, type: 'nature', note: 'Лесной курорт, «армянская Швейцария»', photo: 'poi/armenia/05-dilizhan.jpg', alt: 'Монастырь Агарцин в лесу у Дилижана' },
      { name: 'Хор Вирап', lat: 39.8788, lng: 44.5783, type: 'culture', note: 'Древний монастырь с видом на Арарат', photo: 'poi/armenia/06-khor-virap.jpg', alt: 'Монастырь Хор Вирап и Арарат' },
      { name: 'Татев', lat: 39.3791, lng: 46.2502, type: 'culture', note: 'Монастырь и канатная дорога «Крылья Татева»', photo: 'poi/armenia/07-tatev.jpg', alt: 'Монастырь Татев на краю ущелья' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'sri-lanka': {
    visited: false,
    center: { lat: 7.5, lng: 80.7, zoom: 7 },
    pois: [
      { name: 'Коломбо', lat: 6.9271, lng: 79.8612, type: 'city', note: 'Столица, набережная Галле-Фейс и аэропорт', photo: 'poi/sri-lanka/01-kolombo.jpg', alt: 'Старое здание парламента в Коломбо вечером' },
      { name: 'Сигирия', lat: 7.9569, lng: 80.7600, type: 'culture', note: 'Скала-крепость с львиными лапами, объект ЮНЕСКО', photo: 'poi/sri-lanka/02-sigiriya.jpg', alt: 'Скала Сигирия среди джунглей' },
      { name: 'Канди', lat: 7.2906, lng: 80.6337, type: 'culture', note: 'Храм Зуба Будды и праздник Перахера', photo: 'poi/sri-lanka/03-kandi.jpg', alt: 'Храм Зуба Будды у озера в Канди' },
      { name: 'Элла', lat: 6.8716, lng: 81.0463, type: 'nature', note: 'Девятиарочный мост и чайные плантации', photo: 'poi/sri-lanka/04-ella.jpg', alt: 'Поезд на Девятиарочном мосту в Элле' },
      { name: 'Унаватуна', lat: 6.0125, lng: 80.2491, type: 'beach', note: 'Пляж рядом с Галле, сёрфинг', photo: 'poi/sri-lanka/05-unavatuna.jpg', alt: 'Лодка и зонтик на пляже Унаватуны' },
      { name: 'Мирисса', lat: 5.9485, lng: 80.4571, type: 'beach', note: 'Киты с декабря по апрель', photo: 'poi/sri-lanka/06-mirissa.jpg', alt: 'Пляж Мириссы с пальмами' },
      { name: 'Анурадхапура', lat: 8.3114, lng: 80.4037, type: 'culture', note: 'Древняя столица со ступами, объект ЮНЕСКО', photo: 'poi/sri-lanka/07-anuradkhapura.jpg', alt: 'Ступа Руванвелисая в Анурадхапуре' },
      { name: 'Яла (нацпарк)', lat: 6.3700, lng: 81.5167, type: 'nature', note: 'Сафари: леопарды и слоны', photo: 'poi/sri-lanka/08-yala-natspark.jpg', alt: 'Слон в национальном парке Яла' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'maldives': {
    visited: false,
    center: { lat: 3.2, lng: 73.2, zoom: 7 },
    pois: [
      { name: 'Мале', lat: 4.1755, lng: 73.5093, type: 'city', note: 'Столица и международный аэропорт Велана', photo: 'poi/maldives/01-male.jpg', alt: 'Мале с воздуха: город на острове и лагуна' },
      { name: 'Маафуши', lat: 3.9425, lng: 73.4906, type: 'beach', note: 'Местный остров с гестхаусами, вариант подешевле', photo: 'poi/maldives/02-maafushi.jpg', alt: 'Пляж с пальмами и бирюзовой водой на Маафуши' },
      { name: 'Атолл Северный Мале', lat: 4.4000, lng: 73.5000, type: 'beach', note: 'Дорогие курорты, например One&Only и W Maldives', photo: 'poi/maldives/03-atoll-severnyy-male.jpg', alt: 'Остров с пальмами в атолле Каафу' },
      { name: 'Атолл Южный Ари', lat: 3.5000, lng: 72.8500, type: 'nature', note: 'Китовые акулы, манты и дайвинг мирового уровня', photo: 'poi/maldives/04-atoll-yuzhnyy-ari.jpg', alt: 'Китовая акула под водой у атолла Южный Ари' },
      { name: 'Атолл Баа', lat: 5.1500, lng: 73.0667, type: 'nature', note: 'Манты в бухте Ханифару с мая по ноябрь, биосферный резерват ЮНЕСКО', photo: 'poi/maldives/05-atoll-baa.jpg', alt: 'Острова атолла Баа с высоты' },
      { name: 'Гаафу-Алифу', lat: 0.3000, lng: 73.4000, type: 'beach', note: 'Южный атолл, дикий дайвинг', photo: 'poi/maldives/06-gaafu-alifu.jpg', alt: 'Лагуна и виллы на воде в атолле Гаафу-Алифу' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'kenya': {
    visited: false,
    center: { lat: 0.5, lng: 37.5, zoom: 6 },
    pois: [
      { name: 'Найроби', lat: -1.2864, lng: 36.8172, type: 'city', note: 'Столица, национальный парк прямо в черте города', photo: 'poi/kenya/01-nayrobi.jpg', alt: 'Буйвол в национальном парке Найроби на фоне небоскрёбов' },
      { name: 'Масаи-Мара', lat: -1.5036, lng: 35.1430, type: 'nature', note: 'Большая пятёрка и миграция гну с июля по октябрь', photo: 'poi/kenya/02-masai-mara.jpg', alt: 'Жираф в Масаи-Маре' },
      { name: 'Амбосели', lat: -2.6450, lng: 37.2606, type: 'nature', note: 'Слоны на фоне Килиманджаро', photo: 'poi/kenya/03-amboseli.jpg', alt: 'Слоны в Амбосели на фоне Килиманджаро' },
      { name: 'Цаво', lat: -2.9667, lng: 38.4667, type: 'nature', note: 'Крупнейший парк Кении, красные слоны', photo: 'poi/kenya/04-tsavo.jpg', alt: 'Красный слон в парке Цаво' },
      { name: 'Озеро Накуру', lat: -0.3700, lng: 36.0830, type: 'nature', note: 'Розовые фламинго и носороги', photo: 'poi/kenya/05-ozero-nakuru.jpg', alt: 'Зебры у озера Накуру' },
      { name: 'Ламу', lat: -2.2717, lng: 40.9020, type: 'culture', note: 'Город суахили, объект ЮНЕСКО', photo: 'poi/kenya/06-lamu.jpg', alt: 'Мечеть с зелёным куполом в Ламу' },
      { name: 'Диани-Бич', lat: -4.3000, lng: 39.5833, type: 'beach', note: 'Главный курорт на Индийском океане', photo: 'poi/kenya/07-diani-bich.jpg', alt: 'Пляж Диани вечером' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'mexico': {
    visited: false,
    center: { lat: 23.5, lng: -102.0, zoom: 5 },
    pois: [
      { name: 'Мехико', lat: 19.4326, lng: -99.1332, type: 'city', note: 'Столица, площадь Сокало, рядом Теотиуакан', photo: 'poi/mexico/01-mekhiko.jpg', alt: 'Дворец изящных искусств в Мехико' },
      { name: 'Канкун', lat: 21.1619, lng: -86.8515, type: 'beach', note: 'Курорт «всё включено» на Карибском море', photo: 'poi/mexico/02-kankun.jpg', alt: 'Белый песок и бирюзовое море в Канкуне' },
      { name: 'Плайя-дель-Кармен', lat: 20.6296, lng: -87.0739, type: 'beach', note: 'Пятая авеню, сеноты, до Тулума час', photo: 'poi/mexico/03-playya-del-karmen.jpg', alt: 'Пляж Плайя-дель-Кармен' },
      { name: 'Тулум', lat: 20.2114, lng: -87.4654, type: 'culture', note: 'Руины майя на скале над пляжем', photo: 'poi/mexico/04-tulum.jpg', alt: 'Руины Тулума на скале над морем' },
      { name: 'Чичен-Ица', lat: 20.6843, lng: -88.5678, type: 'culture', note: 'Пирамида Кукулькана, объект ЮНЕСКО', photo: 'poi/mexico/05-chichen-itsa.jpg', alt: 'Пирамида Кукулькана в Чичен-Ице' },
      { name: 'Оахака', lat: 17.0732, lng: -96.7266, type: 'culture', note: 'Мескаль, День мёртвых и Монте-Альбан', photo: 'poi/mexico/06-oakhaka.jpg', alt: 'Церковь Санто-Доминго в Оахаке' },
      { name: 'Пуэрто-Вальярта', lat: 20.6534, lng: -105.2253, type: 'beach', note: 'Курорт на Тихом океане', photo: 'poi/mexico/07-puerto-valyarta.jpg', alt: 'Набережная Пуэрто-Вальярты с пальмами' },
      { name: 'Сан-Кристобаль', lat: 16.7370, lng: -92.6376, type: 'nature', note: 'Штат Чьяпас, каньон Сумидеро', photo: 'poi/mexico/08-san-kristobal.jpg', alt: 'Цветные дома Сан-Кристобаля и горы' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'cuba': {
    visited: false,
    center: { lat: 21.5, lng: -77.8, zoom: 6 },
    pois: [
      { name: 'Гавана', lat: 23.1136, lng: -82.3666, type: 'city', note: 'Старая Гавана из списка ЮНЕСКО и набережная Малекон', photo: 'poi/cuba/01-gavana.jpg', alt: 'Старые машины на набережной Малекон в Гаване' },
      { name: 'Варадеро', lat: 23.1394, lng: -81.2868, type: 'beach', note: 'Главный пляжный курорт', photo: 'poi/cuba/02-varadero.jpg', alt: 'Пляж Варадеро' },
      { name: 'Тринидад', lat: 21.8045, lng: -79.9846, type: 'culture', note: 'Колониальный город, объект ЮНЕСКО', photo: 'poi/cuba/03-trinidad.jpg', alt: 'Главная площадь Тринидада с пальмами' },
      { name: 'Виньялес', lat: 22.6168, lng: -83.7060, type: 'nature', note: 'Долина с холмами-моготе и табачные плантации', photo: 'poi/cuba/04-vinyales.jpg', alt: 'Старый автомобиль в долине Виньялес' },
      { name: 'Сантьяго-де-Куба', lat: 20.0247, lng: -75.8219, type: 'culture', note: 'Столица востока острова, колыбель революции', photo: 'poi/cuba/05-santyago-de-kuba.jpg', alt: 'Кафедральный собор Сантьяго-де-Кубы' },
      { name: 'Кайо-Коко', lat: 22.5132, lng: -78.4053, type: 'beach', note: 'Остров с курортами «всё включено»', photo: 'poi/cuba/06-kayo-koko.jpg', alt: 'Бирюзовое море у Кайо-Коко' },
      { name: 'Сьенфуэгос', lat: 22.1499, lng: -80.4364, type: 'culture', note: 'Французская колониальная архитектура, объект ЮНЕСКО', photo: 'poi/cuba/07-senfuegos.jpg', alt: 'Дворец Валье в Сьенфуэгосе у залива' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'italy-north': {
    visited: false,
    center: { lat: 45.5, lng: 11.0, zoom: 7 },
    pois: [
      { name: 'Венеция', lat: 45.4408, lng: 12.3155, type: 'culture', note: 'Лагуна, гондолы и площадь Сан-Марко', photo: 'poi/italy-north/01-venetsiya.jpg', alt: 'Лодки с парусами на канале в Венеции' },
      { name: 'Милан', lat: 45.4642, lng: 9.1900, type: 'city', note: 'Мода, Дуомо и «Тайная вечеря»', photo: 'poi/italy-north/02-milan.jpg', alt: 'Миланский собор' },
      { name: 'Озеро Комо', lat: 45.9985, lng: 9.2580, type: 'nature', note: 'Виллы и Белладжо', photo: 'poi/italy-north/03-ozero-komo.jpg', alt: 'Озеро Комо вечером с высоты' },
      { name: 'Озеро Гарда', lat: 45.6385, lng: 10.6418, type: 'nature', note: 'Крупнейшее озеро Италии, виндсёрфинг', photo: 'poi/italy-north/04-ozero-garda.jpg', alt: 'Замок Скалигеров в Сирмионе на озере Гарда' },
      { name: 'Доломиты', lat: 46.4102, lng: 11.8440, type: 'nature', note: 'Объект ЮНЕСКО: походы летом, лыжи зимой', photo: 'poi/italy-north/05-dolomity.jpg', alt: 'Доломиты в вечернем свете' },
      { name: 'Верона', lat: 45.4384, lng: 10.9916, type: 'culture', note: 'Дом Джульетты и римская арена', photo: 'poi/italy-north/06-verona.jpg', alt: 'Мост Понте-Пьетра в Вероне' },
      { name: 'Чинкве-Терре', lat: 44.1227, lng: 9.7173, type: 'beach', note: 'Пять рыбацких деревень, объект ЮНЕСКО', photo: 'poi/italy-north/07-chinkve-terre.jpg', alt: 'Деревня Чинкве-Терре на скале над морем' },
      { name: 'Турин', lat: 45.0703, lng: 7.6869, type: 'city', note: 'Столица Пьемонта, шоколад и барокко', photo: 'poi/italy-north/08-turin.jpg', alt: 'Моле-Антонеллиана и Альпы над Турином вечером' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'italy-south': {
    visited: false,
    center: { lat: 40.5, lng: 14.5, zoom: 6 },
    pois: [
      { name: 'Рим', lat: 41.9028, lng: 12.4964, type: 'city', note: 'Колизей, Ватикан и Пантеон', photo: 'poi/italy-south/01-rim.jpg', alt: 'Колизей вечером' },
      { name: 'Флоренция', lat: 43.7696, lng: 11.2558, type: 'culture', note: 'Уффици и Понте-Веккьо', photo: 'poi/italy-south/02-florentsiya.jpg', alt: 'Понте-Веккьо во Флоренции вечером' },
      { name: 'Тоскана (Сиена)', lat: 43.3188, lng: 11.3308, type: 'nature', note: 'Кипарисы, винодельни, Сан-Джиминьяно', photo: 'poi/italy-south/03-toskana-siena.jpg', alt: 'Площадь Пьяцца-дель-Кампо в Сиене' },
      { name: 'Амальфи', lat: 40.6346, lng: 14.6027, type: 'beach', note: 'Побережье из списка ЮНЕСКО и Позитано', photo: 'poi/italy-south/04-amalfi.jpg', alt: 'Амальфи с моря' },
      { name: 'Помпеи', lat: 40.7484, lng: 14.4854, type: 'culture', note: 'Античный город, засыпанный Везувием', photo: 'poi/italy-south/05-pompei.jpg', alt: 'Колонны форума в Помпеях' },
      { name: 'Капри', lat: 40.5479, lng: 14.2426, type: 'beach', note: 'Остров и Голубой грот', photo: 'poi/italy-south/06-kapri.jpg', alt: 'Скалы Фаральони у Капри' },
      { name: 'Сицилия (Палермо)', lat: 38.1157, lng: 13.3615, type: 'culture', note: 'Арабо-норманнское наследие и Этна', photo: 'poi/italy-south/07-sitsiliya-palermo.jpg', alt: 'Площадь Куаттро-Канти в Палермо' },
      { name: 'Сардиния (Кальяри)', lat: 39.2238, lng: 9.1217, type: 'beach', note: 'Белые пляжи и Изумрудный берег', photo: 'poi/italy-south/08-sardiniya-kalyari.jpg', alt: 'Пляж у Кальяри на Сардинии' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'spain': {
    visited: false,
    center: { lat: 40.4, lng: -3.7, zoom: 6 },
    pois: [
      { name: 'Мадрид', lat: 40.4168, lng: -3.7038, type: 'city', note: 'Прадо, парк Ретиро и тапас', photo: 'poi/spain/01-madrid.jpg', alt: 'Королевский дворец в Мадриде' },
      { name: 'Барселона', lat: 41.3851, lng: 2.1734, type: 'city', note: 'Гауди, Готический квартал и пляж', photo: 'poi/spain/02-barselona.jpg', alt: 'Башни Саграда Фамилии в Барселоне' },
      { name: 'Севилья', lat: 37.3891, lng: -5.9845, type: 'culture', note: 'Алькасар, фламенко и Страстная неделя', photo: 'poi/spain/03-sevilya.jpg', alt: 'Площадь Испании в Севилье' },
      { name: 'Гранада', lat: 37.1773, lng: -3.5986, type: 'culture', note: 'Альгамбра — мавританская архитектура, объект ЮНЕСКО', photo: 'poi/spain/04-granada.jpg', alt: 'Альгамбра и заснеженная Сьерра-Невада' },
      { name: 'Сан-Себастьян', lat: 43.3183, lng: -1.9812, type: 'food', note: 'Столица пинчос и пляж Ла-Конча', photo: 'poi/spain/05-san-sebastyan.jpg', alt: 'Бухта Ла-Конча в Сан-Себастьяне' },
      { name: 'Валенсия', lat: 39.4699, lng: -0.3763, type: 'city', note: 'Паэлья, праздник Фальяс и Город искусств и наук', photo: 'poi/spain/06-valensiya.jpg', alt: 'Город искусств и наук в Валенсии на закате' },
      { name: 'Тенерифе', lat: 28.2916, lng: -16.6291, type: 'beach', note: 'Вулкан Тейде и пляжи круглый год', photo: 'poi/spain/07-tenerife.jpg', alt: 'Вулкан Тейде на Тенерифе' },
      { name: 'Малага', lat: 36.7213, lng: -4.4214, type: 'beach', note: 'Коста-дель-Соль и музей Пикассо', photo: 'poi/spain/08-malaga.jpg', alt: 'Крепость Алькасаба в Малаге' }
    ],
    sources: [{ name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' }]
  },

  'turkey': {
    visited: false,
    center: { lat: 39.0, lng: 35.0, zoom: 6 },
    pois: [
      { name: 'Стамбул', lat: 41.0082, lng: 28.9784, type: 'city', note: 'Айя-София, Топкапы и Босфор', photo: 'poi/turkey/01-stambul.jpg', alt: 'Айя-София в Стамбуле' },
      { name: 'Анталья', lat: 36.8969, lng: 30.7133, type: 'beach', note: 'Главный курорт: пляжи и старый город', photo: 'poi/turkey/02-antalya.jpg', alt: 'Старая гавань Антальи' },
      { name: 'Каппадокия', lat: 38.6431, lng: 34.8289, type: 'nature', note: 'Воздушные шары на рассвете', photo: 'poi/turkey/03-kappadokiya.jpg', alt: 'Воздушный шар над Каппадокией' },
      { name: 'Памуккале', lat: 37.9137, lng: 29.1187, type: 'nature', note: 'Белые травертины и Иераполис', photo: 'poi/turkey/04-pamukkale.jpg', alt: 'Белые травертины Памуккале' },
      { name: 'Эфес', lat: 37.9412, lng: 27.3416, type: 'culture', note: 'Античный город и библиотека Цельса', photo: 'poi/turkey/05-efes.jpg', alt: 'Библиотека Цельса в Эфесе' },
      { name: 'Бодрум', lat: 37.0344, lng: 27.4305, type: 'beach', note: 'Дорогой курорт на Эгейском море', photo: 'poi/turkey/06-bodrum.jpg', alt: 'Бирюзовая вода и скалы у Бодрума' },
      { name: 'Анкара', lat: 39.9334, lng: 32.8597, type: 'city', note: 'Столица, мавзолей Ататюрка', photo: 'poi/turkey/07-ankara.jpg', alt: 'Мавзолей Ататюрка в Анкаре' }
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
      { name: 'Бангкок', lat: 13.7563, lng: 100.5018, type: 'city', note: 'Большой дворец и плавучие рынки', photo: 'poi/thailand/01-bangkok.jpg', alt: 'Большой дворец в Бангкоке' },
      { name: 'Пхукет', lat: 7.8804, lng: 98.3923, type: 'beach', note: 'Самый большой остров: пляжи и ночная жизнь', photo: 'poi/thailand/02-pkhuket.jpg', alt: 'Лодки с длинным хвостом у пляжа Пхукета' },
      { name: 'Чиангмай', lat: 18.7883, lng: 98.9853, type: 'nature', note: 'Горы, храмы и слоновьи парки', photo: 'poi/thailand/03-chiangmay.jpg', alt: 'Храм с белой статуей в Чиангмае' },
      { name: 'Краби', lat: 8.0863, lng: 98.9063, type: 'beach', note: 'Известняковые скалы и Райли', photo: 'poi/thailand/04-krabi.jpg', alt: 'Скалы у пляжа Райли в Краби' },
      { name: 'Ко Самуи', lat: 9.5018, lng: 100.0136, type: 'beach', note: 'Пляжи и морской парк Ангтонг', photo: 'poi/thailand/05-ko-samui.jpg', alt: 'Лодки у берега Ко Самуи' },
      { name: 'Аютайя', lat: 14.3692, lng: 100.5877, type: 'culture', note: 'Древняя столица, руины храмов', photo: 'poi/thailand/06-ayutayya.jpg', alt: 'Руины храма в Аютайе' },
      { name: 'Паттайя', lat: 12.9236, lng: 100.8825, type: 'beach', note: 'Ближайший к Бангкоку пляжный курорт', photo: 'poi/thailand/07-pattayya.jpg', alt: 'Катера на фоне небоскрёбов Паттайи' }
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
      { name: 'Тбилиси', lat: 41.7151, lng: 44.8271, type: 'city', note: 'Старый город, серные бани и крепость Нарикала', photo: 'poi/georgia/01-tbilisi.jpg', alt: 'Старый Тбилиси и крепость Нарикала' },
      { name: 'Батуми', lat: 41.6168, lng: 41.6367, type: 'beach', note: 'Морской курорт и современная архитектура', photo: 'poi/georgia/02-batumi.jpg', alt: 'Алфавитная башня и бульвар Батуми' },
      { name: 'Казбеги', lat: 42.6587, lng: 44.6470, type: 'nature', note: 'Церковь Гергети и гора Казбек (5047 м)', photo: 'poi/georgia/03-kazbegi.jpg', alt: 'Гора Казбек над Степанцминдой' },
      { name: 'Сванетия', lat: 43.0028, lng: 42.7167, type: 'nature', note: 'Местиа, башни Чажаши в Ушгули и треккинг', photo: 'poi/georgia/04-svanetiya.jpg', alt: 'Сванские башни в Ушгули' },
      { name: 'Мцхета', lat: 41.8458, lng: 44.7203, type: 'culture', note: 'Древняя столица и собор Светицховели', photo: 'poi/georgia/05-mtskheta.jpg', alt: 'Монастырь Самтавро в Мцхете' },
      { name: 'Кахетия', lat: 41.6500, lng: 45.6900, type: 'food', note: 'Винный край: Сигнахи и Телави', photo: 'poi/georgia/06-kakhetiya.jpg', alt: 'Красные крыши Сигнахи и Алазанская долина' },
      { name: 'Боржоми', lat: 41.8404, lng: 43.3782, type: 'nature', note: 'Минеральные воды и национальный парк', photo: 'poi/georgia/07-borzhomi.jpg', alt: 'Вокзал в Боржоми' }
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
      { name: 'Токио', lat: 35.6762, lng: 139.6503, type: 'city', note: 'Начало «золотого маршрута» по Японии', photo: 'poi/japan/01-tokio.jpg', alt: 'Пагода храма Сэнсо-дзи в Токио' },
      { name: 'Хаконе', lat: 35.2324, lng: 139.1069, type: 'nature', note: 'Онсэны и вид на Фудзи', photo: 'poi/japan/02-khakone.jpg', alt: 'Тории на озере Аси и Фудзи' },
      { name: 'Киото', lat: 35.0116, lng: 135.7681, type: 'city', note: 'Храмы, гейши и осенние клёны', photo: 'poi/japan/03-kioto.jpg', alt: 'Пагода в Киото среди осенних клёнов' },
      { name: 'Осака', lat: 34.6937, lng: 135.5023, type: 'city', note: 'Еда и такояки', photo: 'poi/japan/04-osaka.jpg', alt: 'Замок Осаки и небоскрёбы' },
      { name: 'Нара', lat: 34.6851, lng: 135.8048, type: 'culture', note: 'Олени и древняя столица', photo: 'poi/japan/05-nara.jpg', alt: 'Олень в парке Нары' },
      { name: 'Фудзи', lat: 35.3606, lng: 138.7274, type: 'nature', note: 'Восхождение с 1 июля по 10 сентября', photo: 'poi/japan/06-fudzi.jpg', alt: 'Пагода Тюрэйто и Фудзи осенью' },
      { name: 'Хиросима', lat: 34.3853, lng: 132.4553, type: 'culture', note: 'Мемориал мира и остров Миядзима', photo: 'poi/japan/07-khirosima.jpg', alt: 'Купол Гэнбаку в Хиросиме' },
      { name: 'Никко', lat: 36.7197, lng: 139.6982, type: 'nature', note: 'Храмы и водопад Кэгон', photo: 'poi/japan/08-nikko.jpg', alt: 'Мост Синкё в Никко осенью' }
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
