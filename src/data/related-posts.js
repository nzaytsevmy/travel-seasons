// Перелинковка «хаб страны → блог-гайды». Вынесено из directions.js сознательно:
// freshness-gate требует бамп DATA_UPDATED за правку src/data/*, но DATA_UPDATED —
// это дата «цены и визовые правила проверены». Добавление ссылки на новую статью
// фактуру не трогает, и бампать за него дату = врать о проверке данных.
// Тот же приём, что для affiliate.js (трекинг-плумбинг, не датированная фактура).

export const RELATED_POSTS = {
  'abkhazia': [
    { slug: 'abkhazia-2026', title: 'Абхазия 2026: стоит ли ехать, цены, как добраться', kind: 'guide' },
    { slug: 'zagranpasport-v-abhaziyu-2026', title: 'Нужен ли загранпаспорт в Абхазию — документы на границе', kind: 'visa' },
    { slug: 'chto-privezti-iz-abhazii-2026', title: 'Что привезти из Абхазии — еда, вино и что не пустят через границу', kind: 'guide' },
    { slug: 'skolko-stoit-nedelya-v-rossii-2026', title: 'Сколько стоит неделя в России и Абхазии 2026: пять направлений', kind: 'guide' },
  ],
  'japan': [
    { slug: 'japan-guide-2026', title: 'Япония 2026: гайд без воды', kind: 'guide' },
    { slug: 'japan-visa-2026', title: 'Виза в Японию для россиян 2026', kind: 'visa' },
    { slug: 'japan-golden-week-2026', title: 'Золотая неделя в Японии 2026', kind: 'season' },
  ],
  'south-korea': [
    { slug: 'south-korea-visa-2026', title: 'Виза в Южную Корею 2026: K-ETA, сроки, что спросят на границе', kind: 'visa' },
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
  'india-goa': [
    { slug: 'goa-guide-2026', title: 'Отдых на Гоа 2026: сезон, цены, Северный или Южный', kind: 'guide' },
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
    { slug: 'georgia-insurance-2026', title: 'Страховка в Грузию: что требует закон и сколько стоит полис', kind: 'insurance' },
    { slug: 'pay-georgia-2026', title: 'Как платить в Грузии: карты РФ не работают', kind: 'guide' },
    { slug: 'turkey-guide-2026', title: 'Турция 2026 — соседнее безвизовое направление', kind: 'guide' },
  ],
  'turkey': [
    { slug: 'turkey-guide-2026', title: 'Турция 2026 россиянам: безвиз, цены, маршрут', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
    { slug: 'esim-zagranicey-2026', title: 'Связь за границей 2026: eSIM и SIM', kind: 'guide' },
    { slug: 'cappadocia-2026', title: 'Каппадокия 2026: полёт на шаре, цена, как добраться', kind: 'guide' },
  ],
  'uganda': [
    { slug: 'uganda-safari-2026', title: 'Уганда 2026: гориллы Бвинди и сафари', kind: 'guide' },
  ],
  'ecuador': [
    { slug: 'galapagos-2026', title: 'Галапагосы 2026: что я видел и сколько стоит', kind: 'guide' },
    { slug: 'amazonia-ecuador-2026', title: 'Амазония после Галапагосов: джунгли Эквадора, цены и кого видно', kind: 'guide' },
  ],
  'new-zealand': [
    { slug: 'aurora-new-zealand-2026', title: 'Южное сияние в Новой Зеландии 2026', kind: 'guide' },
    { slug: 'milford-sound-2026', title: 'Милфорд-Саунд 2026: каяк и круиз', kind: 'guide' },
  { slug: 'roys-peak-2026', title: 'Roys Peak: подъём к главному кадру Новой Зеландии', kind: 'guide' },
  ],
  'bolivia': [
    { slug: 'bolivia-guide-2026', title: 'Боливия 2026: тур по Уюни за $130, безвиз 90 дней', kind: 'guide' },
    { slug: 'peru-guide-2026', title: 'Перу 2026 — соседний маршрут (Мачу-Пикчу)', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'argentina': [
    { slug: 'patagonia-2026', title: 'Патагония своим ходом: Фицрой, Перито-Морено и переход в Чили', kind: 'guide' },
    { slug: 'chile-guide-2026', title: 'Чили 2026: Патагония и Атакама за $1500, безвиз', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
  ],
  'chile': [
    { slug: 'chile-guide-2026', title: 'Чили 2026: Патагония и Атакама за $1500, безвиз', kind: 'guide' },
    { slug: 'peru-guide-2026', title: 'Перу 2026 — соседний маршрут (Мачу-Пикчу)', kind: 'guide' },
    { slug: 'pay-abroad-2026', title: 'Как платить за границей россиянам 2026', kind: 'guide' },
    { slug: 'patagonia-2026', title: 'Патагония своим ходом: Фицрой, Перито-Морено и переход в Чили', kind: 'guide' },
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
    { slug: 'skolko-stoit-nedelya-v-rossii-2026', title: 'Сколько стоит неделя в России и Абхазии 2026: пять направлений', kind: 'guide' },
  ],
  'dagestan': [
    { slug: 'dagestan-guide-2026', title: 'Отдых в Дагестане 2026: маршрут, цены, без машины', kind: 'guide' },
    { slug: 'skolko-stoit-nedelya-v-rossii-2026', title: 'Сколько стоит неделя в России и Абхазии 2026: пять направлений', kind: 'guide' },
  ],
  'altai': [
    { slug: 'altai-guide-2026', title: 'Отдых на Алтае 2026: маршрут, цены, когда ехать', kind: 'guide' },
    { slug: 'skolko-stoit-nedelya-v-rossii-2026', title: 'Сколько стоит неделя в России и Абхазии 2026: пять направлений', kind: 'guide' },
  ],
  'karelia': [
    { slug: 'kareliya-guide-2026', title: 'Карелия 2026: что посмотреть, как добраться, цены', kind: 'guide' },
    { slug: 'gornyy-park-ruskeala-2026', title: 'Горный парк Рускеала 2026: билеты, как добраться', kind: 'guide' },
    { slug: 'ostrov-kizhi-2026', title: 'Остров Кижи 2026: метеор, билеты, что посмотреть', kind: 'guide' },
    { slug: 'ostrov-valaam-2026', title: 'Остров Валаам 2026: как добраться, монастырь', kind: 'guide' },
    { slug: 'skolko-stoit-nedelya-v-rossii-2026', title: 'Сколько стоит неделя в России и Абхазии 2026: пять направлений', kind: 'guide' },
  ],
  'morocco': [
    { slug: 'morocco-guide-2026', title: 'Марокко 2026: безвиз 90 дней, маршрут, цены', kind: 'guide' },
  ],
  'kenya': [
    { slug: 'kenya-guide-2026', title: 'Кения 2026: сафари, виза eTA, бюджет', kind: 'guide' },
  ],
  'armenia': [
    { slug: 'armenia-guide-2026', title: 'Армения 2026 для россиян: безвиз, внутренний паспорт, цены', kind: 'guide' },
  ],
  'azerbaijan': [
    { slug: 'azerbaijan-guide-2026', title: 'Азербайджан 2026 для россиян: виза, Баку, цены', kind: 'guide' },
  ],
  'sri-lanka': [
    { slug: 'sri-lanka-guide-2026', title: 'Шри-Ланка 2026 для россиян: виза бесплатно, сезоны, цены', kind: 'guide' },
  ],
};
