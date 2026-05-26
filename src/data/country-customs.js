// Таможенные ограничения по странам — что нельзя ввозить, лимиты на валюту/алкоголь/сигареты.
// Используется в EssentialsCard.astro (секция «Таможня»).
//
// YMYL-контент: каждый факт = первоисточник. При несоответствии — приоритет
// официального таможенного сайта страны (customs.go.jp, gtb.gov.ge и аналоги).
//
// Каденс ревизии: ≤180 дней; перед сезоном — обязательно (правила меняются).

export const CUSTOMS = {
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
