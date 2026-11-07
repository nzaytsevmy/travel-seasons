// One editorial record per entry regime. An expired or missing fact is unknown.
const CHECKED = '2026-11-06';
const REVIEW = '2026-12-06';
const CONSULAR = 'https://www.kdmid.ru/info-for-traveling-abroad/reference-information-for-traveling-abroad/list-of-countries-with-simplified-entry/';
const AIR_DOCUMENTS = 'https://www.aeroflot.ru/info/booking-rules/';
const EGYPT_VISA = 'https://www.visa2egypt.gov.eg/eVisa/FAQ';
const THAI_VISA = 'https://moscow.thaiembassy.org/en/publicservice/revision-of-thailand-s-visa-exemption-and-visa-on-arrival-schemes';
const TURKEY_VISA = 'https://www.mfa.gov.tr/consular-info.ru.mfa';
const JAPAN_VISA = 'https://www.ru.emb-japan.go.jp/itpr_ja/visashinsei.html';
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
    summary: fact('Для туристической поездки в Египет с российским загранпаспортом можно оформить электронную визу.', EGYPT_VISA),
    documents: fact('Для въезда по eVisa подготовьте загранпаспорт со сроком действия от 6 месяцев на дату прибытия, распечатанную визу, маршрут и подтверждение проживания.', EGYPT_VISA),
    feeUsd: fact(30, EGYPT_VISA),
    fee: fact('30 долларов за однократную eVisa, 65 долларов за многократную.', EGYPT_VISA),
    official: EGYPT_VISA,
  },
  thailand: {
    mode: fact('free', THAI_VISA),
    feeUsd: fact(0, THAI_VISA),
    summary: fact('Владельцы обычного российского загранпаспорта могут въехать в Таиланд без визы на срок до 30 дней по двустороннему соглашению.', THAI_VISA),
    stay: fact('До 30 дней по двустороннему соглашению.', THAI_VISA),
    stayDays: fact(30, THAI_VISA),
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
    processing: fact('В Москве принимают заявления в Визовом центре Японии. Минимальный срок рассмотрения полного комплекта — 4 рабочих дня.', JAPAN_VISA),
    fee: fact('Консульский сбор для граждан РФ не взимается. Сервисный сбор уточните при записи.', JAPAN_VISA),
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
  const keys = ['summary', 'documents', 'stay', 'stayDays', 'fee', 'feeUsd', 'processing', 'exception'];
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
