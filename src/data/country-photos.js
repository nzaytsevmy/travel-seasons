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
};

export const countryPhotos = (slug) => COUNTRY_PHOTOS[slug] || null;
