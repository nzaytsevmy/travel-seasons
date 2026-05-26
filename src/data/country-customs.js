// Таможенные ограничения по странам — что нельзя ввозить, лимиты на валюту/алкоголь/сигареты.
// Используется в EssentialsCard.astro (секция «Таможня»).
//
// YMYL-контент: каждый факт = первоисточник. При несоответствии — приоритет
// официального таможенного сайта страны (customs.go.jp, gtb.gov.ge и аналоги).
//
// Каденс ревизии: ≤180 дней; перед сезоном — обязательно (правила меняются).

export const CUSTOMS = {
  'bali': {
    forbidden: [
      'Наркотики (смертная казнь за траффик в Индонезии — реальная)',
      'Порнография и материалы, противоречащие исламу/традициям',
      'Оружие и боеприпасы',
      'Свежие фрукты, овощи, мясные продукты',
      'Растения и почва без сертификата',
      'Дроны без разрешения Kominfo'
    ],
    limits: {
      cash: 'свыше 100 000 000 IDR (~$6 500) обязательно декларировать',
      alcohol: '1 л (один сосуд)',
      cigarettes: '200 шт (1 блок) или 50 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Bali.com — Customs', url: 'https://bali.com/bali/travel-guide/practical-tips-must-know/indonesia-customs-regulations/' },
      { name: 'Bali Holiday Secrets — Customs Form', url: 'https://www.baliholidaysecrets.com/bali-customs-declaration-form/' }
    ],
    updated: '2026-05-26'
  },

  'uae': {
    forbidden: [
      'Наркотики (включая CBD-продукты, мак, гашиш — реальные сроки)',
      'Порнография и материалы, оскорбляющие ислам',
      'Свинина и продукты из свинины',
      'Электронные сигареты/vape с никотином — серая зона, лучше не брать',
      'Дроны без разрешения GCAA',
      'E-сигареты разрешены, но vaping с наркосодержащим — преступление'
    ],
    limits: {
      cash: 'свыше 60 000 AED (~$16 000) декларировать',
      alcohol: '4 л крепкого ИЛИ 24 банки пива (выбрать одно; только non-Muslim 21+)',
      cigarettes: '400 шт (2 блока) или 50 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Dubai Customs — Permitted Items', url: 'https://www.dubaicustoms.gov.ae/en/mobile/Pages/PermittedLuggageItems.aspx' },
      { name: 'UAE Government — Customs', url: 'https://u.ae/en/information-and-services/finance-and-investment/clearing-the-customs-and-paying-customs-duty' }
    ],
    updated: '2026-05-26'
  },

  'vietnam': {
    forbidden: [
      'Наркотики и психотропные вещества (строгие сроки)',
      'Оружие, боеприпасы, взрывчатка',
      'Порнография',
      'Свежие фрукты, овощи, мясо без сертификата',
      'Антиквариат без разрешения Минкультуры',
      'С 15 апреля 2026 — обязательная pre-arrival декларация через Tan Son Nhat'
    ],
    limits: {
      cash: 'свыше $5 000 USD или 15 000 000 VND декларировать',
      alcohol: '1.5 л крепкого + 2 л вина + 3 л пива',
      cigarettes: '200 шт (1 блок) или 100 сигарет',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Vietnam.vn — 2026 Entry Regulations', url: 'https://www.vietnam.vn/en/cap-nhat-quy-dinh-nhap-canh-viet-nam-2026' },
      { name: 'Vietnam News — Pre-arrival Declaration', url: 'https://vietnamnews.vn/politics-laws/1779712/mandatory-pre-arrival-declaration-rolled-out-for-entrants-into-viet-nam.html' }
    ],
    updated: '2026-05-26'
  },

  'armenia': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Огнестрельное оружие без разрешения',
      'Антиквариат и культурные ценности без разрешения Минкультуры',
      'Контрафакт',
      'Растения и продукты без фитосанитарного сертификата'
    ],
    limits: {
      cash: 'свыше 10 000 USD (или эквивалент) декларировать',
      alcohol: '2 л',
      cigarettes: '200 шт (1 блок)',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Customs of Armenia (customs.am)', url: 'https://www.customs.am/' },
      { name: 'Посольство РФ в Армении', url: 'https://armenia.mid.ru/' }
    ],
    updated: '2026-05-26'
  },

  'sri-lanka': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Оружие и боеприпасы',
      'Изображения с религиозной символикой буддизма как декор/татуировки (депортация)',
      'Контрафакт',
      'E-сигареты/vape (полный запрет с 2022)',
      'Свежие фрукты, овощи, мясные продукты'
    ],
    limits: {
      cash: 'свыше $15 000 USD декларировать',
      alcohol: '1.5 л крепкого + 2 л вина или пива',
      cigarettes: '200 шт (1 блок)',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Sri Lanka Customs', url: 'https://www.customs.gov.lk/' },
      { name: 'Trade.gov — Sri Lanka Restrictions', url: 'https://www.trade.gov/country-commercial-guides/sri-lanka-prohibited-and-restricted-imports' }
    ],
    updated: '2026-05-26'
  },

  'maldives': {
    forbidden: [
      'Алкоголь (запрет ввоза для туристов; есть только на курортах)',
      'Свинина и продукты из свинины',
      'Религиозные материалы не-исламских религий',
      'Порнография',
      'Наркотики (смертная казнь возможна)',
      'Снаряжение для подводной охоты'
    ],
    limits: {
      cash: 'свыше $10 000 USD (или эквивалент) декларировать',
      alcohol: '⛔ запрещён полностью (только на курортах)',
      cigarettes: '200 шт (1 блок)',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Maldives Customs', url: 'https://www.customs.gov.mv/' },
      { name: 'Maldives Tourism Ministry', url: 'https://www.tourism.gov.mv/' }
    ],
    updated: '2026-05-26'
  },

  'kenya': {
    forbidden: [
      'Пластиковые пакеты — полный запрет (даже duty-free пакеты! штраф до $40 000)',
      'Наркотики и психотропные вещества',
      'Оружие и боеприпасы без разрешения',
      'Мясо и мясные продукты без сертификата',
      'Контрафакт',
      'Слоновая кость и продукты CITES (рога носорога, шкуры)'
    ],
    limits: {
      cash: 'свыше $10 000 USD декларировать',
      alcohol: '1 л',
      cigarettes: '250 г табака (~200 сигарет)',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Kenya Revenue Authority — Prohibited Items', url: 'https://www.kra.go.ke/' },
      { name: 'Trade.gov — Kenya Restrictions', url: 'https://www.trade.gov/country-commercial-guides/kenya-prohibited-and-restricted-imports' }
    ],
    updated: '2026-05-26'
  },

  'mexico': {
    forbidden: [
      'Наркотики (включая марихуану — non-medical использование криминализовано)',
      'Огнестрельное оружие и боеприпасы (строгий запрет, реальные сроки)',
      'Свежие мясные/молочные продукты без сертификата',
      'Птица и яйца',
      'Семена растений без сертификата',
      'Электронные сигареты — vape запрещён с 2022'
    ],
    limits: {
      cash: 'свыше $10 000 USD (или эквивалент) декларировать',
      alcohol: '3 л + 6 л вина/пива',
      cigarettes: '200 шт (1 блок) или 50 сигар',
      perfume: 'duty-free до $500 USD общих покупок (наземно $300)'
    },
    sources: [
      { name: 'SAT Aduanas (sat.gob.mx)', url: 'https://www.sat.gob.mx/' },
      { name: 'Посольство РФ в Мексике', url: 'https://mexico.mid.ru/' }
    ],
    updated: '2026-05-26'
  },

  'turkey': {
    forbidden: [
      'Антиквариат и археологические артефакты (тяжкие санкции при вывозе)',
      'Наркотики и психотропные вещества',
      'Рецептурные медикаменты без оригинального рецепта',
      'Свежие мясные и молочные продукты',
      'Дроны без разрешения Гражданской авиации (DGCA)',
      'Холодное и огнестрельное оружие'
    ],
    limits: {
      cash: 'до 10 000 USD без декларации',
      alcohol: '1 л крепкого + 1 л вина',
      cigarettes: '600 шт (3 блока) или 50 сигар',
      perfume: '5 ед. до 120 мл'
    },
    sources: [
      { name: 'Trade.gov — Turkey Prohibited Imports', url: 'https://www.trade.gov/country-commercial-guides/turkey-prohibited-and-restricted-imports' },
      { name: 'Посольство РФ в Турции (turkey.mid.ru)', url: 'https://turkey.mid.ru/' }
    ],
    updated: '2026-05-26'
  },

  'thailand': {
    forbidden: [
      'Наркотики (рекреационная марихуана криминализована повторно с 2024)',
      'E-сигареты и vape — полный запрет с 2014, штраф и/или тюрьма',
      'Поддельные товары и контрафакт под защитой авторских прав',
      'Свежие фрукты и овощи (фитосанитарный риск)',
      'Семена растений без сертификата',
      'Дроны без регистрации в CAAT'
    ],
    limits: {
      cash: 'до 20 000 USD без декларации',
      alcohol: '1 л',
      cigarettes: '200 шт (1 блок) — превышение конфискуется',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Thai Customs (customs.go.th)', url: 'https://www.customs.go.th/' },
      { name: 'Посольство РФ в Таиланде', url: 'https://thailand.mid.ru/' }
    ],
    updated: '2026-05-26'
  },

  'georgia': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Контрафакт и пиратские товары',
      'Растения и продукты без фитосанитарного сертификата',
      'Ядерные материалы',
      'Порнография',
      'Огнестрельное оружие без разрешения МВД'
    ],
    limits: {
      cash: 'до 30 000 GEL (или эквивалент) без декларации',
      alcohol: '4 л',
      cigarettes: '400 шт (2 блока) или 50 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Trade.gov — Georgia Prohibited Items', url: 'https://www.trade.gov/country-commercial-guides/georgia-prohibited-restricted-items' },
      { name: 'Customs Code of Georgia (WTO)', url: 'https://www.wto.org/english/thewto_e/acc_e/geo_e/wtaccgeo7a1_leg_2.pdf' }
    ],
    updated: '2026-05-26'
  },

  'japan': {
    forbidden: [
      'Корвалол, Валокордин — фенобарбитал в Японии = наркотик. Депортация + запрет въезда',
      'Псевдоэфедрин (Sudafed, Actifed) — без исключений',
      'Амфетамин-содержащие препараты (Аддерол)',
      'Мясо, сало, колбаса, мёд, цитрусовые',
      'Свежие фрукты и овощи',
      'Дроны без регистрации (Civil Aeronautics Act)'
    ],
    limits: {
      cash: 'до 1 000 000 ¥ без декларации (~6 500 $)',
      alcohol: '3 бутылки по 760 мл',
      cigarettes: '200 шт (1 блок)',
      perfume: '≈59 мл (2 oz)'
    },
    sources: [
      { name: 'Japan Customs (англ)', url: 'https://www.customs.go.jp/english/' },
      { name: 'Посольство РФ в Японии — памятка туристу', url: 'https://japan.mid.ru/' }
    ],
    updated: '2026-05-26'
  }
};

export function hasCustoms(slug) {
  return Boolean(CUSTOMS[slug]);
}

export function getCustoms(slug) {
  return CUSTOMS[slug] || null;
}
