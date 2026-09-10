// Главные виды для раздела «Что посмотреть» на страницах стран без списка мест (10.09.2026, пометка
// Никиты: «в каждой карточке должны быть сочные картинки»). Кадры — _images/sights/<страна>/, запись
// о лицензии — в _credits.json той же папки; из неё собирается подпись «Фотографии: …» внизу страницы.
export const COUNTRY_SIGHTS = {
  'abkhazia': [
    { file: 'sights/abkhazia/11-pitsunda-sosny-u-morya.jpg', alt: 'Берег Пицунды и горы', caption: 'Пицунда: сосны у моря' },
    { file: 'sights/abkhazia/12-goluboe-ozero.jpg', alt: 'Бирюзовая вода Голубого озера', caption: 'Голубое озеро' },
    { file: 'sights/abkhazia/13-zamok-printsa-oldenburgskogo-v-gagre.jpg', alt: 'Замок принца Ольденбургского над Гагрой', caption: 'Замок принца Ольденбургского в Гагре' },
    { file: 'sights/abkhazia/04-naberezhnaya-sukhuma.jpg', alt: 'Набережная Сухума и остатки древней крепости', caption: 'Набережная Сухума' },
  ],
  'altai': [
    { file: 'sights/altai/11-marsianskie-kholmy-kyzyl-chin.jpg', alt: 'Разноцветные холмы Кызыл-Чина', caption: 'Марсианские холмы Кызыл-Чин' },
    { file: 'sights/altai/03-gora-belukha.jpg', alt: 'Белуха и Аккемское озеро', caption: 'Гора Белуха' },
    { file: 'sights/altai/04-geyzernoe-ozero.jpg', alt: 'Бирюзовое Гейзерное озеро осенью', caption: 'Гейзерное озеро' },
  ],
  'argentina': [
    { file: 'sights/argentina/11-mayak-les-eklerer-u-ushuai.jpg', alt: 'Маяк Лес-Эклерёр на скалах у Ушуаи', caption: 'Маяк Лес-Эклерёр у Ушуаи' },
    { file: 'sights/argentina/12-solonchak-salinas-grandes.jpg', alt: 'Бирюзовый канал на солончаке Салинас-Грандес', caption: 'Солончак Салинас-Грандес' },
    { file: 'sights/argentina/13-teatr-kolon-v-buenos-ayrese.jpg', alt: 'Фасад театра Колон в Буэнос-Айресе', caption: 'Театр Колон в Буэнос-Айресе' },
    { file: 'sights/argentina/14-kit-u-poluostrova-valdes.jpg', alt: 'Хвост кита у полуострова Вальдес', caption: 'Кит у полуострова Вальдес' },
  ],
  'australia-east': [
    { file: 'sights/australia-east/11-plyazh-bondi-v-sidnee.jpg', alt: 'Пляж Бонди и прибой с мыса', caption: 'Пляж Бонди в Сиднее' },
    { file: 'sights/australia-east/02-golubye-gory-skaly-tri-sestry.jpg', alt: 'Скалы Три сестры в Голубых горах', caption: 'Голубые горы, скалы Три сестры' },
    { file: 'sights/australia-east/13-ozero-makkenzi-na-ostrove-freyzer.jpg', alt: 'Белый песок и голубая вода озера Маккензи', caption: 'Озеро Маккензи на острове Фрейзер' },
  ],
  'australia-north': [
    { file: 'sights/australia-north/11-kamni-karlu-karlu.jpg', alt: 'Расколотый валун Карлу-Карлу', caption: 'Камни Карлу-Карлу' },
    { file: 'sights/australia-north/02-natsionalnyy-park-kakadu.jpg', alt: 'Скалы и равнина Какаду на закате', caption: 'Национальный парк Какаду' },
    { file: 'sights/australia-north/12-goryachie-istochniki-mataranka.jpg', alt: 'Горячий источник Матаранка среди пальм', caption: 'Горячие источники Матаранка' },
  ],
  'brazil': [
    { file: 'sights/brazil/11-fernandu-di-noronya.jpg', alt: 'Морская черепаха и дайвер у Фернанду-ди-Норонья', caption: 'Фернанду-ди-Норонья' },
    { file: 'sights/brazil/12-oru-pretu.jpg', alt: 'Барочная церковь над Ору-Прету', caption: 'Ору-Прету' },
    { file: 'sights/brazil/13-yaguar-v-pantanale.jpg', alt: 'Ягуар идёт по берегу реки в Пантанале', caption: 'Ягуар в Пантанале' },
    { file: 'sights/brazil/04-sliyanie-rek-u-manausa.jpg', alt: 'Слияние тёмной и жёлтой рек у Манауса', caption: 'Слияние рек у Манауса' },
  ],
  'cambodia': [
    { file: 'sights/cambodia/11-khram-banteay-srey.jpg', alt: 'Башни храма Бантеай-Срей из розового песчаника', caption: 'Храм Бантеай-Срей' },
    { file: 'sights/cambodia/12-plavuchaya-derevnya-na-tonlesape.jpg', alt: 'Дома на воде в плавучей деревне на Тонлесапе', caption: 'Плавучая деревня на Тонлесапе' },
    { file: 'sights/cambodia/13-reka-v-kampote.jpg', alt: 'Закат над рекой в Кампоте', caption: 'Река в Кампоте' },
  ],
  'canada-east': [
    { file: 'sights/canada-east/11-parlamentskiy-kholm-v-ottave.jpg', alt: 'Парламент Канады над рекой Оттава осенью', caption: 'Парламентский холм в Оттаве' },
    { file: 'sights/canada-east/13-skaly-khoupvell-v-zalive-fandi.jpg', alt: 'Скалы-«цветочные горшки» Хоупвелл в отлив', caption: 'Скалы Хоупвелл в заливе Фанди' },
    { file: 'sights/canada-east/04-staryy-monreal.jpg', alt: 'Базилика Нотр-Дам в Старом Монреале', caption: 'Старый Монреаль' },
  ],
  'canada-rockies': [
    { file: 'sights/canada-rockies/11-lednik-atabaska.jpg', alt: 'Ледник Атабаска и заснеженные пики', caption: 'Ледник Атабаска' },
    { file: 'sights/canada-rockies/12-vodopad-takakau.jpg', alt: 'Водопад Такакау', caption: 'Водопад Такакау' },
    { file: 'sights/canada-rockies/03-vapiti-v-dzhaspere.jpg', alt: 'Самка вапити с оленёнком на лесной поляне', caption: 'Вапити в Скалистых горах' },
  ],
  'chile-fjords': [
    { file: 'sights/chile-fjords/11-gora-serro-kastilo.jpg', alt: 'Зубчатая вершина Серро-Кастильо и ледник', caption: 'Гора Серро-Кастильо' },
    { file: 'sights/chile-fjords/12-reka-futaleufu.jpg', alt: 'Бирюзовая река Футалеуфу среди скал', caption: 'Река Футалеуфу' },
    { file: 'sights/chile-fjords/03-park-pumalin.jpg', alt: 'Фьорд и горы в парке Пумалин', caption: 'Парк Пумалин' },
  ],
  'chile-patagonia': [
    { file: 'sights/chile-patagonia/03-mramornye-peshchery.jpg', alt: 'Мраморные пещеры над бирюзовой водой', caption: 'Мраморные пещеры' },
    { file: 'sights/chile-patagonia/04-karetera-austral.jpg', alt: 'Гравийная Каретера-Аустраль и снежные горы', caption: 'Каретера-Аустраль' },
  ],
  'costa-rica-panama': [
    { file: 'sights/costa-rica-panama/11-reka-rio-seleste.jpg', alt: 'Водопад и бирюзовая вода Рио-Селесте', caption: 'Река Рио-Селесте' },
    { file: 'sights/costa-rica-panama/12-kasko-vekho-v-paname.jpg', alt: 'Площадь с колониальными домами в Каско-Вьехо', caption: 'Каско-Вьехо в Панаме' },
    { file: 'sights/costa-rica-panama/13-kanaly-tortugero.jpg', alt: 'Цветные дома в деревне Тортугеро', caption: 'Каналы Тортугеро' },
  ],
  'croatia': [
    { file: 'sights/croatia/11-rovin.jpg', alt: 'Старый город Ровиня и колокольня на закате', caption: 'Ровинь' },
    { file: 'sights/croatia/12-motovun.jpg', alt: 'Городок Мотовун на вершине холма в Истрии', caption: 'Мотовун в Истрии' },
    { file: 'sights/croatia/13-amfiteatr-v-pule.jpg', alt: 'Римский амфитеатр в Пуле вечером', caption: 'Амфитеатр в Пуле' },
  ],
  'cyprus': [
    { file: 'sights/cyprus/11-grobnitsy-tsarey-v-pafose.jpg', alt: 'Высеченная в скале гробница в некрополе Гробницы царей', caption: 'Гробницы царей в Пафосе' },
    { file: 'sights/cyprus/03-monastyr-kikkos.jpg', alt: 'Ворота монастыря Киккос с мозаикой', caption: 'Монастырь Киккос' },
    { file: 'sights/cyprus/04-naberezhnaya-limassola.jpg', alt: 'Марина Лимассола', caption: 'Набережная Лимассола' },
  ],
  'dagestan': [
    { file: 'sights/dagestan/12-karadakhskaya-tesnina.jpg', alt: 'Подвесной мост в Карадахской теснине', caption: 'Карадахская теснина' },
    { file: 'sights/dagestan/04-gunib.jpg', alt: 'Гуниб под горным плато', caption: 'Гуниб' },
  ],
  'dominican-republic': [
    { file: 'sights/dominican-republic/11-vodopad-el-limon.jpg', alt: 'Водопад Эль-Лимон в тропическом лесу', caption: 'Водопад Эль-Лимон' },
    { file: 'sights/dominican-republic/04-plyazh-rinkon-na-samane.jpg', alt: 'Бирюзовая вода у пляжа на полуострове Самана', caption: 'Пляж Ринкон на Самане' },
  ],
  'ecuador': [
    { file: 'sights/ecuador/11-sobor-v-kuenke.jpg', alt: 'Синие купола собора над Куэнкой', caption: 'Собор в Куэнке' },
    { file: 'sights/ecuador/12-vulkan-chimboraso.jpg', alt: 'Вулкан Чимборасо и викунья', caption: 'Вулкан Чимборасо' },
    { file: 'sights/ecuador/04-ozero-kilotoa.jpg', alt: 'Озеро Килотоа в кратере', caption: 'Озеро Килотоа' },
  ],
  'finland': [
    { file: 'sights/finland/11-krepost-suomenlinna.jpg', alt: 'Острова крепости Суоменлинна и Хельсинки', caption: 'Крепость Суоменлинна' },
    { file: 'sights/finland/12-krepost-olavinlinna.jpg', alt: 'Крепость Олавинлинна на скале', caption: 'Крепость Олавинлинна' },
  ],
  'greece': [
    { file: 'sights/greece/11-venetsianskaya-gavan-khani.jpg', alt: 'Лодки и маяк в венецианской гавани Ханьи', caption: 'Венецианская гавань Ханьи' },
    { file: 'sights/greece/02-lindos-na-rodose.jpg', alt: 'Бухта Линдоса на Родосе', caption: 'Линдос на Родосе' },
    { file: 'sights/greece/03-melnitsy-mikonosa.jpg', alt: 'Мельницы Миконоса над морем', caption: 'Мельницы Миконоса' },
    { file: 'sights/greece/04-staryy-gorod-korfu.jpg', alt: 'Старый город Корфу и крепость', caption: 'Старый город Корфу' },
  ],
  'guatemala-belize': [
    { file: 'sights/guatemala-belize/11-semuk-champey.jpg', alt: 'Бирюзовые каскады Семук-Чампей с высоты', caption: 'Семук-Чампей' },
    { file: 'sights/guatemala-belize/12-ruiny-shunantunich.jpg', alt: 'Пирамида Эль-Кастильо в Шунантуниче', caption: 'Руины Шунантунич' },
    { file: 'sights/guatemala-belize/13-vulkan-pakayya.jpg', alt: 'Вулканы над облаками на рассвете', caption: 'Вулкан Пакайя' },
  ],
  'hong-kong': [
    { file: 'sights/hong-kong/11-khram-vong-tay-sin.jpg', alt: 'Двор храма Вонг Тай Син', caption: 'Храм Вонг Тай Син' },
    { file: 'sights/hong-kong/12-doma-na-svayakh-v-tay-o.jpg', alt: 'Дома на сваях и лодка в Тай-О', caption: 'Дома на сваях в Тай-О' },
    { file: 'sights/hong-kong/13-bukhta-ripals-bey.jpg', alt: 'Пляж Рипалс-Бей и небоскрёбы у гор', caption: 'Бухта Рипалс-Бей' },
  ],
  'iceland': [
    { file: 'sights/iceland/01-vodopad-gyudlfoss.jpg', alt: 'Водопад Гюдльфосс и радуга', caption: 'Водопад Гюдльфосс' },
    { file: 'sights/iceland/11-chernyy-plyazh-reynisfyara.jpg', alt: 'Скала на чёрном пляже Рейнисфьяра', caption: 'Чёрный пляж Рейнисфьяра' },
    { file: 'sights/iceland/02-geyzer-strokkur.jpg', alt: 'Гейзер Строккур выбрасывает столб воды', caption: 'Гейзер Строккур' },
  ],
  'india-goa': [
    { file: 'sights/india-goa/11-khram-shri-mangesh.jpg', alt: 'Храм Шри Мангеш в вечерней подсветке', caption: 'Храм Шри Мангеш' },
    { file: 'sights/india-goa/12-fort-chapora.jpg', alt: 'Стены форта Чапора над морем', caption: 'Форт Чапора' },
    { file: 'sights/india-goa/03-fort-aguada.jpg', alt: 'Маяк форта Агуада над морем', caption: 'Форт Агуада' },
  ],
  'iran': [
    { file: 'sights/iran/01-ploshchad-imama-v-isfakhane.jpg', alt: 'Площадь Имама в Исфахане через арку дворца', caption: 'Площадь Имама в Исфахане' },
    { file: 'sights/iran/11-dom-tabatabai-v-kashane.jpg', alt: 'Двор с бассейном в доме Табатабаи в Кашане', caption: 'Дом Табатабаи в Кашане' },
    { file: 'sights/iran/12-derevnya-abyane.jpg', alt: 'Красная деревня Абьяне среди тополей', caption: 'Деревня Абьяне' },
    { file: 'sights/iran/13-sad-eram-v-shiraze.jpg', alt: 'Бассейн, цветы и дворец в саду Эрам', caption: 'Сад Эрам в Ширазе' },
  ],
  'israel': [
    { file: 'sights/israel/11-bakhayskie-sady-v-khayfe.jpg', alt: 'Террасы Бахайских садов в Хайфе', caption: 'Бахайские сады в Хайфе' },
    { file: 'sights/israel/12-staryy-gorod-akko.jpg', alt: 'Порт Акко, часовая башня и мечеть', caption: 'Старый город Акко' },
    { file: 'sights/israel/13-galileyskoe-more.jpg', alt: 'Причал и лодка на Галилейском море', caption: 'Галилейское море' },
    { file: 'sights/israel/14-korallovyy-plyazh-eylata.jpg', alt: 'Кораллы и рыбы у пляжа Эйлата', caption: 'Коралловый пляж Эйлата' },
  ],
  'japan-hokkaido': [
    { file: 'sights/japan-hokkaido/11-nochnoy-khakodate-s-gory.jpg', alt: 'Огни ночного Хакодате с горы', caption: 'Ночной Хакодате с горы' },
    { file: 'sights/japan-hokkaido/12-ozero-toya.jpg', alt: 'Озеро Тоя и остров посередине', caption: 'Озеро Тоя' },
    { file: 'sights/japan-hokkaido/13-adskaya-dolina-v-nobori-betsu.jpg', alt: 'Пар над Адской долиной в Нобори-бэцу', caption: 'Адская долина в Нобори-бэцу' },
  ],
  'jordan': [
    { file: 'sights/jordan/11-tsitadel-ammana-i-khram-gerakla.jpg', alt: 'Колонны храма Геракла в цитадели Аммана', caption: 'Цитадель Аммана и храм Геракла' },
    { file: 'sights/jordan/12-ushchele-vadi-mudzhib.jpg', alt: 'Водопад в ущелье Вади-Муджиб', caption: 'Ущелье Вади-Муджиб' },
  ],
  'kamchatka': [
    { file: 'sights/kamchatka/11-khalaktyrskiy-plyazh.jpg', alt: 'Чёрный песок Халактырского пляжа и океан', caption: 'Халактырский пляж' },
    { file: 'sights/kamchatka/12-vulkan-gorelyy.jpg', alt: 'Кратер вулкана Горелый с бирюзовым озером и паром', caption: 'Вулкан Горелый' },
    { file: 'sights/kamchatka/04-vulkany-nad-avachinskoy-bukhtoy.jpg', alt: 'Вулканы над Авачинской бухтой', caption: 'Вулканы над Авачинской бухтой' },
  ],
  'karelia': [
    { file: 'sights/karelia/11-gora-vottovaara.jpg', alt: 'Сухие деревья на скалах Воттоваары на закате', caption: 'Гора Воттоваара' },
    { file: 'sights/karelia/12-naberezhnaya-petrozavodska.jpg', alt: 'Набережная Петрозаводска и Онежское озеро', caption: 'Набережная Петрозаводска' },
    { file: 'sights/karelia/04-vodopad-kivach.jpg', alt: 'Водопад Кивач', caption: 'Водопад Кивач' },
  ],
  'kazakhstan': [
    { file: 'sights/kazakhstan/11-ozero-kaindy.jpg', alt: 'Стволы елей в бирюзовом озере Каинды', caption: 'Озеро Каинды' },
    { file: 'sights/kazakhstan/12-poyushchiy-barkhan-v-altyn-emele.jpg', alt: 'Поющий бархан в Алтын-Эмеле', caption: 'Поющий бархан в Алтын-Эмеле' },
    { file: 'sights/kazakhstan/13-katok-medeu.jpg', alt: 'Каток Медеу в горной долине зимой', caption: 'Каток Медеу' },
    { file: 'sights/kazakhstan/04-bayterek-v-astane.jpg', alt: 'Башня Байтерек в Астане вечером', caption: 'Байтерек в Астане' },
  ],
  'kyrgyzstan': [
    { file: 'sights/kyrgyzstan/12-dunganskaya-mechet-v-karakole.jpg', alt: 'Деревянная Дунганская мечеть в Караколе', caption: 'Дунганская мечеть в Караколе' },
    { file: 'sights/kyrgyzstan/03-ushchele-dzhety-oguz.jpg', alt: 'Красные скалы Джеты-Огуза и табун лошадей', caption: 'Ущелье Джеты-Огуз' },
    { file: 'sights/kyrgyzstan/13-karavan-saray-tash-rabat.jpg', alt: 'Каменный караван-сарай Таш-Рабат', caption: 'Караван-сарай Таш-Рабат' },
  ],
  'madagascar': [
    { file: 'sights/madagascar/11-lemur-indri-v-andasibe.jpg', alt: 'Лемур индри на дереве в Андасибе', caption: 'Лемур индри в Андасибе' },
    { file: 'sights/madagascar/12-khameleon-parsona.jpg', alt: 'Зелёный хамелеон в листве', caption: 'Хамелеон Парсона' },
    { file: 'sights/madagascar/13-park-ranomafana.jpg', alt: 'Яркая лягушка-мантелла в парке Раномафана', caption: 'Парк Раномафана' },
  ],
  'mauritius': [
    { file: 'sights/mauritius/11-kuvshinki-v-sadu-pamplemus.jpg', alt: 'Пруд с гигантскими кувшинками в саду Памплемус', caption: 'Кувшинки в саду Памплемус' },
    { file: 'sights/mauritius/12-ostrov-il-o-serf.jpg', alt: 'Остров Иль-о-Серф и лагуна с высоты', caption: 'Остров Иль-о-Серф' },
  ],
  'nepal': [
    { file: 'sights/nepal/02-ozero-feva-v-pokkhare.jpg', alt: 'Озеро Фева и хребет Аннапурна', caption: 'Озеро Фева в Покхаре' },
    { file: 'sights/nepal/03-nosorogi-v-chitvane.jpg', alt: 'Индийские носороги, самка с детёнышем, в высокой траве Читвана', caption: 'Носороги в парке Читван' },
    { file: 'sights/nepal/04-dvortsovaya-ploshchad-bkhaktapura.jpg', alt: 'Дворцовая площадь Бхактапура', caption: 'Дворцовая площадь Бхактапура' },
  ],
  'new-zealand': [
    { file: 'sights/new-zealand/11-izumrudnye-ozera-tongariro.jpg', alt: 'Изумрудные озёра Тонгариро среди вулканических склонов', caption: 'Изумрудные озёра Тонгариро' },
    { file: 'sights/new-zealand/02-khobbiton.jpg', alt: 'Круглая красная дверь норы хоббита в Хоббитоне', caption: 'Хоббитон' },
    { file: 'sights/new-zealand/12-kvinstaun-i-ozero-uakatipu.jpg', alt: 'Квинстаун на берегу озера Уакатипу', caption: 'Квинстаун и озеро Уакатипу' },
    { file: 'sights/new-zealand/04-vay-o-tapu.jpg', alt: 'Горячий источник Шампань-Пул с оранжевым краем в Вай-О-Тапу', caption: 'Вай-О-Тапу' },
  ],
  'norway': [
    { file: 'sights/norway/11-atlanticheskaya-doroga.jpg', alt: 'Атлантическая дорога по островам на закате', caption: 'Атлантическая дорога' },
    { file: 'sights/norway/12-reyne-na-lofotenakh.jpg', alt: 'Рыбацкая деревня Рейне под острыми пиками Лофотенских островов', caption: 'Рейне на Лофотенах' },
    { file: 'sights/norway/13-flomskaya-zheleznaya-doroga.jpg', alt: 'Поезд Фломской дороги в зелёной долине', caption: 'Фломская железная дорога' },
  ],
  'philippines': [
    { file: 'sights/philippines/11-vulkan-mayon.jpg', alt: 'Вулкан Майон над рисовыми полями', caption: 'Вулкан Майон' },
    { file: 'sights/philippines/12-intramuros-v-manile.jpg', alt: 'Ворота форта Сантьяго в Интрамуросе', caption: 'Интрамурос в Маниле' },
    { file: 'sights/philippines/03-belyy-plyazh-borakaya.jpg', alt: 'Белый песок и пальмы на Боракае', caption: 'Белый пляж Боракая' },
    { file: 'sights/philippines/04-risovye-terrasy-banaue.jpg', alt: 'Рисовые террасы и деревня в горах Банауэ', caption: 'Рисовые террасы Банауэ' },
  ],
  'qatar': [
    { file: 'sights/qatar/12-ostrov-zhemchuzhina-v-dokhe.jpg', alt: 'Цветные дома квартала Канат-Квартье на острове Перл-Катар', caption: 'Остров Перл-Катар в Дохе' },
    { file: 'sights/qatar/13-mechet-imama-mukhammada-ibn-abd-al-vakhk.jpg', alt: 'Купола мечети Имама Мухаммада ибн Абд аль-Ваххаба', caption: 'Мечеть Имама Мухаммада ибн Абд аль-Ваххаба' },
  ],
  'raja-ampat': [
    { file: 'sights/raja-ampat/11-manta-u-rifa-radzha-ampat.jpg', alt: 'Манта над рифом Раджа-Ампат', caption: 'Манта у рифа Раджа-Ампат' },
    { file: 'sights/raja-ampat/12-krasnaya-rayskaya-ptitsa.jpg', alt: 'Красная райская птица на ветке в лесу острова Вайгео', caption: 'Красная райская птица на Вайгео' },
    { file: 'sights/raja-ampat/13-plyazh-ostrova-kri.jpg', alt: 'Белый песок и прозрачная вода у острова Кри', caption: 'Пляж острова Кри' },
    { file: 'sights/raja-ampat/14-laguna-serdtse-misool.jpg', alt: 'Лагуна в форме сердца среди скал Мисоола', caption: 'Лагуна-сердце на Мисооле' },
  ],
  'saudi-arabia': [
    { file: 'sights/saudi-arabia/11-bashnya-kingdom-tsentr-v-er-riyade.jpg', alt: 'Небоскрёбы Эр-Рияда и Кингдом-центр вечером', caption: 'Башня Кингдом-центр в Эр-Рияде' },
    { file: 'sights/saudi-arabia/12-gornaya-derevnya-ridzhal-alma.jpg', alt: 'Каменные дома Риджаль-Альмы и цветы', caption: 'Горная деревня Риджаль-Альма' },
    { file: 'sights/saudi-arabia/03-staraya-dzhidda.jpg', alt: 'Дом с деревянными эркерами в старой Джидде', caption: 'Старая Джидда' },
  ],
  'seychelles': [
    { file: 'sights/seychelles/11-chasovaya-bashnya-v-viktorii.jpg', alt: 'Серебристая часовая башня в Виктории', caption: 'Часовая башня в Виктории' },
    { file: 'sights/seychelles/02-dolina-me-na-praslene.jpg', alt: 'Пальмы коко-де-мер в долине Мэ', caption: 'Долина Мэ на Праслене' },
  ],
  'singapore': [
    { file: 'sights/singapore/11-tsvetnoy-dom-tan-teng-nia-v-litl-indii.jpg', alt: 'Разноцветный фасад дома Тан Тенг Ниа', caption: 'Цветной дом Тан Тенг Ниа в Литл-Индии' },
    { file: 'sights/singapore/12-naberezhnaya-klark-ki.jpg', alt: 'Набережная Кларк-Ки ночью', caption: 'Набережная Кларк-Ки' },
    { file: 'sights/singapore/03-merlion.jpg', alt: 'Мерлион на фоне небоскрёбов', caption: 'Мерлион' },
    { file: 'sights/singapore/13-botanicheskiy-sad-singapura.jpg', alt: 'Беседка в Ботаническом саду Сингапура', caption: 'Ботанический сад Сингапура' },
  ],
  'south-africa': [
    { file: 'sights/south-africa/11-kanon-reki-blayd.jpg', alt: 'Зелёный каньон реки Блайд', caption: 'Каньон реки Блайд' },
    { file: 'sights/south-africa/12-vinogradniki-stellenbosa.jpg', alt: 'Виноградники Стелленбоса под горами', caption: 'Виноградники Стелленбоса' },
    { file: 'sights/south-africa/03-park-kryugera.jpg', alt: 'Слонёнок в парке Крюгера', caption: 'Парк Крюгера' },
    { file: 'sights/south-africa/13-botanicheskiy-sad-kirstenbosh.jpg', alt: 'Алоэ и тропинки в саду Кирстенбош', caption: 'Ботанический сад Кирстенбош' },
  ],
  'sumatra-kalimantan': [
    { file: 'sights/sumatra-kalimantan/11-chasovaya-bashnya-dzham-gadang-v-bukitti.jpg', alt: 'Часовая башня Джам-Гаданг в Букиттинги', caption: 'Часовая башня Джам-Гаданг в Букиттинги' },
    { file: 'sights/sumatra-kalimantan/12-ozero-manindzhau.jpg', alt: 'Озеро Манинджау на закате', caption: 'Озеро Манинджау' },
    { file: 'sights/sumatra-kalimantan/03-tandzhung-puting.jpg', alt: 'Лодки-клотоки на реке в Танджунг-Путинге', caption: 'Танджунг-Путинг' },
    { file: 'sights/sumatra-kalimantan/04-kanon-sianok.jpg', alt: 'Каньон Сианок и гора за ним', caption: 'Каньон Сианок' },
  ],
  'switzerland': [
    { file: 'sights/switzerland/11-spiralnyy-viaduk-berninskoy-dorogi-v-bru.jpg', alt: 'Красный поезд на спиральном виадуке в Брузио', caption: 'Спиральный виадук Бернинской дороги в Брузио' },
    { file: 'sights/switzerland/12-staryy-bern.jpg', alt: 'Старый Берн в излучине реки Аре', caption: 'Старый Берн' },
    { file: 'sights/switzerland/13-yungfrauyokh.jpg', alt: 'Обсерватория Сфинкс на Юнгфрауйохе', caption: 'Юнгфрауйох' },
    { file: 'sights/switzerland/04-shilonskiy-zamok.jpg', alt: 'Шильонский замок на Женевском озере', caption: 'Шильонский замок' },
  ],
  'tajikistan': [
    { file: 'sights/tajikistan/12-dvorets-navruz-v-dushanbe.jpg', alt: 'Дворец Навруз в Душанбе', caption: 'Дворец Навруз в Душанбе' },
    { file: 'sights/tajikistan/04-vakhanskaya-dolina.jpg', alt: 'Ваханская долина и горы', caption: 'Ваханская долина' },
  ],
  'tanzania': [
    { file: 'sights/tanzania/11-slony-i-baobaby-tarangire.jpg', alt: 'Стадо слонов под баобабами в Тарангире', caption: 'Слоны и баобабы Тарангире' },
    { file: 'sights/tanzania/12-ozero-manyara.jpg', alt: 'Зебры у озера Маньяра', caption: 'Озеро Маньяра' },
  ],
  'usa': [
    { file: 'sights/usa/11-kanon-antilopy.jpg', alt: 'Свет в узком каньоне Антилопы', caption: 'Каньон Антилопы' },
    { file: 'sights/usa/12-dolina-monumentov.jpg', alt: 'Дорога к столовым горам Долины монументов', caption: 'Долина монументов' },
    { file: 'sights/usa/13-istochnik-grand-prizmatik-v-yelloustone.jpg', alt: 'Радужный источник Гранд-Призматик сверху', caption: 'Источник Гранд-Призматик в Йеллоустоне' },
    { file: 'sights/usa/14-oushen-drayv-v-mayami-bich.jpg', alt: 'Отели в стиле ар-деко на Оушен-драйв', caption: 'Оушен-драйв в Майами-Бич' },
  ],
  'uzbekistan': [
    { file: 'sights/uzbekistan/11-mavzoley-gur-emir.jpg', alt: 'Мавзолей Гур-Эмир в Самарканде вечером', caption: 'Мавзолей Гур-Эмир' },
    { file: 'sights/uzbekistan/12-chor-minor-v-bukhare.jpg', alt: 'Четыре минарета Чор-Минора в Бухаре', caption: 'Чор-Минор в Бухаре' },
    { file: 'sights/uzbekistan/13-ansambl-lyabi-khauz.jpg', alt: 'Пруд и медресе ансамбля Ляби-Хауз', caption: 'Ансамбль Ляби-Хауз' },
    { file: 'sights/uzbekistan/14-mechet-minor-v-tashkente.jpg', alt: 'Резной свод мечети Минор в Ташкенте', caption: 'Мечеть Минор в Ташкенте' },
  ],
};
