// Таможенные ограничения по странам — что нельзя ввозить, лимиты на валюту/алкоголь/сигареты.
// Используется в EssentialsCard.astro (секция «Таможня»).
//
// YMYL-контент: каждый факт = первоисточник. При несоответствии — приоритет
// официального таможенного сайта страны (customs.go.jp, gtb.gov.ge и аналоги).
//
// Каденс ревизии: ≤180 дней; перед сезоном — обязательно (правила меняются).

export const CUSTOMS = {
  'china': {
    forbidden: [
      'Наркотики — смертная казнь возможна за траффик',
      'Печать/медиа против режима (политическое, тибетское, FLG)',
      'Оружие и боеприпасы (включая декоративное)',
      'Поддельная валюта и ценные бумаги',
      'CBD и марихуана-продукты (любые уровни THC)',
      'Свежие фрукты, овощи, мясо без сертификата'
    ],
    limits: {
      cash: 'до 20 000 ¥ или $5 000 USD без декларации',
      alcohol: '1.5 л крепкого',
      cigarettes: '400 шт (2 блока) или 100 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Trade.gov — China Prohibited Imports', url: 'https://www.trade.gov/country-commercial-guides/china-prohibited-and-restricted-imports' },
      { name: 'Travel China Guide — Customs', url: 'https://www.travelchinaguide.com/essential/not-taken.htm' }
    ],
    updated: '2026-05-27'
  },

  'hainan': {
    forbidden: [
      'Наркотики (как в материковом Китае — смертная казнь)',
      'Печать против режима',
      'Оружие и боеприпасы',
      'Дроны без разрешения CAAC',
      'CBD-продукты любых уровней',
      'Свежие фрукты, овощи, мясо без сертификата'
    ],
    limits: {
      cash: 'до 20 000 ¥ или $5 000 USD без декларации',
      alcohol: '1.5 л крепкого',
      cigarettes: '400 шт (2 блока)',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Sanya Phoenix Airport — Customs', url: 'https://en.sanyaairport.com/engjtg.jhtml' },
      { name: 'Hainan FTP — Visa-Free Policy', url: 'http://en.hnftp.gov.cn/tips/policy/202003/t20200317_3263796.html' }
    ],
    updated: '2026-05-27'
  },

  'egypt': {
    forbidden: [
      'Оружие, боеприпасы, игрушечные пистолеты внешне реалистичные',
      'Дроны и RC-вертолёты (строжайший запрет, аресты на таможне)',
      'Хлопок (для защиты местного производства)',
      'Антиквариат без разрешения Министерства Древностей (вывоз ≥100 лет = тюрьма)',
      'Наркотики (смертная казнь возможна за траффик)',
      'Сигаретные подделки'
    ],
    limits: {
      cash: 'до $10 000 USD декларировать',
      alcohol: '1 л (по прибытии в duty-free до 3 л за 48 ч)',
      cigarettes: '200 шт + 25 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Trade.gov — Egypt Restrictions', url: 'https://www.trade.gov/country-commercial-guides/egypt-prohibited-restricted-imports' },
      { name: 'Посольство РФ в Египте', url: 'https://egypt.mid.ru/' }
    ],
    updated: '2026-05-27'
  },

  'south-korea': {
    forbidden: [
      'Оружие, боеприпасы — любое',
      'Наркотики (марихуана криминализована даже для медицины)',
      'CBD-продукты — полный запрет независимо от THC',
      'Мясо/мясные продукты — даже beef jerky и SPAM (штраф от 5 млн KRW)',
      'Печатное про КНДР / pro-режимная пропаганда Северной Кореи',
      'Контрафакт и поддельная валюта'
    ],
    limits: {
      cash: 'до $10 000 USD декларировать',
      alcohol: '1 л + ≤$400',
      cigarettes: '200 шт (1 блок)',
      perfume: '2 oz (≈60 мл)'
    },
    sources: [
      { name: 'Trade.gov — South Korea Prohibited Imports', url: 'https://www.trade.gov/country-commercial-guides/south-korea-prohibited-and-restricted-imports' },
      { name: 'Korea Customs Service', url: 'https://www.customs.go.kr/english/' }
    ],
    updated: '2026-05-27'
  },

  'malaysia': {
    forbidden: [
      'Наркотики — обязательная смертная казнь за траффик ≥15 г героина или ≥200 г марихуаны',
      'Порнография любого типа',
      'Контрафакт и поддельные товары',
      'Изображения с pro-Israeli/анти-исламской символикой',
      'Острое оружие, ножи >длина запястья',
      'Виды CITES без сертификата'
    ],
    limits: {
      cash: 'до 30 000 RM (~$6 500) декларировать',
      alcohol: '1 л',
      cigarettes: '200 шт (1 блок)',
      perfume: '$400 USD стоимостью'
    },
    sources: [
      { name: 'Trade.gov — Malaysia Customs', url: 'https://www.trade.gov/country-commercial-guides/malaysia-customs-regulations' },
      { name: 'Royal Malaysian Customs', url: 'https://www.customs.gov.my/en' }
    ],
    updated: '2026-05-27'
  },

  'morocco': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Огнестрельное оружие, боеприпасы, взрывчатка',
      'Использованная одежда и шины',
      'Порнография и материалы против ислама / монархии',
      'Дроны без специального разрешения',
      'Ковры, похожие на марокканские (защита местного промысла)'
    ],
    limits: {
      cash: 'до 100 000 MAD (~$10 000) декларировать; вывоз местной валюты ограничен',
      alcohol: '1 л + 1 л вина',
      cigarettes: '200 шт (1 блок) или 25 сигар',
      perfume: '5 г парфюма + 0.25 л туалетной воды'
    },
    sources: [
      { name: 'Douane Maroc (customs)', url: 'https://www.douane.gov.ma/' },
      { name: 'Trade.gov — Morocco Restrictions', url: 'https://www.trade.gov/country-commercial-guides/morocco-prohibited-restricted-imports' }
    ],
    updated: '2026-05-27'
  },

  'peru': {
    forbidden: [
      'Подержанная одежда и обувь',
      'Псевдо-«писко» произведённый вне Перу',
      'Свежие фрукты, овощи, семена, орехи',
      'Мясные продукты — окорок, колбаса, свежие сыры',
      'Наркотики (включая коку в виде листьев вывоз)',
      'Антиквариат без разрешения Министерства Культуры'
    ],
    limits: {
      cash: 'до $10 000 USD декларировать',
      alcohol: '3 л',
      cigarettes: '400 шт (2 блока) или 50 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'SUNAT Aduanas Peru', url: 'https://www.sunat.gob.pe/' },
      { name: 'Trade.gov — Peru Restrictions', url: 'https://www.trade.gov/country-commercial-guides/peru-prohibited-and-restricted-imports' }
    ],
    updated: '2026-05-27'
  },

  'bolivia': {
    forbidden: [
      'Подержанная одежда и текстиль (полный запрет с 2024)',
      'Наркотики и психотропные вещества',
      'Оружие, боеприпасы, взрывчатка без разрешения',
      'Острые/смертельные предметы без разрешения',
      'Несанкционированные фарма-препараты',
      'Контрафакт и поддельная валюта'
    ],
    limits: {
      cash: 'до $10 000 USD декларировать',
      alcohol: '5 л',
      cigarettes: '400 шт (2 блока) или 50 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Trade.gov — Bolivia Prohibited Imports', url: 'https://www.trade.gov/country-commercial-guides/bolivia-prohibited-and-restricted-imports' },
      { name: 'Aduana Nacional Bolivia', url: 'https://www.aduana.gob.bo/' }
    ],
    updated: '2026-05-27'
  },

  'chile': {
    forbidden: [
      'Подержанные мотоциклы — полный запрет',
      'Использованные шины — экологический запрет',
      'Оружие, боеприпасы, взрывчатка',
      'Наркотики и психотропные вещества',
      'Порнография',
      'Свежие фрукты, овощи, мёд, орехи (SAG-биобезопасность — штрафы $200-1500 USD)'
    ],
    limits: {
      cash: 'до $10 000 USD декларировать',
      alcohol: '2.5 л',
      cigarettes: '400 шт (2 блока) или 50 сигар',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'SAG Chile (биобезопасность)', url: 'https://www.sag.gob.cl/' },
      { name: 'Trade.gov — Chile Restrictions', url: 'https://www.trade.gov/country-commercial-guides/chile-prohibited-and-restricted-imports' }
    ],
    updated: '2026-05-27'
  },

  'serbia': {
    forbidden: [
      'Снюс (snus, табак для сосания) — особый запрет, реальные штрафы',
      'Оружие и боеприпасы без разрешения',
      'Наркотики и психотропные вещества',
      'Антиквариат и предметы искусства без разрешения',
      'Драгметаллы без декларации',
      'Озон-разрушающие вещества'
    ],
    limits: {
      cash: 'до 10 000 EUR (или эквивалент) декларировать',
      alcohol: '1 л крепкого + 2 л вина',
      cigarettes: '200 шт (1 блок) или 50 сигар',
      vapes: 'разрешены в пределах личного пользования (≠ снюс)'
    },
    sources: [
      { name: 'Customs Administration Serbia', url: 'https://www.carina.rs/en/passengers/passenger-custom-clerance/useful-information-for-passengers.html' },
      { name: 'Trade.gov — Serbia Restrictions', url: 'https://www.trade.gov/country-commercial-guides/serbia-prohibited-restricted-imports' }
    ],
    updated: '2026-05-27'
  },

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

  'cuba': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Огнестрельное оружие и боеприпасы',
      'Порнография и материалы против режима',
      'Антиквариат и книги напечатанные до 1940',
      'Произведения искусства, исторической/культурной ценности — без сертификата вывоза',
      'Дроны и спутниковые телефоны (требуют разрешения MINCEX)'
    ],
    limits: {
      cash: 'свыше $5 000 USD (или эквивалент) декларировать',
      alcohol: '3 литра',
      cigarettes: '50 шт сигарет + 50 сигар + 250 г табака',
      perfume: 'разумные количества для личного пользования'
    },
    sources: [
      { name: 'Aduana de Cuba (Customs)', url: 'https://www.aduana.gob.cu/en/' },
      { name: 'Authentic Cuba Travel — Customs', url: 'https://www.authenticubatours.com/cuba-travel-formalities/customs-cuba-travel.htm' }
    ],
    updated: '2026-05-26'
  },

  'italy-north': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Оружие, боеприпасы, ножи без разрешения',
      'Контрафакт и пиратские товары',
      'Защищённые виды CITES (слоновая кость, рога, шкуры)',
      'Свежие мясные/молочные продукты не из EU (без сертификата)'
    ],
    limits: {
      cash: 'свыше €10 000 декларировать',
      alcohol: '1 л крепкого + 4 л вина + 16 л пива (внутри EU — без лимита для личного пользования)',
      cigarettes: '200 шт (внутри EU — больше, для личного пользования)',
      meat_dairy: 'до 10 кг мясо/молочка из EU + Фарер + Гренландии + Исландии'
    },
    sources: [
      { name: 'Agenzia delle Dogane (Italian Customs)', url: 'https://www.adm.gov.it/' },
      { name: 'Visa List — Italy Customs 2026', url: 'https://visalist.io/italy/customs' }
    ],
    updated: '2026-05-26'
  },

  'italy-south': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Оружие, боеприпасы, ножи без разрешения',
      'Контрафакт и пиратские товары',
      'Защищённые виды CITES (кораллы из Карибов, слоновая кость)',
      'Свежие мясные/молочные продукты не из EU (без сертификата)'
    ],
    limits: {
      cash: 'свыше €10 000 декларировать',
      alcohol: '1 л крепкого + 4 л вина + 16 л пива',
      cigarettes: '200 шт',
      meat_dairy: 'до 10 кг мясо/молочка из EU'
    },
    sources: [
      { name: 'Agenzia delle Dogane', url: 'https://www.adm.gov.it/' }
    ],
    updated: '2026-05-26'
  },

  'spain': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Оружие и оружие массового поражения',
      'Контрафакт и пиратские товары',
      'Мясные/молочные продукты из Алжира, Ливии, Марокко, Туниса (фитосанитарный запрет)',
      'Защищённые виды CITES'
    ],
    limits: {
      cash: 'свыше €10 000 декларировать',
      alcohol: '1 л крепкого + 4 л вина + 16 л пива (внутри EU — без лимита для личного пользования)',
      cigarettes: '200 шт',
      meat_dairy: 'до 10 кг из EU'
    },
    sources: [
      { name: 'Agencia Tributaria — Aduanas', url: 'https://sede.agenciatributaria.gob.es/' },
      { name: 'Trade.gov — Spain Restrictions', url: 'https://www.trade.gov/country-commercial-guides/spain-prohibited-restricted-imports' }
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
