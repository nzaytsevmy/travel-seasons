// One editorial record per entry regime. An expired or missing fact is unknown.
const CHECKED = '2026-11-06';
const REVIEW = '2026-12-06';
const CONSULAR = 'https://www.kdmid.ru/info-for-traveling-abroad/reference-information-for-traveling-abroad/list-of-countries-with-simplified-entry/';
const AIR_DOCUMENTS = 'https://www.aeroflot.ru/info/booking-rules/';
const EGYPT_VISA = 'https://www.visa2egypt.gov.eg/eVisa/FAQ';
const EGYPT_APPLICATION = 'https://www.visa2egypt.gov.eg/eVisa/Home';
const EGYPT_ENTRY = 'https://www.experienceegypt.eg/en/UsefulInfo';
const EGYPT_CONSULAR = 'https://www.kdmid.ru/docs/egypt/information-about-the-country/';
const THAI_VISA = 'https://moscow.thaiembassy.org/en/publicservice/revision-of-thailand-s-visa-exemption-and-visa-on-arrival-schemes';
const THAI_ARRIVAL = 'https://tdac.immigration.go.th/manual/en/faq.html';
const TURKEY_VISA = 'https://www.mfa.gov.tr/consular-info.ru.mfa';
const JAPAN_VISA = 'https://www.ru.emb-japan.go.jp/itpr_ja/visashinsei.html';
const JAPAN_TOURISM = 'https://www.ru.emb-japan.go.jp/itpr_ja/tourism2022.html';
const JAPAN_SHORT_STAY = 'https://www.ru.emb-japan.go.jp/itpr_ru/documents.html';
const SCHENGEN = 'https://www.consilium.europa.eu/en/policies/schengen-area/';

function fact(value, source, reviewAfter = REVIEW) {
  return { value, source, checkedAt: CHECKED, reviewAfter };
}

const DOMESTIC = {
  mode: fact('domestic', AIR_DOCUMENTS, '2027-02-04'),
  summary: fact('Для поездки по России без пересечения границы загранпаспорт не нужен.', AIR_DOCUMENTS, '2027-02-04'),
  documents: fact('Возьмите внутренний паспорт РФ или другой документ, на который оформлен билет. Для ребёнка заранее проверьте документы у перевозчика.', AIR_DOCUMENTS, '2027-02-04'),
  official: AIR_DOCUMENTS,
};

const RULES = {
  egypt: {
    mode: fact('evisa', EGYPT_VISA),
    summary: fact('Для большинства туристических поездок в Египет нужна виза. С российским загранпаспортом можно подать на eVisa заранее или оформить визу в аэропорту прилёта.', EGYPT_CONSULAR),
    documents: fact('Для въезда по eVisa подготовьте загранпаспорт со сроком действия от 6 месяцев на дату прибытия, распечатанную визу, маршрут и подтверждение проживания.', EGYPT_VISA),
    feeUsd: fact(30, EGYPT_VISA),
    fee: fact('Однократная eVisa — $30, многократная — $65.', EGYPT_VISA),
    processing: fact('Подайте заявление на eVisa не позднее чем за 7 дней до вылета. При оформлении в аэропорту уточните порядок для вашего пункта въезда.', EGYPT_APPLICATION),
    exception: fact('При прямом въезде в Южный Синай через Шарм-эш-Шейх, Нувейбу или Табу для короткой поездки по региону может подойти бесплатный синайский штамп. Уточните разрешённый срок для своего пункта въезда. Для поездок за пределы Южного Синая нужна виза.', EGYPT_ENTRY),
    application: fact(EGYPT_APPLICATION, EGYPT_APPLICATION),
    official: EGYPT_VISA,
  },
  thailand: {
    mode: fact('free', THAI_VISA),
    feeUsd: fact(0, THAI_VISA),
    summary: fact('Владельцы обычного российского загранпаспорта могут въехать в Таиланд без визы на срок до 30 дней по двустороннему соглашению.', THAI_VISA),
    stay: fact('До 30 дней по двустороннему соглашению.', THAI_VISA),
    stayDays: fact(30, THAI_VISA),
    documents: fact('Подготовьте действующий загранпаспорт и данные о проживании. Заполните бесплатную цифровую карту TDAC в течение трёх дней до прибытия, включая день въезда.', THAI_ARRIVAL),
    fee: fact('При поездке по безвизовому соглашению визовый сбор не взимается.', THAI_VISA),
    processing: fact('При безвизовой поездке виза заранее не нужна. Для другого срока или цели проверьте подходящую визу на портале Таиланда.', THAI_VISA),
    exception: fact('При пересадке без прохождения иммиграционного контроля TDAC не требуется. Если нужно выйти из транзитной зоны и пройти контроль, заполните карту.', THAI_ARRIVAL),
    arrivalCard: fact('https://tdac.immigration.go.th/', THAI_ARRIVAL),
    application: fact('https://www.thaievisa.go.th/', THAI_VISA),
    official: THAI_VISA,
  },
  turkey: {
    mode: fact('free', TURKEY_VISA),
    feeUsd: fact(0, TURKEY_VISA),
    summary: fact('Владельцам обычного российского паспорта для туристической поездки в Турцию до 60 дней виза не требуется.', TURKEY_VISA),
    stay: fact('До 60 дней за туристическую поездку.', TURKEY_VISA),
    stayDays: fact(60, TURKEY_VISA),
    official: TURKEY_VISA,
  },
  japan: {
    mode: fact('required', JAPAN_VISA),
    summary: fact('Для туристической поездки в Японию с обычным российским загранпаспортом нужна виза заранее.', JAPAN_VISA),
    documents: fact('Для туристической визы подготовьте загранпаспорт, анкеты с фото, программу пребывания и подтверждения поездки и средств. Сверьте полный комплект у ведомства, куда подаёте документы.', JAPAN_TOURISM),
    stay: fact('Краткосрочная категория — до 90 дней. Разрешённый срок конкретной поездки проверяйте по выданной визе и отметке о въезде.', JAPAN_SHORT_STAY),
    processing: fact('В Москве принимают заявления в Визовом центре Японии. Минимальный срок рассмотрения полного комплекта — 4 рабочих дня.', JAPAN_VISA),
    fee: fact('Консульский сбор для граждан РФ не взимается. Сервисный сбор уточните при записи.', JAPAN_VISA),
    application: fact('https://visa.vfsglobal.com/rus/ru/jpn/apply-visa', JAPAN_VISA),
    official: JAPAN_VISA,
  },
};

const LABELS = {
  domestic: 'По России',
  free: 'Без визы',
  evisa: 'Онлайн',
  arrival: 'По прибытии',
  required: 'Виза заранее',
  unknown: 'Уточнить правила',
};

const dateFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
});

function readFact(record, today) {
  return record && record.checkedAt <= today && today < record.reviewAfter ? record.value : null;
}

export function getEntryRequirements(direction, today = dateFormat.format(new Date())) {
  const slug = direction.slug === 'japan-hokkaido' ? 'japan' : direction.slug;
  const rule = direction.domestic ? DOMESTIC : RULES[slug];
  const mode = direction.domestic ? 'domestic' : readFact(rule?.mode, today) || 'unknown';
  const keys = ['summary', 'documents', 'stay', 'stayDays', 'fee', 'feeUsd', 'processing', 'exception', 'arrivalCard', 'application'];
  const facts = Object.fromEntries(keys.map((key) => [key, readFact(rule?.[key], today)]));
  return { mode, label: LABELS[mode], official: rule?.official || CONSULAR, ...facts };
}

const CATALOG_FACTS = {
  schengen: fact('Болгария и Румыния полностью входят в Шенген с 1 января 2025 года. Кипр остаётся отдельным направлением с собственными правилами.', SCHENGEN, '2027-02-04'),
  japan: RULES.japan.processing,
  electronic: fact('Электронную визу оформляют через официальный портал. Комплект документов и способ оплаты зависят от страны.', EGYPT_VISA, '2027-02-04'),
};

export function visaCatalogFact(key, today = dateFormat.format(new Date())) {
  return readFact(CATALOG_FACTS[key], today);
}
