import { VISA_DETAILS } from './visa-details.js';

// The dated records below override the existing country guide. A country that
// has not migrated to the new format must keep its specific published data;
// the generic defaults in getVisaDetails() are deliberately never imported.
// Expired migrated records must not fall back to older, undated values.
const CHECKED = '2026-11-06';
const REVIEW = '2026-12-06';
// Restoration of the existing country guides is not a fresh verification of
// every legacy fee. It has a review deadline, and never uses generic defaults.
const LEGACY_REVIEW_AFTER = '2026-12-06';
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
const JAPAN_CENTRE = 'https://visa.vfsglobal.com/rus/ru/jpn/attend-centre/moscow';
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
    stay: { ...fact('До 30 дней по туристической визе.', EGYPT_CONSULAR), checkedAt: '2026-11-07' },
    stayDays: { ...fact(30, EGYPT_CONSULAR), checkedAt: '2026-11-07' },
    processing: { ...fact('Подайте заявление на eVisa не позднее чем за 7 дней до вылета. В аэропорту визу приобретают до паспортного контроля; подготовьте наличные доллары для банковской стойки.', EGYPT_APPLICATION), additionalSources: [EGYPT_ENTRY], checkedAt: '2026-11-07' },
    exception: { ...fact('При прямом въезде через Шарм-эш-Шейх, Нувейбу или Табу на срок до 15 дней действует бесплатный синайский штамп. Он позволяет путешествовать по Южному Синаю, включая Дахаб. Для поездки в Каир, Луксор, Хургаду или за пределы региона, а также для более долгого отдыха нужна виза.', EGYPT_ENTRY), checkedAt: '2026-11-07' },
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
    documents: { ...fact('Загранпаспорт; два экземпляра анкеты с фото 35 × 45 мм; копии внутреннего паспорта; оригинал банковской выписки, документы о занятости, программа пребывания и бронь авиабилетов.', JAPAN_TOURISM), checkedAt: '2026-11-07' },
    documentList: { ...fact([
      'Загранпаспорт без обложки.',
      'Два экземпляра анкеты на английском или японском языке. На каждый наклейте фото 35 × 45 мм, поставьте подпись и дату.',
      'Копии страниц внутреннего паспорта с фотографией и регистрацией; если сняты с учёта — также следующий пустой разворот.',
      'Оригинал справки или выписки о собственных средствах из российского банка с печатью и подписью сотрудника. Распечатка из личного кабинета и справка по кредитному счёту не подходят.',
      'Подтверждение занятости: работающим — оригинал справки с должностью, стажем и зарплатой; при отсутствии зарплаты в справке — также 2-НДФЛ. По договору ГПХ — договор и 2-НДФЛ.',
      'ИП — выписка из ЕГРИП и подтверждение налоговых доходов; самозанятым — справки о постановке на учёт и доходах НПД; студентам — справка из учебного заведения; пенсионерам — копия пенсионного свидетельства.',
      'Программа пребывания на английском или японском языке: даты въезда и выезда, рейсы, план поездки, названия, адреса и телефоны отелей.',
      'Подтверждение бронирования авиабилетов. При совместной семейной поездке — копии свидетельств о браке и рождении детей.',
      'Для несовершеннолетнего — спонсорское письмо, подтверждение родства, оригиналы справок о работе и средствах спонсора. Для многократной визы — письмо о необходимости повторных поездок и подтверждение дохода.',
    ], JAPAN_TOURISM), checkedAt: '2026-11-07' },
    stay: fact('Краткосрочная категория — до 90 дней. Разрешённый срок конкретной поездки проверяйте по выданной визе и отметке о въезде.', JAPAN_SHORT_STAY),
    processing: fact('В Москве принимают заявления в Визовом центре Японии. Минимальный срок рассмотрения полного комплекта — 4 рабочих дня.', JAPAN_VISA),
    fee: { ...fact('Консульский сбор для граждан РФ — 0 ₽. Сервисный сбор визового центра в Москве — 970 ₽.', JAPAN_VISA), additionalSources: [JAPAN_CENTRE], checkedAt: '2026-11-07' },
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
  unknown: 'Правила въезда',
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
  if (!rule && VISA_DETAILS[direction.slug] && today < LEGACY_REVIEW_AFTER) {
    const existing = VISA_DETAILS[direction.slug];
    const mode = ({ jordan: 'free', 'saudi-arabia': 'free', singapore: 'required', mexico: 'evisa',
      nepal: 'arrival', madagascar: 'arrival', bali: 'arrival', 'sumatra-kalimantan': 'arrival', 'raja-ampat': 'arrival',
      antarctica: 'route', 'guatemala-belize': 'route',
    })[direction.slug] ?? direction.visa;
    // Restore the country classification without representing every old fee
    // and registration deadline as a newly verified catalogue fact. The full
    // existing country guide remains available at /visa/<slug>/.
    const label = ({ antarctica: 'Документы для экспедиции', 'guatemala-belize': 'Правила для двух стран',
      finland: 'Туристический въезд ограничен', norway: 'Туристический въезд ограничен',
    })[direction.slug] ?? LABELS[mode];
    return { mode, label, summary: existing.summary ?? null, documents: existing.docs ?? null,
      stay: null, stayDays: null, fee: null, feeUsd: null, processing: null,
      exception: null, arrivalCard: null, application: null, documentList: null,
      official: CONSULAR, legacy: true, reviewAfter: LEGACY_REVIEW_AFTER };
  }
  const mode = direction.domestic ? 'domestic' : readFact(rule?.mode, today) || 'unknown';
  const keys = ['summary', 'documents', 'documentList', 'stay', 'stayDays', 'fee', 'feeUsd', 'processing', 'exception', 'arrivalCard', 'application'];
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
