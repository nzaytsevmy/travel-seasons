// Кадры страницы страны по слотам макета Омана: широкий кадр между разделами
// (после событий по месяцам) и три кадра в разделе въезда — высокий слева, два
// в столбик справа. Подпись «Фотографии: …» внизу страницы собирается из тех же
// записей о лицензии.
//
// ⛔ file — путь от src/content/blog/_images/. У чужого кадра обязана быть запись
//    о лицензии с автором в _credits.json его папки, у своего — статус own в
//    _images/_provenance.json. Это стережёт проверка происхождения кадров.
// ⛔ Подпись описывает то, что НА кадре, без сезона и погоды, которых на нём не
//    видно («трава по колено и туман» под сухим склоном — Оман, 09.09.2026).
// ⛔ Сюжет обложки страны и кадры гайда (поле photos в country-guides.js) не
//    повторять: у Турции Олюдениз уже стоит своим кадром в «Зачем ехать».
// ⛔ Каждый кадр отобран глазами по контактному листу, автоматом отсеяны только
//    лицензия, ориентация и размер.
export const COUNTRY_PHOTOS = {
  turkey: {
    wide: { file: 'hub-turkey/lycian-way-kas.jpg', alt: 'Скалистый берег у Каша на Ликийской тропе, море и острова на горизонте', caption: 'Ликийская тропа у Каша: скалистый берег и острова.' },
    practice: [
      { file: 'hub-turkey/hagia-sophia.jpg', alt: 'Айя-София в Стамбуле: купол и минареты над садом', caption: 'Айя-София в Стамбуле.' },
      { file: 'hub-turkey/pamukkale.jpg', alt: 'Белые известковые террасы Памуккале под синим небом', caption: 'Травертины Памуккале: белые известковые террасы.' },
      { file: 'turkey-own/beach.jpg', alt: 'Пляж сверху: ровные ряды зонтиков и бирюзовая вода', caption: 'Пляж сверху: ряды зонтиков у бирюзовой воды.' },
    ],
  },
  georgia: {
    wide: { file: 'georgia-longread/ushguli.jpg', alt: 'Ушгули в Сванетии: каменная сванская башня в зелёной долине под горами', caption: 'Ушгули в Сванетии: сванская башня в долине под горами.' },
    practice: [
      { file: 'georgia-longread/tbilisi_old.jpg', alt: 'Улица старого Тбилиси: указатели, кованые решётки на окнах и цветы', caption: 'Улица в старом Тбилиси.' },
      { file: 'georgia-longread/batumi_boulevard.jpg', alt: 'Приморский бульвар в Батуми: маяк, пальмы и море', caption: 'Приморский бульвар в Батуми.' },
      { file: 'georgia-longread/khinkali.jpg', alt: 'Хачапури и бокал красного вина на столе в тбилисском кафе', caption: 'Хачапури и вино в тбилисском кафе.' },
    ],
  },
  thailand: {
    wide: { file: 'hub-thailand/phi-phi-don.jpg', alt: 'Белый пляж и бирюзовая вода на острове Пхи-Пхи-Дон, известняковые скалы вдали', caption: 'Пхи-Пхи-Дон: белый песок, мелкая бирюзовая вода и известняковые скалы.' },
    practice: [
      { file: 'thailand-own/yaowarat.jpg', alt: 'Улица Яоварата ночью: неоновые вывески китайского квартала Бангкока', caption: 'Яоварат, китайский квартал Бангкока, ночью.' },
      { file: 'hub-thailand/doi-suthep.jpg', alt: 'Золотая ступа храма Дойсутхеп в Чиангмае', caption: 'Храм Дойсутхеп над Чиангмаем.' },
      { file: 'phuket-own/samui.jpg', alt: 'Песчаный пляж с пальмами на Самуи', caption: 'Пляж на Самуи.' },
    ],
  },
  egypt: {
    wide: { file: 'hub-egypt/ras-mohammed.jpg', alt: 'Бухта в заповеднике Рас-Мохаммед: бирюзовая вода и песчаный берег пустыни', caption: 'Заповедник Рас-Мохаммед у Шарм-эль-Шейха: пустыня выходит прямо к рифу.' },
    practice: [
      { file: 'hub-egypt/karnak.jpg', alt: 'Сфинксы с головами баранов у пилона Карнакского храма', caption: 'Аллея сфинксов с головами баранов в Карнаке, Луксор.' },
      { file: 'egypt-2026/redsea-turtle.jpg', alt: 'Морская черепаха плывёт в синей воде Красного моря', caption: 'Черепаха в Красном море.' },
      { file: 'egypt-2026/cairo.jpg', alt: 'Парусные лодки-фелуки на Ниле в Каире', caption: 'Фелуки на Ниле в Каире.' },
    ],
  },
  uae: {
    wide: { file: 'hub-uae/dubai-marina.jpg', alt: 'Небоскрёбы Дубай Марины над водой вечером', caption: 'Небоскрёбы Дубай Марины с воды.' },
    practice: [
      { file: 'uae-longread/gold_souk.jpg', alt: 'Горки специй в мешках на рынке в Дубае', caption: 'Специи на рынке в Дубае.' },
      { file: 'uae-longread/creek.jpg', alt: 'Дубай-Крик: деревянные лодки-абры у берега', caption: 'Дубай-Крик и лодки-абры.' },
      { file: 'hub-uae/liwa.jpg', alt: 'Песчаные дюны пустыни Лива', caption: 'Дюны пустыни Лива.' },
    ],
  },
  vietnam: {
    wide: { file: 'vietnam-2026/danang.webp', alt: 'Бухта с пляжем у Дананга, покрытые лесом горы', caption: 'Пляж у Дананга: бухта под лесистыми горами.' },
    practice: [
      { file: 'vietnam-2026/hoian.webp', alt: 'Разноцветные фонари в лавке Хойана вечером', caption: 'Фонари в лавке Хойана.' },
      { file: 'hub-vietnam/sapa.jpg', alt: 'Рисовые террасы и деревни в горах у Сапы', caption: 'Рисовые террасы у Сапы на севере.' },
      { file: 'hub-vietnam/phu-quoc.jpg', alt: 'Песчаный пляж с пальмами на Фукуоке', caption: 'Пляж на Фукуоке.' },
    ],
  },
  abkhazia: {
    wide: { file: 'afon-cave/anakopia.jpg', alt: 'Новоафонский монастырь среди кипарисов, вид с Анакопийской горы', caption: 'Новый Афон с Анакопийской горы: монастырь среди кипарисов.' },
    practice: [
      { file: 'hub-abkhazia/gagra-colonnade.jpg', alt: 'Белая колоннада с высокой аркой в Гагре, пальмы по сторонам', caption: 'Колоннада в Гагре.' },
      { file: 'abkhazia/novoafon-cave-cover.jpg', alt: 'Подсвеченный зал Новоафонской пещеры и тропа вдоль стены', caption: 'Новоафонская пещера.' },
      { file: 'hub-abkhazia/gegsky-waterfall.jpg', alt: 'Гегский водопад падает со скалы в зелёном ущелье', caption: 'Гегский водопад в горах у Рицы.' },
    ],
  },
  armenia: {
    wide: { file: 'hub-armenia/sevanavank.jpg', alt: 'Монастырь Севанаванк на полуострове над синим озером Севан', caption: 'Севанаванк над озером Севан.' },
    practice: [
      { file: 'hub-armenia/tatev.jpg', alt: 'Каменная церковь монастыря Татев на фоне неба', caption: 'Монастырь Татев на юге страны.' },
      { file: 'armenia-own/garni.jpg', alt: 'Античный храм Гарни с колоннадой', caption: 'Языческий храм Гарни.' },
      { file: 'hub-armenia/geghard.jpg', alt: 'Монастырь Гегард среди скал и зелени ущелья', caption: 'Монастырь Гегард в ущелье.' },
    ],
  },
  'sri-lanka': {
    wide: { file: 'srilanka-own/galle.jpg', alt: 'Форт Галле с высоты: старый город на мысу и океан вокруг', caption: 'Форт Галле с высоты: старый город на мысу.' },
    practice: [
      { file: 'srilanka-own/sigiriya.jpg', alt: 'Скала Сигирия над садами и дорожкой к подножию', caption: 'Скала Сигирия.' },
      { file: 'hub-sri-lanka/mirissa.jpg', alt: 'Доски для сёрфинга на песке у моря в Мирисе', caption: 'Доски для сёрфинга на пляже Мирисы.' },
      { file: 'hub-sri-lanka/kandy-temple.jpg', alt: 'Белое здание храма Зуба Будды в Канди', caption: 'Храм Зуба Будды в Канди.' },
    ],
  },
  bali: {
    wide: { file: 'hub-bali/tanah-lot.jpg', alt: 'Храм Танах-Лот на скале у берега океана, волны разбиваются о камни', caption: 'Храм Танах-Лот на скале у берега.' },
    practice: [
      { file: 'hub-bali/tegalalang.jpg', alt: 'Рисовые террасы Тегаллаланг с водой на полях и крестьянином', caption: 'Рисовые террасы Тегаллаланг.' },
      { file: 'hub-bali/kelingking.jpg', alt: 'Пляж Келингкинг под скалой на острове Нуса-Пенида', caption: 'Пляж Келингкинг на Нуса-Пениде.' },
      { file: 'hub-bali/batur.jpg', alt: 'Вулкан Батур и озеро у его подножия', caption: 'Вулкан Батур и озеро Батур.' },
    ],
  },
  greece: {
    wide: { file: 'hub-greece/balos.jpg', alt: 'Лагуна Балос на Крите сверху: бирюзовые отмели и остров Грамвуса', caption: 'Лагуна Балос на Крите: мелководье и отмели.' },
    practice: [
      { file: 'hub-greece/meteora.jpg', alt: 'Скальные столбы Метеор и монастырь на вершине одного из них', caption: 'Метеоры: монастыри на вершинах скал.' },
      { file: 'hub-greece/acropolis.jpg', alt: 'Акрополь с Парфеноном на скале над Афинами, вид с холма Филопаппу', caption: 'Акрополь с холма Филопаппу.' },
      { file: 'hub-greece/navagio.jpg', alt: 'Пляж Навагио на Закинфе под белыми скалами, бирюзовая вода', caption: 'Пляж Навагио на Закинфе.' },
    ],
  },
  spain: {
    wide: { file: 'hub-spain/plaza-espana-sevilla.jpg', alt: 'Площадь Испании в Севилье: полукруг дворца, башни и канал', caption: 'Площадь Испании в Севилье.' },
    practice: [
      { file: 'hub-spain/sagrada-familia.jpg', alt: 'Своды Саграда Фамилии изнутри: колонны ветвятся как деревья', caption: 'Своды Саграда Фамилии в Барселоне.' },
      { file: 'hub-spain/park-guell.jpg', alt: 'Мозаичный дракон на лестнице парка Гуэль', caption: 'Мозаичный дракон в парке Гуэль, Барселона.' },
      { file: 'hub-spain/cala-mesquida.jpg', alt: 'Пляж Кала-Мескида на Мальорке: песок, бирюзовая вода и холмы', caption: 'Пляж Кала-Мескида на Мальорке.' },
    ],
  },
  croatia: {
    wide: { file: 'hub-croatia/plitvice.jpg', alt: 'Водопады Плитвицких озёр: потоки падают в бирюзовую воду', caption: 'Плитвицкие озёра: водопады и бирюзовая вода.' },
    practice: [
      { file: 'hub-croatia/split-vestibule.jpg', alt: 'Колокольня собора Святого Дуйма в круглом проёме вестибюля дворца Диоклетиана в Сплите', caption: 'Колокольня Сплита в проёме дворца Диоклетиана.' },
      { file: 'hub-croatia/zlatni-rat.jpg', alt: 'Пляж Златни-Рат на Браче сверху: галечная коса уходит в море', caption: 'Коса Златни-Рат на острове Брач.' },
      { file: 'hub-croatia/hvar.jpg', alt: 'Каменные дома Хвара над гаванью с яхтами', caption: 'Город Хвар над гаванью.' },
    ],
  },
  'italy-south': {
    wide: { file: 'hub-italy-south/florence.jpg', alt: 'Флоренция вечером с площади Микеланджело: собор с куполом над крышами', caption: 'Флоренция с площади Микеланджело: купол собора над крышами.' },
    practice: [
      { file: 'hub-italy-south/colosseum.jpg', alt: 'Колизей в Риме на закате', caption: 'Колизей в Риме.' },
      { file: 'hub-italy-south/matera.jpg', alt: 'Сасси в Матере: каменный город на склоне ущелья', caption: 'Сасси в Матере.' },
      { file: 'hub-italy-south/pompeii.jpg', alt: 'Форум Помпей, на горизонте Везувий', caption: 'Форум Помпей и Везувий.' },
    ],
  },
  cyprus: {
    wide: { file: 'hub-cyprus/makronissos.jpg', alt: 'Пляж Макронисос у Айя-Напы: светлый песок и прозрачная вода', caption: 'Пляж Макронисос у Айя-Напы.' },
    practice: [
      { file: 'hub-cyprus/pedoulas.jpg', alt: 'Деревня Педулас на склоне гор Троодос', caption: 'Деревня Педулас в горах Троодос.' },
      { file: 'hub-cyprus/kourion.jpg', alt: 'Античный театр Куриона над морем', caption: 'Театр Куриона над морем.' },
      { file: 'hub-cyprus/cape-greco.jpg', alt: 'Скалы мыса Греко и морская пещера', caption: 'Мыс Греко: скалы и морские пещеры.' },
    ],
  },
  'south-korea': {
    wide: { file: 'hub-south-korea/seongsan.jpg', alt: 'Сонсан на острове Чеджу сверху, вулканический конус у моря', caption: 'Сонсан на Чеджу: вулканический конус над морем.' },
    practice: [
      { file: 'hub-south-korea/gyeongbokgung.jpg', alt: 'Павильон дворца Кёнбоккун в Сеуле', caption: 'Дворец Кёнбоккун в Сеуле.' },
      { file: 'hub-south-korea/gamcheon.jpg', alt: 'Разноцветные дома деревни культуры Камчхон в Пусане', caption: 'Деревня культуры Камчхон в Пусане.' },
      { file: 'hub-south-korea/haeundae.jpg', alt: 'Пляж Хэундэ в Пусане и небоскрёбы у берега', caption: 'Пляж Хэундэ в Пусане.' },
    ],
  },
  singapore: {
    wide: { file: 'hub-singapore/gardens-by-the-bay.jpg', alt: 'Сады у залива в Сингапуре: рукотворные деревья-опоры и фонтан', caption: 'Сады у залива: деревья-опоры над прудом с фонтаном.' },
    practice: [
      { file: 'hub-singapore/jewel-changi.jpg', alt: 'Водопад под стеклянным куполом комплекса Jewel в аэропорту Чанги', caption: 'Водопад Jewel в аэропорту Чанги.' },
      { file: 'hub-singapore/chinatown.jpg', alt: 'Украшения к китайскому Новому году перед храмом в Чайна-тауне Сингапура', caption: 'Украшения к китайскому Новому году в Чайна-тауне.' },
      { file: 'hub-singapore/sentosa.jpg', alt: 'Пляж Палаван на острове Сентоза', caption: 'Пляж Палаван на Сентозе.' },
    ],
  },
  cambodia: {
    wide: { file: 'hub-cambodia/koh-rong.jpg', alt: 'Пляж на острове Кох-Ронг: белый песок и бирюзовая вода', caption: 'Пляж на острове Кох-Ронг.' },
    practice: [
      { file: 'cambodia/ta-prohm-roots.jpg', alt: 'Корни огромного дерева стекают по каменной башне Та Прома', caption: 'Корни дерева на башне Та Прома.' },
      { file: 'hub-cambodia/bayon.jpg', alt: 'Каменные лица на башнях храма Байон', caption: 'Каменные лица храма Байон.' },
      { file: 'hub-cambodia/phnom-penh-palace.jpg', alt: 'Павильон Королевского дворца в Пномпене', caption: 'Королевский дворец в Пномпене.' },
    ],
  },
  maldives: {
    wide: { file: 'hub-maldives/madhiriguraidhoo.jpg', alt: 'Катер на бирюзовой воде у острова Мадхиригурайдху, пальмы на берегу', caption: 'Катер у острова Мадхиригурайдху, атолл Лхавияни.' },
    practice: [
      { file: 'hub-maldives/jetty.jpg', alt: 'Деревянный причал уходит в прозрачную лагуну', caption: 'Причал над лагуной.' },
      { file: 'hub-maldives/male.jpg', alt: 'Мале с воздуха: плотная застройка столицы на маленьком острове', caption: 'Мале, столица, с воздуха.' },
      { file: 'hub-maldives/snorkeling.jpg', alt: 'Снорклинг над рифом в Индийском океане', caption: 'Снорклинг над рифом.' },
    ],
  },
  'india-goa': {
    wide: { file: 'hub-india-goa/bom-jesus.jpg', alt: 'Базилика Бом-Жезус в Старом Гоа за большим деревом и газоном', caption: 'Базилика Бом-Жезус в Старом Гоа.' },
    practice: [
      { file: 'hub-india-goa/fontainhas.jpg', alt: 'Переулок в квартале Фонтаиньяс в Панаджи: цветные дома и мощёная дорожка', caption: 'Переулок в квартале Фонтаиньяс, Панаджи.' },
      { file: 'goa-own/anjuna.jpg', alt: 'Пляжные кафе под пальмами на пляже Анджуны', caption: 'Кафе на пляже Анджуны.' },
      { file: 'goa-own/dudhsagar.jpg', alt: 'Водопад Дудхсагар стекает по скалам в лесистом ущелье', caption: 'Водопад Дудхсагар.' },
    ],
  },
  morocco: {
    wide: { file: 'hub-morocco/merzouga.jpg', alt: 'Оранжевые дюны Эрг-Шебби у Мерзуги', caption: 'Дюны Эрг-Шебби у Мерзуги.' },
    practice: [
      { file: 'hub-morocco/ait-benhaddou.jpg', alt: 'Глинобитный ксар Айт-Бен-Хадду сверху', caption: 'Ксар Айт-Бен-Хадду.' },
      { file: 'hub-morocco/fes-tannery.jpg', alt: 'Красильни Шуара в Фесе: чаны с краской среди домов', caption: 'Красильни Шуара в Фесе.' },
      { file: 'hub-morocco/essaouira.jpg', alt: 'Синие рыбацкие лодки в гавани Эс-Сувейры', caption: 'Рыбацкие лодки в гавани Эс-Сувейры.' },
    ],
  },
  china: {
    wide: { file: 'china-own/fenghuang.jpg', alt: 'Ночной Фэнхуан: дома и мосты вдоль реки', caption: 'Фэнхуан ночью: старый город вдоль реки.' },
    practice: [
      { file: 'china-own/pillars.jpg', alt: 'Каменные столбы Чжанцзяцзе в тумане', caption: 'Столбы Чжанцзяцзе в тумане.' },
      { file: 'china-guide-2026/guilin.jpg', alt: 'Карстовые горы Гуйлиня в утреннем тумане под розовым небом', caption: 'Карстовые горы Гуйлиня на рассвете.' },
      { file: 'china-guide-2026/chengdu.jpg', alt: 'Детёныш панды на дереве в Чэнду', caption: 'Панда в Чэнду.' },
    ],
  },
  philippines: {
    wide: { file: 'philippines-guide-2026/bohol.jpg', alt: 'Шоколадные холмы на Бохоле: ровные зелёные конусы до горизонта', caption: 'Шоколадные холмы на Бохоле.' },
    practice: [
      { file: 'philippines-guide-2026/coron.jpg', alt: 'Бирюзовая лагуна на Короне, деревянный причал и скалы', caption: 'Лагуна на Короне.' },
      { file: 'philippines-guide-2026/kawasan.jpg', alt: 'Водопад Кавасан на Себу: каскады и бирюзовая вода', caption: 'Водопад Кавасан на Себу.' },
      { file: 'philippines-guide-2026/tarsier.jpg', alt: 'Долгопят с огромными глазами на ветке', caption: 'Долгопят на Бохоле.' },
    ],
  },
  uzbekistan: {
    wide: { file: 'hub-uzbekistan/khiva-walls.jpg', alt: 'Глинобитные стены Ичан-Калы в Хиве', caption: 'Стены Ичан-Калы в Хиве.' },
    practice: [
      { file: 'hub-uzbekistan/bukhara.jpg', alt: 'Бирюзовый купол медресе и минарет Калян в Бухаре', caption: 'Бухара: минарет Калян и бирюзовый купол.' },
      { file: 'hub-uzbekistan/shah-i-zinda.jpg', alt: 'Мавзолеи некрополя Шахи-Зинда в Самарканде', caption: 'Некрополь Шахи-Зинда в Самарканде.' },
      { file: 'hub-uzbekistan/tashkent-metro.jpg', alt: 'Станция ташкентского метро «Мустакиллик майдони» с люстрами', caption: 'Станция метро в Ташкенте.' },
    ],
  },
  'italy-north': {
    wide: { file: 'hub-italy-north/tre-cime.jpg', alt: 'Три пика Лаваредо в Доломитах над облаками', caption: 'Три пика Лаваредо в Доломитах.' },
    practice: [
      { file: 'hub-italy-north/milan-duomo.jpg', alt: 'Миланский собор и площадь перед ним', caption: 'Миланский собор.' },
      { file: 'hub-italy-north/manarola.jpg', alt: 'Разноцветные дома Манаролы на скале над морем', caption: 'Манарола в Чинкве-Терре.' },
      { file: 'hub-italy-north/venice.jpg', alt: 'Большой канал в Венеции с моста Риальто: гондолы и дворцы', caption: 'Большой канал с моста Риальто.' },
    ],
  },
  malaysia: {
    wide: { file: 'hub-malaysia/cameron-highlands.jpg', alt: 'Чайные плантации Камерон-Хайлендс на склонах холмов', caption: 'Чайные плантации Камерон-Хайлендс.' },
    practice: [
      { file: 'hub-malaysia/batu-caves.jpg', alt: 'Золотая статуя Муругана и лестница к пещерам Бату', caption: 'Пещеры Бату у Куала-Лумпура.' },
      { file: 'hub-malaysia/perhentian.jpg', alt: 'Белый пляж под пальмами на острове Перхентиан-Бесар', caption: 'Пляж на Перхентиан-Бесаре.' },
      { file: 'hub-malaysia/melaka.jpg', alt: 'Река в Малакке и дома по её берегам', caption: 'Река в старой Малакке.' },
    ],
  },
  'south-africa': {
    wide: { file: 'south-africa/boulders-rocks.jpg', alt: 'Круглые гранитные валуны и мелкая бухта у Болдерса, вдали склон под облаком', caption: 'Валуны и бухта у Болдерса под Кейптауном.' },
    practice: [
      { file: 'south-africa/chapmans-peak.jpg', alt: 'Дорога, вырубленная в скальном склоне высоко над океаном на Капском полуострове', caption: 'Дорога Чепменс-Пик над океаном.' },
      { file: 'south-africa/muizenberg-huts.jpg', alt: 'Пляж Мёйзенберга: цветные деревянные кабинки у песка', caption: 'Цветные пляжные кабинки в Мёйзенберге.' },
      { file: 'south-africa/dassie.jpg', alt: 'Даман сидит на нагретом камне у смотровой площадки', caption: 'Даман на камне у смотровой площадки.' },
    ],
  },
  tanzania: {
    wide: { file: 'zanzibar-2026/paje.jpg', alt: 'Пляж Пае на Занзибаре в отлив: белый песок и мелкая вода', caption: 'Пляж Пае на Занзибаре в отлив.' },
    practice: [
      { file: 'zanzibar-2026/doors.jpg', alt: 'Резной деревянный дверной проём в каменном доме Стоун-Тауна', caption: 'Резная дверь в Стоун-Тауне на Занзибаре.' },
      { file: 'zanzibar-2026/savanna.jpg', alt: 'Зебра крупным планом в сухой саванне', caption: 'Зебра в Серенгети.' },
      { file: 'zanzibar-2026/kilimanjaro.jpg', alt: 'Заснеженная вершина Килиманджаро над облаками', caption: 'Килиманджаро над облаками.' },
    ],
  },
  mauritius: {
    wide: { file: 'hub-mauritius/grand-bassin.jpg', alt: 'Священное озеро Гран-Бассен среди леса и храмы на берегу', caption: 'Озеро Гран-Бассен.' },
    practice: [
      { file: 'mauritius-2026/waterfall.jpg', alt: 'Водопад Шамарель падает с обрыва в зелёное ущелье', caption: 'Водопад Шамарель.' },
      { file: 'mauritius-2026/chamarel.jpg', alt: 'Разноцветные песчаные холмы Шамареля', caption: 'Семицветная земля Шамареля.' },
      { file: 'mauritius-2026/beach.jpg', alt: 'Деревянная лодка на мелкой воде у берега лагуны', caption: 'Лодка у берега лагуны.' },
    ],
  },
  seychelles: {
    wide: { file: 'hub-seychelles/anse-lazio.jpg', alt: 'Пляж Анс-Лацио на Праслене: бирюзовая вода и гранитные валуны', caption: 'Пляж Анс-Лацио на Праслене.' },
    practice: [
      { file: 'seychelles-2026/cocodemer.jpg', alt: 'Орех коко-де-мер на деревянном столе среди цветков франжипани', caption: 'Орех коко-де-мер — символ Сейшел.' },
      { file: 'seychelles-2026/tortoise.jpg', alt: 'Гигантская черепаха Альдабра на траве', caption: 'Гигантская черепаха Альдабра.' },
      { file: 'seychelles-2026/waves.jpg', alt: 'Рыбаки в моторной лодке на волнах у Сейшел', caption: 'Рыбаки в лодке у берега.' },
    ],
  },
  kenya: {
    wide: { file: 'hub-kenya/amboseli-elephants.jpg', alt: 'Семья слонов в сухой траве национального парка Амбосели', caption: 'Слоны в Амбосели.' },
    practice: [
      { file: 'hub-kenya/giraffe.jpg', alt: 'Жираф среди деревьев в национальном парке Найроби', caption: 'Жираф в национальном парке Найроби.' },
      { file: 'kenya-own/mara.jpg', alt: 'Антилопа топи стоит на термитнике в саванне Масаи-Мара', caption: 'Антилопа топи в Масаи-Маре.' },
      { file: 'hub-kenya/nakuru-flamingos.jpg', alt: 'Розовые фламинго на озере Накуру', caption: 'Фламинго на озере Накуру.' },
    ],
  },
  israel: {
    wide: { file: 'hub-israel/jaffa.jpg', alt: 'Старый Яффо и порт с высоты, море у мола', caption: 'Старый Яффо и порт с высоты.' },
    practice: [
      { file: 'hub-israel/masada.jpg', alt: 'Масада: дворец Ирода на уступах северного склона скалы над пустыней', caption: 'Масада: дворец Ирода на северном склоне скалы.' },
      { file: 'hub-israel/tel-aviv-promenade.jpg', alt: 'Набережная Тель-Авива: пальмы, люди и море', caption: 'Набережная Тель-Авива.' },
      { file: 'hub-israel/dead-sea.jpg', alt: 'Рассвет над Мёртвым морем у Эйн-Бокека', caption: 'Рассвет над Мёртвым морем в Эйн-Бокеке.' },
    ],
  },
  jordan: {
    wide: { file: 'hub-jordan/wadi-rum.jpg', alt: 'Верблюд среди красных скал пустыни Вади-Рам', caption: 'Вади-Рам: верблюд среди красных скал.' },
    practice: [
      { file: 'hub-jordan/ad-deir.jpg', alt: 'Фасад Монастыря Эд-Дейр, высеченный в скале Петры', caption: 'Монастырь Эд-Дейр в Петре.' },
      { file: 'hub-jordan/jerash.jpg', alt: 'Римская арка Адриана в Джераше', caption: 'Арка Адриана в Джераше.' },
      { file: 'hub-jordan/dead-sea-salt.jpg', alt: 'Белая соль на берегу Мёртвого моря и зелёная вода', caption: 'Соль на берегу Мёртвого моря.' },
    ],
  },
  qatar: {
    wide: { file: 'hub-qatar/souq-waqif.jpg', alt: 'Сук Вакиф в Дохе: улица под разноцветными зонтиками', caption: 'Сук Вакиф: улица под разноцветными зонтиками.' },
    practice: [
      { file: 'hub-qatar/islamic-art-museum.jpg', alt: 'Небоскрёбы Дохи ночью в арках Музея исламского искусства', caption: 'Доха в арках Музея исламского искусства.' },
      { file: 'hub-qatar/katara.jpg', alt: 'Культурная деревня Катара сверху: сады, кафе и море', caption: 'Культурная деревня Катара.' },
      { file: 'hub-qatar/khor-al-adaid.jpg', alt: 'Пустыня у внутреннего моря Хор-эль-Адейд', caption: 'Хор-эль-Адейд: пустыня у внутреннего моря.' },
    ],
  },
  'saudi-arabia': {
    wide: { file: 'hub-saudi-arabia/hegra.jpg', alt: 'Гробницы набатеев в скалах Хегры среди песка', caption: 'Хегра: гробницы набатеев в скалах.' },
    practice: [
      { file: 'hub-saudi-arabia/qasr-al-farid.jpg', alt: 'Каср-эль-Фарид — гробница, высеченная в отдельной скале', caption: 'Каср-эль-Фарид в Хегре.' },
      { file: 'hub-saudi-arabia/diriyah.jpg', alt: 'Глинобитные стены Ат-Турайфа в Эд-Дирии', caption: 'Ат-Турайф в Эд-Дирии.' },
      { file: 'hub-saudi-arabia/edge-of-the-world.jpg', alt: 'Люди на скале Края мира под Эр-Риядом на закате', caption: 'Край мира под Эр-Риядом.' },
    ],
  },
  iran: {
    wide: { file: 'hub-iran/si-o-se-pol.jpg', alt: 'Мост Си-о-Се-Поль в Исфахане ночью: подсвеченные арки отражаются в реке', caption: 'Мост Си-о-Се-Поль в Исфахане ночью.' },
    practice: [
      { file: 'hub-iran/nasir-al-mulk.jpg', alt: 'Расписные своды мечети Насир-ол-Молк в Ширазе', caption: 'Своды мечети Насир-ол-Молк в Ширазе.' },
      { file: 'hub-iran/yazd.jpg', alt: 'Глиняные ветровые башни-бадгиры в Йезде', caption: 'Бадгиры — ветровые башни Йезда.' },
      { file: 'hub-iran/persepolis.jpg', alt: 'Порталы дворца Тачара в Персеполе', caption: 'Дворец Тачара в Персеполе.' },
    ],
  },
  madagascar: {
    wide: { file: 'hub-madagascar/tsingy.jpg', alt: 'Каменный лес Цинги-де-Бемараха: острые известняковые пики над зеленью', caption: 'Каменный лес Цинги-де-Бемараха.' },
    practice: [
      { file: 'hub-madagascar/lemur.jpg', alt: 'Кошачий лемур на дереве', caption: 'Кошачий лемур.' },
      { file: 'hub-madagascar/nosy-be.jpg', alt: 'Пляж с наклонённой пальмой на острове Нуси-Бе', caption: 'Пляж на Нуси-Бе.' },
      { file: 'hub-madagascar/isalo.jpg', alt: 'Столовая гора в национальном парке Исалу', caption: 'Национальный парк Исалу.' },
    ],
  },
  kyrgyzstan: {
    wide: { file: 'hub-kyrgyzstan/song-kol.jpg', alt: 'Юрты в ряд у озера Сон-Куль на закате', caption: 'Юрты у озера Сон-Куль.' },
    practice: [
      { file: 'hub-kyrgyzstan/burana.jpg', alt: 'Башня Бурана среди полей и каменных изваяний, за ней горы', caption: 'Башня Бурана.' },
      { file: 'hub-kyrgyzstan/ala-archa.jpg', alt: 'Заснеженные пики над ельником в парке Ала-Арча', caption: 'Ущелье Ала-Арча у Бишкека.' },
      { file: 'hub-kyrgyzstan/issyk-kul.jpg', alt: 'Люди купаются на берегу Иссык-Куля', caption: 'Берег Иссык-Куля.' },
    ],
  },
  tajikistan: {
    wide: { file: 'hub-tajikistan/iskanderkul.jpg', alt: 'Бирюзовое озеро среди Фанских гор', caption: 'Озеро в Фанских горах.' },
    practice: [
      { file: 'hub-tajikistan/pamir-highway.jpg', alt: 'Грузовик на Памирском тракте под нависающей скалой у реки Пяндж', caption: 'Памирский тракт у Пянджа.' },
      { file: 'hub-tajikistan/fann-mountains.jpg', alt: 'Долина в Фанских горах, вдали озеро', caption: 'Фанские горы.' },
      { file: 'hub-tajikistan/seven-lakes.jpg', alt: 'Котловина Маргузорских озёр среди гор', caption: 'Маргузорские озёра.' },
    ],
  },
  hainan: {
    wide: { file: 'hub-hainan/tianya-haijiao.jpg', alt: 'Пляж Тяньяхайцзяо у Санья: песок, волны и камни вдали', caption: 'Пляж Тяньяхайцзяо у Санья.' },
    practice: [
      { file: 'hub-hainan/guanyin.jpg', alt: 'Статуя богини Гуаньинь в море у храма Наньшань', caption: 'Статуя Гуаньинь у храма Наньшань.' },
      { file: 'hub-hainan/haitang-gate.jpg', alt: 'Красные ворота в китайском стиле среди пальм в бухте Хайтан', caption: 'Ворота в бухте Хайтан.' },
      { file: 'hub-hainan/yalong-bay.jpg', alt: 'Залив Ялунвань: прозрачная вода и острова', caption: 'Залив Ялунвань.' },
    ],
  },
  'hong-kong': {
    wide: { file: 'hub-hong-kong/star-ferry.jpg', alt: 'Паром Star Ferry на фоне небоскрёбов острова Гонконг днём', caption: 'Паром Star Ferry и небоскрёбы Гонконга.' },
    practice: [
      { file: 'hub-hong-kong/tian-tan-buddha.jpg', alt: 'Большой Будда Тянь-Тан на вершине холма на острове Лантау', caption: 'Большой Будда на Лантау.' },
      { file: 'hub-hong-kong/temple-street.jpg', alt: 'Столики уличного ресторана на ночном рынке Темпл-стрит', caption: 'Ночной рынок Темпл-стрит.' },
      { file: 'hub-hong-kong/lantau-hills.jpg', alt: 'Зелёные холмы острова Лантау и море', caption: 'Холмы Лантау.' },
    ],
  },
  kazakhstan: {
    wide: { file: 'hub-kazakhstan/big-almaty-lake.jpg', alt: 'Большое Алматинское озеро среди заснеженных гор', caption: 'Большое Алматинское озеро.' },
    practice: [
      { file: 'hub-kazakhstan/zenkov.jpg', alt: 'Вознесенский собор в Алматы: жёлтые стены и цветные купола', caption: 'Вознесенский собор в Алматы.' },
      { file: 'hub-kazakhstan/shymbulak.jpg', alt: 'Горнолыжные склоны и подъёмник Шымбулака', caption: 'Шымбулак над Алматы.' },
      { file: 'hub-kazakhstan/kolsai.jpg', alt: 'Кольсайское озеро в лесистом ущелье', caption: 'Кольсайское озеро.' },
    ],
  },
  nepal: {
    wide: { file: 'nepal-everest-trek-2026/stupa-ama-dablam.jpg', alt: 'Ступа с молитвенными флажками, за ней снежная пирамида Ама-Даблам в облаках', caption: 'Ступа и Ама-Даблам на треке к Эвересту.' },
    practice: [
      { file: 'nepal-everest-trek-2026/kathmandu-swayambhunath.jpg', alt: 'Золотая ступа Сваямбунатх с нарисованными глазами и молитвенными флажками', caption: 'Ступа Сваямбунатх в Катманду.' },
      { file: 'nepal-everest-trek-2026/mule-caravan.jpg', alt: 'Караван нагруженных мулов на каменистой тропе среди хвойного леса', caption: 'Караван мулов на тропе к Эвересту.' },
      { file: 'nepal-everest-trek-2026/cover-everest-lhotse.jpg', alt: 'Тёмная пирамида Эвереста за длинной снежной стеной Лхоцзе', caption: 'Эверест за стеной Лхоцзе.' },
    ],
  },
  bolivia: {
    wide: { file: 'bolivia/arbol-de-piedra.jpg', alt: 'Каменное дерево, выточенное ветром в пустыне Сильоли', caption: 'Каменное дерево в пустыне Сильоли.' },
    practice: [
      { file: 'bolivia/uyuni-incahuasi-cactus.jpg', alt: 'Высокие кактусы на острове Инкауаси посреди солончака Уюни', caption: 'Кактусы острова Инкауаси на солончаке Уюни.' },
      { file: 'bolivia/sol-de-manana-geysers.jpg', alt: 'Пар над гейзерным полем Соль-де-Маньяна', caption: 'Гейзеры Соль-де-Маньяна на высоте 4900 м.' },
      { file: 'bolivia/laguna-colorada-flamingos.jpg', alt: 'Красная вода Лагуны Колорада и фламинго', caption: 'Лагуна Колорада на высоте 4280 м.' },
    ],
  },
  'new-zealand': {
    wide: { file: 'new-zealand/cover.jpg', alt: 'Вершина Аораки в свете низкого солнца над бирюзовым озером Пукаки', caption: 'Аораки над озером Пукаки.' },
    practice: [
      { file: 'new-zealand/waterfall.jpg', alt: 'Водопад падает со скалы в густом лесу', caption: 'Водопад в густом лесу.' },
      { file: 'new-zealand/roys-peak.jpg', alt: 'Озеро Ванака с островами, вид с гребня Ройс-Пика', caption: 'Озеро Ванака с гребня Ройс-Пика.' },
      { file: 'new-zealand/sheep.jpg', alt: 'Овцы на склоне поля, за ними снежный хребет Южных Альп', caption: 'Овцы под Южными Альпами.' },
    ],
  },
  chile: {
    wide: { file: 'chile/atacama-valle-de-la-luna.jpg', alt: 'Красные скалы Долины Луны в пустыне Атакама', caption: 'Долина Луны в Атакаме.' },
    practice: [
      { file: 'chile-own/geysers.jpg', alt: 'Пар гейзерного поля в Атакаме на рассвете', caption: 'Гейзеры Атакамы на рассвете.' },
      { file: 'chile/vineyard.jpg', alt: 'Ряды лоз и пальмовая аллея на винодельне в долине Касабланка', caption: 'Винодельня в долине Касабланка.' },
      { file: 'hub-chile/valparaiso.jpg', alt: 'Цветные дома на улице Вальпараисо', caption: 'Цветные дома Вальпараисо.' },
    ],
  },
  serbia: {
    wide: { file: 'hub-serbia/djerdap.jpg', alt: 'Ущелье Джердап: Дунай между лесистыми горами', caption: 'Ущелье Джердап на Дунае.' },
    practice: [
      { file: 'hub-serbia/studenica.jpg', alt: 'Церковь монастыря Студеница из белого камня', caption: 'Монастырь Студеница.' },
      { file: 'hub-serbia/petrovaradin.jpg', alt: 'Петроварадинская крепость над Дунаем в Нови-Саде', caption: 'Петроварадинская крепость в Нови-Саде.' },
      { file: 'hub-serbia/kalemegdan.jpg', alt: 'Ворота Белградской крепости и статуя Победителя', caption: 'Белградская крепость Калемегдан.' },
    ],
  },
  finland: {
    wide: { file: 'hub-finland/porvoo.jpg', alt: 'Красные деревянные амбары на берегу реки в Старом Порвоо', caption: 'Старый Порвоо на берегу реки.' },
    practice: [
      { file: 'hub-finland/helsinki-cathedral.jpg', alt: 'Белый Кафедральный собор Хельсинки с зелёными куполами', caption: 'Кафедральный собор Хельсинки.' },
      { file: 'hub-finland/santa-village.jpg', alt: 'Деревня Санта-Клауса в Рованиеми зимним вечером', caption: 'Деревня Санта-Клауса в Рованиеми.' },
      { file: 'hub-finland/nuuksio.jpg', alt: 'Лесное озеро в национальном парке Нууксио', caption: 'Национальный парк Нууксио.' },
    ],
  },
  switzerland: {
    wide: { file: 'hub-switzerland/lavaux.jpg', alt: 'Виноградные террасы Лаво над Женевским озером', caption: 'Террасы Лаво над Женевским озером.' },
    practice: [
      { file: 'hub-switzerland/lauterbrunnen.jpg', alt: 'Долина Лаутербруннен: водопад Штауббах со скалы над деревней', caption: 'Долина Лаутербруннен.' },
      { file: 'hub-switzerland/chapel-bridge.jpg', alt: 'Капелльбрюкке и башня над водой в Люцерне', caption: 'Мост Капелльбрюкке в Люцерне.' },
      { file: 'hub-switzerland/oeschinensee.jpg', alt: 'Бирюзовое озеро Эшинен среди гор', caption: 'Озеро Эшинен.' },
    ],
  },
  iceland: {
    wide: { file: 'hub-iceland/kirkjufell.jpg', alt: 'Гора Кирькьюфетль и водопад перед ней', caption: 'Гора Кирькьюфетль.' },
    practice: [
      { file: 'hub-iceland/seljalandsfoss.jpg', alt: 'Водопад Сельяландсфосс падает с зелёного обрыва', caption: 'Водопад Сельяландсфосс.' },
      { file: 'hub-iceland/reykjavik.jpg', alt: 'Цветные крыши Рейкьявика с высоты церкви Хадльгримскиркья', caption: 'Рейкьявик с высоты.' },
      { file: 'hub-iceland/thingvellir.jpg', alt: 'Разлом Флосагья в национальном парке Тингвеллир', caption: 'Тингвеллир.' },
    ],
  },
  norway: {
    wide: { file: 'hub-norway/geirangerfjord.jpg', alt: 'Гейрангер-фьорд с обзорной площадки Флидальсьювет', caption: 'Гейрангер-фьорд.' },
    practice: [
      { file: 'hub-norway/preikestolen.jpg', alt: 'Скала Прекестулен над Люсе-фьордом', caption: 'Скала Прекестулен.' },
      { file: 'hub-norway/bryggen.jpg', alt: 'Цветные деревянные дома набережной Брюгген в Бергене', caption: 'Брюгген в Бергене.' },
      { file: 'hub-norway/tromso.jpg', alt: 'Тромсё и заснеженные горы над гаванью', caption: 'Тромсё.' },
    ],
  },
  usa: {
    wide: { file: 'hub-usa/brooklyn-bridge.jpg', alt: 'Бруклинский мост и небоскрёбы Нижнего Манхэттена', caption: 'Бруклинский мост и Манхэттен.' },
    practice: [
      { file: 'hub-usa/yosemite.jpg', alt: 'Долина Йосемити с точки Туннель: скалы Эль-Капитан и Хаф-Доум', caption: 'Долина Йосемити.' },
      { file: 'hub-usa/golden-gate.jpg', alt: 'Мост Золотые Ворота и корабль в заливе', caption: 'Мост Золотые Ворота.' },
      { file: 'hub-usa/las-vegas.jpg', alt: 'Лас-Вегас-Стрип ночью', caption: 'Лас-Вегас-Стрип ночью.' },
    ],
  },
  'canada-rockies': {
    wide: { file: 'hub-canada-rockies/peyto-lake.jpg', alt: 'Бирюзовое озеро Пейто среди гор и леса', caption: 'Озеро Пейто.' },
    practice: [
      { file: 'hub-canada-rockies/lake-louise.jpg', alt: 'Озеро Луиза под заснеженными горами', caption: 'Озеро Луиза.' },
      { file: 'hub-canada-rockies/banff-avenue.jpg', alt: 'Главная улица Банфа на фоне горы', caption: 'Улица Банфа.' },
      { file: 'hub-canada-rockies/emerald-lake.jpg', alt: 'Изумрудное озеро в парке Йохо', caption: 'Изумрудное озеро в Йохо.' },
    ],
  },
  'canada-east': {
    wide: { file: 'hub-canada-east/toronto-skyline.jpg', alt: 'Небоскрёбы Торонто и башня Си-Эн на закате', caption: 'Торонто на закате.' },
    practice: [
      { file: 'hub-canada-east/horseshoe-falls.jpg', alt: 'Водопад Подкова на Ниагаре', caption: 'Ниагарский водопад Подкова.' },
      { file: 'hub-canada-east/old-port-montreal.jpg', alt: 'Старый порт Монреаля и мост Жака Картье', caption: 'Старый порт Монреаля.' },
      { file: 'hub-canada-east/peggys-cove.jpg', alt: 'Рыбацкий домик на камнях в Пеггис-Коув', caption: 'Пеггис-Коув в Новой Шотландии.' },
    ],
  },
  'japan-hokkaido': {
    wide: { file: 'hub-japan-hokkaido/shiretoko.jpg', alt: 'Озеро Сиретоко-Гоко с отражением гор', caption: 'Пять озёр Сиретоко.' },
    practice: [
      { file: 'hub-japan-hokkaido/otaru-canal.jpg', alt: 'Канал Отару со старыми складами и фонарями вдоль набережной', caption: 'Канал в Отару.' },
      { file: 'hub-japan-hokkaido/biei-blue-pond.jpg', alt: 'Голубой пруд в Биэй с сухими стволами в воде', caption: 'Голубой пруд в Биэй.' },
      { file: 'hub-japan-hokkaido/furano-lavender.jpg', alt: 'Лавандовые поля Фурано на склоне', caption: 'Лавандовые поля Фурано.' },
    ],
  },
  mexico: {
    wide: { file: 'hub-mexico/tulum.jpg', alt: 'Руины Тулума над белым пляжем и бирюзовым морем', caption: 'Руины Тулума над морем.' },
    practice: [
      { file: 'hub-mexico/cenote-ik-kil.jpg', alt: 'Сенот Ик-Киль: круглый колодец с лианами и купающимися', caption: 'Сенот Ик-Киль на Юкатане.' },
      { file: 'hub-mexico/zocalo.jpg', alt: 'Площадь Сокало в Мехико сверху', caption: 'Площадь Сокало в Мехико.' },
      { file: 'hub-mexico/guanajuato.jpg', alt: 'Купола и цветные дома Гуанахуато', caption: 'Гуанахуато.' },
    ],
  },
  cuba: {
    wide: { file: 'hub-cuba/vinales.jpg', alt: 'Долина Виньялес: табачные поля и известняковые холмы-моготы', caption: 'Долина Виньялес.' },
    practice: [
      { file: 'kuba-tury-2027/havana.jpg', alt: 'Узкая улица Старой Гаваны с цветными домами', caption: 'Улица Старой Гаваны.' },
      { file: 'kuba-tury-2027/malecon.jpg', alt: 'Голубой старый автомобиль на набережной Малекон в Гаване', caption: 'Набережная Малекон в Гаване.' },
      { file: 'hub-cuba/varadero.jpg', alt: 'Белый пляж Варадеро и бирюзовое море', caption: 'Пляж Варадеро.' },
    ],
  },
  'dominican-republic': {
    wide: { file: 'hub-dominican-republic/los-haitises.jpg', alt: 'Скалистый остров с птицами в национальном парке Лос-Айтисес', caption: 'Национальный парк Лос-Айтисес.' },
    practice: [
      { file: 'hub-dominican-republic/saona-palm.jpg', alt: 'Пальма наклонилась над бирюзовой водой на острове Саона', caption: 'Остров Саона.' },
      { file: 'dominican-republic-2027/north-coast.jpg', alt: 'Кайты над заливом у Кабарете на северном побережье', caption: 'Кайтсёрфинг у Кабарете.' },
      { file: 'hub-dominican-republic/zona-colonial.jpg', alt: 'Улица Лас-Дамас в колониальном квартале Санто-Доминго', caption: 'Колониальный квартал Санто-Доминго.' },
    ],
  },
  'guatemala-belize': {
    wide: { file: 'hub-guatemala-belize/great-blue-hole.jpg', alt: 'Большая голубая дыра у побережья Белиза с высоты', caption: 'Большая голубая дыра в Белизе.' },
    practice: [
      { file: 'hub-guatemala-belize/santa-catalina.jpg', alt: 'Арка Санта-Каталина в Антигуа-Гватемала на фоне вулкана', caption: 'Арка Санта-Каталина в Антигуа.' },
      { file: 'hub-guatemala-belize/atitlan.jpg', alt: 'Озеро Атитлан и вулканы на горизонте', caption: 'Озеро Атитлан.' },
      { file: 'hub-guatemala-belize/caye-caulker.jpg', alt: 'Берег острова Кей-Колкер с пальмами и пирсом', caption: 'Остров Кей-Колкер в Белизе.' },
    ],
  },
  'costa-rica-panama': {
    wide: { file: 'hub-costa-rica-panama/manuel-antonio.jpg', alt: 'Пляж в национальном парке Мануэль-Антонио, лес у воды', caption: 'Пляж Мануэль-Антонио.' },
    practice: [
      { file: 'hub-costa-rica-panama/monteverde.jpg', alt: 'Облачный лес Монтеверде в тумане', caption: 'Облачный лес Монтеверде.' },
      { file: 'hub-costa-rica-panama/miraflores.jpg', alt: 'Контейнеровоз в шлюзе Мирафлорес на Панамском канале', caption: 'Шлюз Мирафлорес на Панамском канале.' },
      { file: 'hub-costa-rica-panama/san-blas.jpg', alt: 'Белый пляж с пальмами на островах Сан-Блас', caption: 'Острова Сан-Блас.' },
    ],
  },
  'chile-patagonia': {
    wide: { file: 'hub-chile-patagonia/grey-glacier.jpg', alt: 'Ледник Грей спускается в озеро среди гор', caption: 'Ледник Грей.' },
    practice: [
      { file: 'patagonia-own/salto-grande.jpg', alt: 'Водопад Сальто-Гранде: поток бирюзовой воды между скал', caption: 'Водопад Сальто-Гранде в Торрес-дель-Пайне.' },
      { file: 'hub-chile-patagonia/guanaco.jpg', alt: 'Два гуанако на склоне в Торрес-дель-Пайне', caption: 'Гуанако в Торрес-дель-Пайне.' },
      { file: 'hub-chile-patagonia/nordenskjold.jpg', alt: 'Бирюзовое озеро Норденшёльд под горами', caption: 'Озеро Норденшёльд.' },
    ],
  },
  peru: {
    wide: { file: 'hub-peru/vinicunca.jpg', alt: 'Полосатые склоны Радужной горы Виникунка', caption: 'Радужная гора Виникунка.' },
    practice: [
      { file: 'peru-own/alpacas.jpg', alt: 'Альпаки на фоне гор Священной долины', caption: 'Альпаки в Священной долине.' },
      { file: 'hub-peru/uros.jpg', alt: 'Плавучие тростниковые острова урос на озере Титикака', caption: 'Острова урос на Титикаке.' },
      { file: 'hub-peru/pisac.jpg', alt: 'Земледельческие террасы инков в Писаке', caption: 'Террасы инков в Писаке.' },
    ],
  },
  argentina: {
    wide: { file: 'hub-argentina/fitz-roy.jpg', alt: 'Гора Фицрой в лучах рассвета над Эль-Чальтеном', caption: 'Фицрой на рассвете.' },
    practice: [
      { file: 'patagonia-own/perito-moreno.jpg', alt: 'Стена льда ледника Перито-Морено: голубые зубцы уходят в воду', caption: 'Ледник Перито-Морено.' },
      { file: 'hub-argentina/la-boca.jpg', alt: 'Цветные дома улицы Каминито в Ла-Боке', caption: 'Каминито в Ла-Боке, Буэнос-Айрес.' },
      { file: 'hub-argentina/humahuaca.jpg', alt: 'Разноцветные склоны ущелья Умауака', caption: 'Ущелье Умауака.' },
    ],
  },
  ecuador: {
    wide: { file: 'galapagos-own/tortoise.jpg', alt: 'Две гигантские галапагосские черепахи пасутся на зелёном лугу', caption: 'Гигантские черепахи на Галапагосах.' },
    practice: [
      { file: 'galapagos-own/booby.jpg', alt: 'Голубоногая олуша крупным планом: ярко-синие лапы', caption: 'Голубоногая олуша на Галапагосах.' },
      { file: 'hub-ecuador/banos.jpg', alt: 'Городок Баньос в зелёной горной долине', caption: 'Баньос в горной долине.' },
      { file: 'hub-ecuador/quito.jpg', alt: 'Кито с высоты: город в долине между гор', caption: 'Кито с высоты.' },
    ],
  },
  brazil: {
    wide: { file: 'hub-brazil/lencois.jpg', alt: 'Дюны и лагуны Ленсойс-Мараньенсис на закате', caption: 'Ленсойс-Мараньенсис на закате.' },
    practice: [
      { file: 'hub-brazil/cristo-redentor.jpg', alt: 'Статуя Христа-Искупителя над облаками в Рио-де-Жанейро', caption: 'Христос-Искупитель над облаками.' },
      { file: 'hub-brazil/pelourinho.jpg', alt: 'Цветные дома площади Пелоуриньо в Салвадоре', caption: 'Пелоуриньо в Салвадоре.' },
      { file: 'hub-brazil/iguacu.jpg', alt: 'Водопады Игуасу с бразильской стороны и радуга', caption: 'Водопады Игуасу с бразильской стороны.' },
    ],
  },
  'australia-east': {
    wide: { file: 'hub-australia-east/whitehaven.jpg', alt: 'Пляж Уайтхейвен и бирюзовые отмели Хилл-Инлет', caption: 'Пляж Уайтхейвен.' },
    practice: [
      { file: 'hub-australia-east/twelve-apostles.jpg', alt: 'Скалы Двенадцать Апостолов у побережья Виктории', caption: 'Двенадцать Апостолов.' },
      { file: 'hub-australia-east/great-barrier-reef.jpg', alt: 'Большой Барьерный риф с воздуха', caption: 'Большой Барьерный риф.' },
      { file: 'hub-australia-east/byron-bay.jpg', alt: 'Мыс Байрон с маяком и пляжами сверху', caption: 'Мыс Байрон.' },
    ],
  },
  'australia-north': {
    wide: { file: 'hub-australia-north/katherine-gorge.jpg', alt: 'Ущелье Кэтрин: красные скалы над рекой', caption: 'Ущелье Кэтрин.' },
    practice: [
      { file: 'hub-australia-north/florence-falls.jpg', alt: 'Водопад Флоренс в национальном парке Личфилд', caption: 'Водопад Флоренс в Личфилде.' },
      { file: 'hub-australia-north/kata-tjuta.jpg', alt: 'Красные купола скал Ката-Тьюта', caption: 'Ката-Тьюта.' },
      { file: 'hub-australia-north/kings-canyon.jpg', alt: 'Кингс-Каньон: песчаниковые стены', caption: 'Кингс-Каньон.' },
    ],
  },
  'sumatra-kalimantan': {
    wide: { file: 'hub-sumatra-kalimantan/lake-toba.jpg', alt: 'Озеро Тоба среди зелёных гор Суматры', caption: 'Озеро Тоба.' },
    practice: [
      { file: 'hub-sumatra-kalimantan/sinabung.jpg', alt: 'Вулкан Синабунг за пальмами', caption: 'Вулкан Синабунг.' },
      { file: 'hub-sumatra-kalimantan/bukit-lawang.jpg', alt: 'Река и деревня Букит-Лаванг у джунглей', caption: 'Букит-Лаванг.' },
      { file: 'hub-sumatra-kalimantan/derawan.jpg', alt: 'Острова Дераван с воздуха', caption: 'Острова Дераван.' },
    ],
  },
  'raja-ampat': {
    wide: { file: 'hub-raja-ampat/wayag-sunrise.jpg', alt: 'Острова Раджа-Ампат на рассвете с высоты', caption: 'Раджа-Ампат на рассвете.' },
    practice: [
      { file: 'hub-raja-ampat/mushroom-island.jpg', alt: 'Скала-гриб с зеленью посреди моря', caption: 'Скала-гриб в Раджа-Ампат.' },
      { file: 'hub-raja-ampat/misool-reef.jpg', alt: 'Горгонарии и дайвер у рифа Мисоол', caption: 'Риф у Мисоола.' },
      { file: 'hub-raja-ampat/sawinggrai.jpg', alt: 'Лодки на берегу деревни Савинграй', caption: 'Деревня Савинграй.' },
    ],
  },
  kamchatka: {
    wide: { file: 'hub-kamchatka/valley-of-geysers.jpg', alt: 'Долина гейзеров: пар над рекой в зелёном каньоне', caption: 'Долина гейзеров.' },
    practice: [
      { file: 'hub-kamchatka/klyuchevskaya.jpg', alt: 'Ключевская сопка на рассвете', caption: 'Ключевская сопка.' },
      { file: 'hub-kamchatka/kurile-bear.jpg', alt: 'Медведь в воде Курильского озера', caption: 'Медведь на Курильском озере.' },
      { file: 'hub-kamchatka/mutnovsky.jpg', alt: 'Фумаролы вулкана Мутновский', caption: 'Вулкан Мутновский.' },
    ],
  },
  karelia: {
    wide: { file: 'ruskeala/skerries.jpg', alt: 'Ладожские шхеры на закате: трава, скалы и вода', caption: 'Ладожские шхеры.' },
    practice: [
      { file: 'valaam-own/monastery.jpg', alt: 'Собор Валаамского монастыря с высоты', caption: 'Валаамский монастырь.' },
      { file: 'karelia/kizhi-cover.jpg', alt: 'Деревянные церкви Кижского погоста', caption: 'Кижский погост.' },
      { file: 'ruskeala/park.jpg', alt: 'Мраморный каньон Рускеалы осенью', caption: 'Мраморный каньон Рускеала.' },
    ],
  },
  dagestan: {
    wide: { file: 'hub-dagestan/gamsutl.jpg', alt: 'Покинутый аул Гамсутль на вершине горы', caption: 'Аул Гамсутль.' },
    practice: [
      { file: 'hub-dagestan/chokh.jpg', alt: 'Каменные дома села Чох на склоне', caption: 'Село Чох.' },
      { file: 'dagestan/derbent.jpg', alt: 'Дербент с высоты: город и Каспийское море', caption: 'Дербент с высоты.' },
      { file: 'hub-dagestan/sarykum.jpg', alt: 'Бархан Сарыкум и стадо у его подножия', caption: 'Бархан Сарыкум.' },
    ],
  },
  altai: {
    wide: { file: 'altai-own/teletskoye.jpg', alt: 'Телецкое озеро с высоты: зелёные берега и дельта реки', caption: 'Телецкое озеро с высоты.' },
    practice: [
      { file: 'hub-altai/aktru.jpg', alt: 'Ледники Актру над хвойным лесом', caption: 'Ледники Актру.' },
      { file: 'altai-own/katun.jpg', alt: 'Река Катунь среди гор', caption: 'Река Катунь.' },
      { file: 'hub-altai/katun-chuya.jpg', alt: 'Слияние Катуни и Чуи зимой: бирюзовая вода среди снега', caption: 'Слияние Катуни и Чуи зимой.' },
    ],
  },
  'chile-fjords': {
    wide: { file: 'hub-chile-fjords/san-rafael.jpg', alt: 'Ледник Сан-Рафаэль и айсберг в лагуне', caption: 'Ледник Сан-Рафаэль.' },
    practice: [
      { file: 'hub-chile-fjords/queulat.jpg', alt: 'Висячий ледник Кеулат и водопад со скалы', caption: 'Висячий ледник Кеулат.' },
      { file: 'hub-chile-fjords/carretera-austral.jpg', alt: 'Грунтовая дорога Карретера-Аустраль уходит к горам', caption: 'Дорога Карретера-Аустраль.' },
      { file: 'hub-chile-fjords/chiloe-palafitos.jpg', alt: 'Дома на сваях на острове Чилоэ и бакланы на лодках', caption: 'Дома на сваях на Чилоэ.' },
    ],
  },
};

export const countryPhotos = (slug) => COUNTRY_PHOTOS[slug] || null;
