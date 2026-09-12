// @freshness: DATA_UPDATED — файл несёт датированную фактуру (цены, правила,
//   погода). Правишь его — бампни DATA_UPDATED в meta.js, иначе подпись
//   «данные проверены на дату X» соврёт. Гейт свежести ищет именно эту метку.
// Таможенные ограничения по странам — что нельзя ввозить, лимиты на валюту/алкоголь/сигареты.
// Используется в EssentialsCard.astro (секция «Таможня»).
//
// YMYL-контент: каждый факт = первоисточник. При несоответствии — приоритет
// официального таможенного сайта страны (customs.go.jp, gtb.gov.ge и аналоги).
//
// Каденс ревизии: ≤180 дней; перед сезоном — обязательно (правила меняются).

import { ESSENTIALS_ALIAS } from './country-essentials.js';

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
      cash: 'до $10 000 USD без декларации',
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
      cash: 'до $10 000 USD без декларации',
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
      cash: 'до 30 000 RM (~$6 500) без декларации',
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
      cash: 'до 100 000 MAD (~$10 000) без декларации; вывоз местной валюты ограничен',
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
      cash: 'до $10 000 USD без декларации',
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
      cash: 'до $10 000 USD без декларации',
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
      cash: 'до $10 000 USD без декларации',
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
      cash: 'до 10 000 EUR (или эквивалент) без декларации',
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
      cash: 'ввоз не ограничен; вывоз до 5 000 USD',
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
  },
  'australia-east': {
    forbidden: [
      'Свежие фрукты и домашняя еда (яблоки, мандарины, выпечка, блюда, приготовленные дома)',
      'Любая еда без отметки в карточке прибытия — даже немного, даже продукты для готовки',
      'Вейпы сверх нормы: только для личного лечения, не больше 2 устройств, 20 картриджей и 200 мл жидкости',
      'Лекарства больше чем на 3 месяца или без рецепта либо письма врача',
      'Лекарства, которые везут, чтобы передать другим людям',
    ],
    limits: {
      cash: 'меньше 10 000 AUD без декларации',
      alcohol: '2,25 л на взрослого (с 18 лет); сверх нормы пошлину берут со всего алкоголя',
      cigarettes: '25 шт или 25 г табака (с 18 лет)',
      perfume: 'вместе с другими покупками — до 900 AUD на взрослого',
    },
    sources: [
      { name: 'Australian Border Force — беспошлинные нормы', url: 'https://www.abf.gov.au/entering-and-leaving-australia/duty-free' },
      { name: 'Australian Border Force — что можно ввозить', url: 'https://www.abf.gov.au/entering-and-leaving-australia/can-you-bring-it-in' },
      {
        name: 'Australian Border Force — ввоз наличных',
        url: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/how-to-import/types-of-imports/importing-precious-metals-coins-jewellery-currency',
      },
      { name: 'TGA — вейпы при въезде', url: 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/vapes-information-individuals-and-patients' },
      { name: 'TGA — лекарства при въезде', url: 'https://www.tga.gov.au/resources/consumer-information-and-resources/travelling-medicines-and-medical-devices/entering-australia' },
    ],
    updated: '2026-09-12',
  },
  'new-zealand': {
    forbidden: [
      'Любая еда без отметки в декларации прибытия NZTD — свежая, сушёная, в упаковке; штраф 400 NZD на месте, даже если забыли',
      'Водка, морепродукты, драгоценные камни и другие товары «люкс», сделанные в России, где бы их ни купили (только с разрешением)',
      'Ношеная обувь, спортивное и походное снаряжение без отметки в декларации (при необходимости его обработают за ваш счёт)',
      'Лекарства с псевдоэфедрином (входит в некоторые средства от насморка) — только с декларацией, рецептом, в ручной клади и не больше месячного запаса',
      'Оружие без разрешения — включая пневматику, перцовый баллончик, электрошокер, выкидной нож и кастет',
      'Бонги, трубки и вапорайзеры для каннабиса и метамфетамина (табачные трубки можно)',
    ],
    limits: {
      cash: 'меньше 10 000 NZD без декларации',
      alcohol: '4,5 л вина или пива + 3 бутылки крепкого до 1,125 л каждая (с 17 лет)',
      cigarettes: '50 шт или 50 г табака (с 17 лет)',
      perfume: 'вместе с другими покупками и подарками — до 700 NZD',
    },
    sources: [
      { name: 'New Zealand Customs — что декларировать при прилёте', url: 'https://www.customs.govt.nz/travel-to-and-from-new-zealand/travel-by-air/on-your-arrival' },
      { name: 'New Zealand Customs — беспошлинные нормы', url: 'https://www.customs.govt.nz/travel-to-and-from-new-zealand/duty-free-shopping' },
      { name: 'New Zealand Customs — запрещённые и ограниченные товары', url: 'https://www.customs.govt.nz/travel-to-and-from-new-zealand/prohibited-and-restricted-items' },
      { name: 'MPI (биобезопасность) — штраф за незаявленное', url: 'https://www.mpi.govt.nz/bring-send-to-nz/bringing-and-posting-items-to-nz/what-happens-if-you-fail-to-declare' },
    ],
    updated: '2026-09-12',
  },
  'iceland': {
    forbidden: [
      'Мясо и молочные продукты из России и других стран вне Евросоюза и Европейской экономической зоны',
      'Сырокопчёные колбасы, бекон, сырое молоко и яйца — и из Европы тоже (мясо можно только варёное или в консервах)',
      'Б/у сёдла, уздечки и перчатки для верховой езды; одежду и сапоги для езды — только вычищенные и продезинфицированные',
      'Рыболовные снасти без дезинфекции: справку показывают до рыбалки, обработку делают и в аэропорту Кефлавик',
      'Ножи с лезвием длиннее 12 см, выкидные и метательные ножи, кастеты',
      'Лекарства больше чем на 100 дней приёма, анаболики — больше чем на 30 дней',
    ],
    limits: {
      cash: 'до 10 000 € без декларации',
      alcohol: '1 л крепкого + 0,75 л вина + 3 л пива или, например, 18 л пива (с 20 лет)',
      cigarettes: '200 шт или 250 г табака (с 18 лет)',
      food: 'до 10 кг и не дороже 25 000 ISK',
    },
    sources: [
      { name: 'Skatturinn (таможня Исландии) — беспошлинные нормы', url: 'https://www.skatturinn.is/english/individuals/customs-matters/travelling-to-iceland/duty-free-imports/' },
      { name: 'Skatturinn — декларация наличных', url: 'https://www.skatturinn.is/english/individuals/customs-matters/travelling-to-iceland/cash-declaration/' },
      { name: 'Skatturinn — ограничения ввоза', url: 'https://www.skatturinn.is/english/individuals/customs-matters/moving-to-iceland/import-restrictions/' },
      { name: 'MAST (ветеринарная и пищевая служба) — что можно привезти', url: 'https://www.mast.is/en/travel' },
    ],
    updated: '2026-09-12',
  },
  'norway': {
    forbidden: [
      'Мясо и молочные продукты из России и других стран вне Европейской экономической зоны — только со специальным разрешением Mattilsynet (пищевая инспекция)',
      'Никотиновые подушечки (снюс без табака), стики для IQOS и других систем нагревания табака, табак для кальяна',
      'Вейпы с никотином — только со справкой врача о лечении от курения; ароматизированные вейпы без никотина — нельзя',
      'Алкоголь крепче 60%',
      'Картофель без специального разрешения',
    ],
    limits: {
      cash: 'до 25 000 NOK без декларации; за незаявленную сумму больше — штраф 20% от всех денег',
      alcohol: '1 л крепкого + 1,5 л вина + 2 л пива (или 3 л вина + 2 л пива, или 5 л пива); крепкое — с 20 лет',
      cigarettes: '200 шт или 250 г табака + 200 листов сигаретной бумаги',
      perfume: 'вместе с другими покупками — до 6 000 NOK',
    },
    sources: [
      { name: 'Tolletaten (таможня Норвегии) — нормы на алкоголь и табак', url: 'https://www.toll.no/en/goods/alcohol-and-tobacco/quotas' },
      { name: 'Tolletaten — наличные', url: 'https://www.toll.no/en/goods/currency' },
      { name: 'Tolletaten — мясо, молочные продукты и другая еда', url: 'https://www.toll.no/en/goods/food/regulations-for-meat-milk-cheese-and-other-foods' },
      { name: 'Tolletaten — беспошлинный лимит на покупки', url: 'https://www.toll.no/en/shopping-abroad/the-value-limit' },
    ],
    updated: '2026-09-12',
  },
  'qatar': {
    forbidden: [
      'Алкоголь (таможня заберёт и вернёт при вылете)',
      'Электронные сигареты, жевательный табак и насвай',
      'Наркотики (за попытку ввоза — до 50 лет тюрьмы)',
      'Свинина и продукты из неё',
      'Книги, фильмы и записи, противоречащие нормам ислама',
      'Оружие и взрывчатка; собаки бойцовских пород',
    ],
    limits: { cash: 'меньше 50 000 QAR (≈ 13 700 $)', alcohol: 'нельзя: заберут и вернут при вылете', cigarettes: '400 шт, или 20 сигар, или 300 г трубочного табака' },
    sources: [
      { name: 'КД МИД России — Катар, таможня', url: 'https://www.kdmid.ru/docs/qatar/information-about-the-country/' },
      { name: 'Visit Qatar — ввоз валюты', url: 'https://visitqatar.com/intl-en/plan-your-trip/travel-tips' },
    ],
    updated: '2026-09-12',
  },
  'saudi-arabia': {
    forbidden: [
      'Алкоголь в любом виде и количестве',
      'Наркотики и лекарства с наркотическими веществами (вплоть до смертной казни)',
      'Свинина и продукты с ней',
      'Печатные и видеоматериалы против ислама и морали',
      'Оружие, фейерверки, электрошокеры, антирадары, скрытые камеры',
      'Незарегистрированные таблетки и кремы, мускатный орех, жевательный табак',
    ],
    limits: {
      cash: 'меньше 40 000 SAR (≈ 10 700 $)',
      alcohol: 'запрещён полностью',
      cigarettes: '200 шт без пошлины, больше — с пошлиной на всё количество',
      perfume: 'разумное количество для себя',
    },
    sources: [
      { name: 'ZATCA — декларация на границе', url: 'https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/customs-individual/Travel-pages/declare.aspx' },
      { name: 'ZATCA — табак для себя', url: 'https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/customs-individual/Travel-pages/Quantity-Tobaacco.aspx' },
      { name: 'ZATCA — запрещённые товары', url: 'https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/customs-individual/Prohibited-goods.aspx' },
      { name: 'КД МИД России — Саудовская Аравия', url: 'https://www.kdmid.ru/docs/saudi-arabia/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'cambodia': {
    forbidden: [
      'Наркотики: за хранение и перевозку — от 5 до 25 лет',
      'Оружие, в том числе охотничье, и боеприпасы',
      'Дикие животные, птицы и рыбы',
      'Порнографические материалы',
      'Вывоз антиквариата старше 100 лет и культурных ценностей — только с разрешения Минкультуры Камбоджи',
      'Необработанные драгоценные камни, лом и слитки драгметаллов — только по лицензии',
    ],
    limits: { alcohol: '2 л крепостью выше 20°', cigarettes: '200 шт. или 20 сигар' },
    sources: [
      { name: 'Консульский департамент МИД России — Камбоджа, таможенный контроль', url: 'https://www.kdmid.ru/docs/cambodia/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'india-goa': {
    forbidden: [
      'Спутниковые телефоны и дроны без согласования с властями Индии (уголовная ответственность)',
      'Оружие и патроны: даже один патрон в багаже разбирают по антитеррористическим статьям',
      'Наркотические и психотропные вещества',
      'Золото и серебро не в виде украшений (слитки, монеты)',
      'Карты и книги с неверными границами Индии',
      'Слоновая кость, шкуры и кожи диких животных, перья редких птиц, антиквариат',
    ],
    limits: { cash: 'до 5 000 USD наличными без декларации; рупий — до 25 000 и только через аэропорт', alcohol: '2 л', cigarettes: '100 шт., или 25 сигар, или 125 г табака' },
    sources: [
      { name: 'Консульский департамент МИД России — Индия, таможенный контроль', url: 'https://www.kdmid.ru/docs/india/information-about-the-country/' },
      { name: 'Резервный банк Индии — ввоз валюты и рупий', url: 'https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=829' },
    ],
    updated: '2026-09-12',
  },
  'nepal': {
    forbidden: [
      'Оружие, боеприпасы и военное снаряжение',
      'Наркотики, в том числе марихуана и гашиш: срок вплоть до пожизненного',
      'Вывоз предметов старины и культурных ценностей без письменного разрешения Департамента археологии',
      'Компьютер, видеокамеру, спутниковый телефон вписывают в паспорт — их обязательно вывезти, иначе пошлина',
      'Золото сверх 50 г и серебро сверх 500 г — декларировать и платить пошлину',
    ],
    limits: { cash: 'меньше 5 000 USD без декларации', alcohol: '1,15 л крепкого или 10 банок пива', cigarettes: '200 шт.; сигары — 50 шт., табак — 250 г' },
    sources: [
      { name: 'Консульский департамент МИД России — Непал, таможенный контроль', url: 'https://www.kdmid.ru/docs/nepal/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'philippines': {
    forbidden: [
      'Наркотики в любом количестве — пожизненное заключение и штраф до 10 млн песо',
      'Контрафакт',
      'Непристойные и порнографические материалы',
      'Фальсифицированные или неправильно маркированные еда и лекарства',
      'Изделия из золота и серебра без клейма с настоящей пробой',
      'Вывоз ракушек и морских сувениров, купленных с рук, без чека (изымают в аэропорту)',
    ],
    limits: {
      cash: 'до 10 000 USD без декларации; песо — до 50 000 без разрешения Центробанка',
      alcohol: '2 бутылки на общую сумму до 10 000 песо (около $160)',
      cigarettes: '2 блока, или 50 сигар, или 250 г трубочного табака',
    },
    sources: [
      { name: 'Таможня Филиппин — иностранная валюта', url: 'https://customs.gov.ph/foreign-currency/' },
      { name: 'Таможня Филиппин — правила для пассажиров', url: 'https://customs.gov.ph/Guidelines%20for%20Airport%20Passengers' },
      { name: 'Консульский департамент МИД России — Филиппины', url: 'https://www.kdmid.ru/docs/philippines/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'abkhazia': {
    forbidden: [
      'Вейпы и другие электронные сигареты (ввоз в Абхазию запрещён)',
      'Оружие и боеприпасы без разрешения властей Абхазии',
      'Наркотические и отравляющие вещества',
      'Золото в слитках, предметы старины и искусства (только со специальным разрешением)',
      'Обратно в Россию: фрукты, овощи, орехи, зелень и любая растительная продукция в сумках (запрет Россельхознадзора с 12 марта 2018 года)',
      'Обратно в Россию: мясо, колбасы, копчёности (ветеринарный запрет с 2007 года; можно молочное после термообработки и мёд)',
    ],
    limits: { cash: 'до 10 000 USD без декларации (правило ЕАЭС на Псоу в обе стороны)', alcohol: 'в Россию — 3 л без пошлины', cigarettes: 'в Россию — 200 шт., или 50 сигар, или 250 г табака' },
    sources: [
      { name: 'Консульский департамент МИД России — Абхазия, таможенный контроль', url: 'https://www.kdmid.ru/docs/abkhazia/information-about-the-country/' },
      { name: 'Государственный таможенный комитет Абхазии', url: 'https://customsra.com/poleznaja-informacija/' },
      {
        name: 'ФТС России — нормы беспошлинного ввоза и наличные',
        url: 'https://customs.gov.ru/fiz/pravila-peremeshheniya-tovarov/peremeshhenie-nalichnoj-valyuty-i-denezhnyx-instrumentov',
      },
      { name: 'Россельхознадзор — ограничения по Абхазии', url: 'https://fsvps.gov.ru/importexport/abhaziya/ogranicheniya-na-vvoz/' },
    ],
    updated: '2026-09-12',
  },
  'dominican-republic': {
    forbidden: [
      'Наркотики и психотропные вещества',
      'Огнестрельное оружие',
      'Загрязняющие и опасные вещества',
      'Растения, сельхозпродукцию, еду и лекарства — только с декларацией: их проверяют минсельхоз и минздрав',
      'Лекарства с контролируемыми и психотропными веществами — только с рецептом врача',
      'Второй ноутбук и подарки дороже $500 (льгота раз в три месяца) облагаются пошлиной',
    ],
    limits: { cash: 'до 10 000 USD без декларации', alcohol: '5 л', cigarettes: '20 пачек, или 25 сигар, или 200 г табака' },
    sources: [
      { name: 'Таможня Доминиканы — справочник путешественника', url: 'https://www.aduanas.gob.do/manual-del-viajero/' },
      { name: 'Консульский департамент МИД России — памятка по Доминикане', url: 'https://www.kdmid.ru/docs/dominican-republic/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'ecuador': {
    forbidden: [
      'Покупки дороже $2 000 в зале прилёта не оформят: только через склад и обычный импорт',
      'Вещи, для которых нужны разрешения, без документов — только до $500 и один раз в год',
      'Собак и кошек — только с документами по требованиям Agrocalidad',
      'Без пошлины — один новый телефон, одни новые смарт-часы и дрон до $1 000; сверх этого платят налог',
      'На Галапагосы — отдельный контроль биобезопасности и электронная декларация о ввозимых товарах',
    ],
    limits: { cash: 'меньше 10 000 USD без декларации', alcohol: '3 л', cigarettes: '400 шт (20 пачек), 25 сигар, 1 фунт табака', perfume: '500 мл на человека' },
    sources: [
      { name: 'Таможня Эквадора — правила для авиапассажиров', url: 'https://www.aduana.gob.ec/servicio-al-ciudadano/viajeros-por-via-aerea/' },
      { name: 'Таможня Эквадора — личные вещи без пошлины', url: 'https://www.aduana.gob.ec/wp-content/uploads/2026/05/LISTADO-EFECTO-DE-VIAJEROS.pdf' },
      { name: 'Агентство биобезопасности Галапагосов', url: 'https://www.bioseguridadgalapagos.gob.ec/' },
    ],
    updated: '2026-09-12',
  },
  'argentina': {
    forbidden: [
      'Наркотики',
      'Оружие и взрывчатка без разрешения',
      'Археологические находки и культурные ценности',
      'Товары на продажу: коммерческие партии не считаются багажом',
      'Неконсервированные продукты — свежую еду ввозить нельзя',
    ],
    limits: {
      cash: 'меньше 10 000 USD без декларации',
      alcohol: '2 л',
      cigarettes: '200 шт или 25 сигар',
      perfume: 'в общей беспошлинной сумме 500 USD при прилёте самолётом, сверх неё — пошлина 50%',
    },
    sources: [
      { name: 'ARCA — таможня Аргентины: правила для путешественников', url: 'https://www.arca.gob.ar/viajeros/' },
      { name: 'ARCA — ввоз и вывоз наличных', url: 'https://www.arca.gob.ar/viajeros/ayuda/ingreso-egreso-de-valores.asp' },
      { name: 'Консульский департамент МИД России — памятка по Аргентине', url: 'https://www.kdmid.ru/docs/argentina/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'brazil': {
    forbidden: [
      'Наркотики и некоторые лекарства',
      'Копии оружия, страйкбольное и игрушечное оружие, похожее на настоящее',
      'Животных, растения, семена и продукты — только с декларацией и проверкой',
      'Лекарства и медицинские изделия — задекларировать на въезде',
      'На вывоз: шкуры амфибий и рептилий, предметы колониальной и имперской эпохи, старинные издания',
    ],
    limits: { cash: 'до 10 000 USD без декларации', alcohol: '12 л', cigarettes: '200 шт (10 пачек), 25 сигар, 250 г табака', perfume: 'в общей беспошлинной квоте 1 000 USD при прилёте самолётом' },
    sources: [
      {
        name: 'Receita Federal — квоты и лимиты для путешественников',
        url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/viagens-internacionais/guia-do-viajante/entrada-no-brasil/cota-de-isencao-duty-free-e-bagagem-tributavel',
      },
      {
        name: 'Receita Federal — вопросы и ответы для путешественников',
        url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/viagens-internacionais/guia-do-viajante/perguntas-e-respostas',
      },
      { name: 'Консульский департамент МИД России — памятка по Бразилии', url: 'https://www.kdmid.ru/docs/brazil/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'canada-east': {
    forbidden: [
      'Каннабис в любом виде (внутри Канады он легален, но ввоз и вывоз без разрешения — уголовное преступление)',
      'Перцовые баллончики, выкидные ножи, копии огнестрельного оружия',
      'Огнестрельное оружие без разрешения и декларации',
      'Еда, растения, животные и изделия из них без декларации (предъявлять всё)',
      'Произведения искусства и культурные ценности без разрешения Canadian Heritage',
    ],
    limits: {
      cash: 'от CAD 10 000 — декларировать на въезде и выезде, сама сумма не ограничена',
      alcohol: '1,5 л вина, или 1,14 л крепкого, или 8,5 л пива; с 18 лет в Альберте, Манитобе и Квебеке, с 19 — в остальных провинциях; пошлину могут взять и в пределах нормы',
      cigarettes: '200 сигарет, 50 сигар, 200 г табака и 200 табачных стиков',
      perfume: 'подарки до CAD 60 за штуку без пошлины (кроме алкоголя и табака), подарки не упаковывать',
    },
    sources: [
      { name: 'CBSA — что можно ввезти гостю', url: 'https://www.cbsa-asfc.gc.ca/travel-voyage/bring-apporter-eng.html' },
      { name: 'CBSA — декларация наличных', url: 'https://www.cbsa-asfc.gc.ca/travel-voyage/ttd-vdd-eng.html' },
      { name: 'CBSA — запрещённые и ограниченные товары', url: 'https://www.cbsa-asfc.gc.ca/travel-voyage/rpg-mrp-eng.html' },
      { name: 'Консульский портал МИД РФ — Канада', url: 'https://www.kdmid.ru/docs/canada/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'usa': {
    forbidden: [
      'Российский алкоголь, рыба, икра и другие морепродукты, непромышленные алмазы (санкции США)',
      'Мясо и мясные продукты из большинства стран, включая консервы и сушёное',
      'Свежие фрукты и овощи — лучше не везти; всю еду декларировать, штраф за непредъявленное — от $300',
      'Товары из Кубы и Ирана',
      'Лекарства без рецепта или письма врача на английском (везти в оригинальной упаковке)',
      'Абсент с туйоном; поддельные брендовые вещи — не больше одной каждого вида и только для себя',
    ],
    limits: {
      cash: 'больше $10 000 — декларировать (форма FinCEN 105), сама сумма не ограничена',
      alcohol: '1 л с 21 года',
      cigarettes: '200 сигарет, или 50 сигар, или 2 кг табака',
      perfume: 'подарки до $100 без пошлины, если остаётесь минимум на 72 часа; в сумму можно включить до 100 сигар',
    },
    sources: [
      { name: 'CBP — запрещённые и ограниченные товары', url: 'https://www.cbp.gov/travel/us-citizens/know-before-you-go/prohibited-and-restricted-items' },
      { name: 'eCFR 19 CFR 148.43 — нормы для нерезидентов', url: 'https://www.ecfr.gov/current/title-19/chapter-I/part-148/subpart-E/section-148.43' },
      { name: 'CBP — таможенная декларация 6059B', url: 'https://www.cbp.gov/sites/default/files/2024-07/cbp_form_6059b_english_0.pdf' },
      { name: 'OFAC — запрет на ввоз товаров российского происхождения', url: 'https://ofac.treasury.gov/faqs/topic/6626' },
    ],
    updated: '2026-09-12',
  },
  'singapore': {
    forbidden: [
      'Жевательная резинка (кроме лечебной и стоматологической, одобренной HSA)',
      'Электронные сигареты, вейпы и их части, жидкости с никотином',
      'Жевательный, нюхательный и растворимый табак, табак для кальяна',
      'Рог носорога и изделия из редких животных',
      'Непристойные и подрывные издания и видео',
      'Сигареты без сингапурской стандартной упаковки (изымают на границе)',
    ],
    limits: {
      cash: 'до 20 000 SGD (≈ 1,33 млн ₽) без декларации',
      alcohol: '2 л: 1 л крепкого + 1 л вина или пива либо 2 л вина или пива; после 48 часов за границей и не из Малайзии',
      cigarettes: 'беспошлинной нормы нет — пошлина и GST с первой пачки',
    },
    sources: [
      { name: 'Таможня Сингапура — беспошлинные нормы', url: 'https://www.customs.gov.sg/at-customs/arriving-in-singapore/duty-free-concession-gst-relief/' },
      { name: 'Таможня Сингапура — запрещённые товары', url: 'https://www.customs.gov.sg/doing-business/import-operations/import-procedures/controlled-and-prohibited-goods-for-imports/' },
      { name: 'ICA — декларация наличных', url: 'https://www.ica.gov.sg/enter-transit-depart/at-our-checkpoints/for-travellers/CBNI' },
    ],
    updated: '2026-09-12',
  },
  'hong-kong': {
    forbidden: [
      'Электронные сигареты, нагреваемый табак и травяные сигареты — ввоз запрещён',
      'С 30 апреля 2026 нельзя курить и носить включённое устройство в общественных местах, а стики и капсулы — иметь при себе там же',
      'Охлаждённое и замороженное мясо и птица — только по лицензии',
      'Алкоголь и табак сверх нормы — только через красный коридор с декларацией',
    ],
    limits: {
      cash: 'до 120 000 HKD (≈ 1,29 млн ₽) без декларации',
      alcohol: '1 л напитков крепче 30% (с 18 лет)',
      cigarettes: '19 сигарет, или 1 сигара, или 25 г сигар, или 25 г табака',
      perfume: 'пошлиной не облагается: пошлины только на алкоголь, табак, топливо и метиловый спирт',
    },
    sources: [
      { name: 'Таможня Гонконга — беспошлинные нормы', url: 'https://www.customs.gov.hk/en/service-enforcement-information/passenger-clearance/duty-free-concessions/index.html' },
      { name: 'Таможня Гонконга — вопросы пассажиров', url: 'https://www.customs.gov.hk/en/service-enforcement-information/passenger-clearance/faqs/index.html' },
      { name: 'Управление по контролю за табаком — запрет вейпов', url: 'https://www.taco.gov.hk/t/english/legislation/legislation_asp.html' },
    ],
    updated: '2026-09-12',
  },
  'seychelles': {
    forbidden: [
      'Наркотики (ввоз запрещён полностью)',
      'Оружие любого вида',
      'Животные, растения и продукты из них без разрешения',
      'Свежие цветы без разрешения на ввоз',
      'Фрукты (их могут изъять на досмотре)',
    ],
    limits: {
      cash: 'до $3 500 (50 000 рупий) без декларации',
      alcohol: 'с 18 лет: 2 л вина или пива и 2 л крепкого',
      cigarettes: '200 шт или 250 г табака',
      perfume: '200 мл духов и туалетной воды',
    },
    sources: [
      { name: 'Налоговая служба Сейшел: таможня', url: 'https://src.gov.sc/customs-and-excises/' },
      { name: 'Аэропорт Сейшел: беспошлинные нормы', url: 'https://seychellesairports.sc/pre-flight/customs' },
      { name: 'Аэропорт Сейшел: биобезопасность', url: 'https://seychellesairports.sc/pre-flight/bio-security' },
    ],
    updated: '2026-09-12',
  },
  'tanzania': {
    forbidden: [
      'Наркотики, взрывчатка и яды',
      'Порнография',
      'Танзанийские шиллинги (ввоз и вывоз запрещены)',
      'Вывоз слоновой кости, рога носорога и шкур диких животных',
      'Вывоз золота, алмазов и гвоздики без документов о покупке',
    ],
    limits: { alcohol: 'до 2 л крепкого или вина в сумме', cigarettes: '250 г табачных изделий в сумме', perfume: 'до 0,5 л, из них духов не больше 0,25 л' },
    sources: [
      { name: 'Налоговая служба Танзании: беспошлинный ввоз', url: 'https://www.tra.go.tz/page/returning-resident' },
      { name: 'Консульский департамент МИД России: информация о Танзании', url: 'https://www.kdmid.ru/docs/tanzania/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'mauritius': {
    forbidden: [
      'Наркотики',
      'Электронные сигареты любого типа',
      'Сахарный тростник и его части, почва, микроорганизмы, беспозвоночные',
      'Снаряжение для подводной охоты и гидроциклы',
      'Золото в монетах и слитках',
      'Оружие, лекарства, изделия из диких животных и сельхозпродукты (только через красный коридор с декларацией)',
    ],
    limits: {
      cash: 'до $11 000 (500 000 рупий) без декларации',
      alcohol: 'с 18 лет: 1 л крепкого и 2 л вина или пива (либо 2 л крепкого, либо 4 л вина или пива)',
      cigarettes: '250 г табака или 200 сигарет',
      perfume: '100 мл духов и 250 мл туалетной воды',
    },
    sources: [
      { name: 'Налоговое управление Маврикия: беспошлинные нормы', url: 'https://www.mra.mu/customs1/travellers/allowances' },
      { name: 'Налоговое управление Маврикия: вопросы о наличных', url: 'https://www.mra.mu/customs1/travellers/13-customs/159-faqs-travellers' },
      { name: 'Налоговое управление Маврикия: что декларировать на въезде', url: 'https://www.mra.mu/customs1/travellers/13-customs/146-on-arrival' },
    ],
    updated: '2026-09-12',
  },
  'madagascar': {
    forbidden: [
      'Наркотики',
      'Животные и растения под защитой СИТЕС и изделия из них (ввоз и вывоз)',
      'Контрафакт и пиратская продукция',
      'Порнография',
      'Продукты, непригодные в пищу',
      'Оружие, живые животные и растения (только с разрешением)',
    ],
    limits: {
      cash: 'валюта без лимита; от 1 000 € объявите на въезде: без декларации больше $1 000 на выезде не вывезти',
      alcohol: 'с 18 лет: 2 л спиртного и 2 бутылки вина',
      cigarettes: '200 шт, или 100 сигарилл, или 50 сигар, или 250 г табака',
      perfume: '2 флакона по 100 мл',
    },
    sources: [
      { name: 'Таможня Мадагаскара: памятка для пассажиров', url: 'https://www.douanes.gov.mg/particulier/guide-de-passage-en-douane/' },
      { name: 'Таможня Мадагаскара: ввоз валюты', url: 'https://www.douanes.gov.mg/le-saviez-vous/entrer-a-madagascar-avec-des-devises-ce-quil-faut-savoir/' },
      { name: 'Консульский департамент МИД России: информация о Мадагаскаре', url: 'https://www.kdmid.ru/docs/madagascar/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'south-africa': {
    forbidden: [
      'Наркотики в любой форме',
      'Контрафакт (товары с поддельной торговой маркой)',
      'Оружие (только с разрешением)',
      'Животные, растения и продукты из них, включая шкуры, молочные продукты и мёд (только с разрешением)',
      'Лекарства больше чем на три месяца или без письма либо рецепта врача',
      'Золотые монеты и необработанные минералы (только с разрешением)',
    ],
    limits: {
      cash: 'иностранная валюта без лимита, но объявите её на въезде: без декларации сумму сверх заявленной на выезде могут изъять; рандами — до R100 000',
      alcohol: 'с 18 лет: 2 л вина и 1 л крепкого',
      cigarettes: '200 сигарет и 20 сигар, плюс 250 г табака',
      perfume: '50 мл духов и 250 мл туалетной воды',
    },
    sources: [
      { name: 'Налоговая служба ЮАР: прибытие в страну', url: 'https://www.sars.gov.za/customs-and-excise/travellers/arrival-in-sa/' },
      { name: 'Налоговая служба ЮАР: беспошлинные нормы', url: 'https://www.sars.gov.za/customs-and-excise/travellers/duties-and-taxes-for-travellers/' },
      { name: 'Налоговая служба ЮАР: правила о наличных', url: 'https://www.sars.gov.za/wp-content/uploads/Ops/Policies/SC-PA-01-06-Excess-Currency-External-Policy.pdf' },
    ],
    updated: '2026-09-12',
  },
  'israel': {
    forbidden: [
      'Растения и растительные продукты без разрешения Службы охраны растений, даже для себя',
      'Продукты без фабричной герметичной упаковки (ввозить еду вообще не рекомендуют)',
      'Домашние животные без международной ветсправки, чипа и паспорта прививок',
      'Покупки и подарки дороже 200 долларов на человека без декларации',
      'Алкоголь, табак и косметика сверх беспошлинной нормы без декларации',
    ],
    limits: {
      cash: 'до 50 000 шекелей без декларации (по суше — до 12 000)',
      alcohol: '1 л крепкого и 2 л вина (с 18 лет)',
      cigarettes: '250 шт. или 250 г табака (с 18 лет)',
      perfume: 'до 0,25 л косметики на спирту',
    },
    sources: [
      { name: 'КонсДеп МИД РФ — Израиль, таможенный контроль', url: 'https://www.kdmid.ru/docs/israel/information-about-the-country/' },
      { name: 'Таможня Израиля — декларация денег (форма 84)', url: 'https://www.gov.il/en/service/customs-84' },
    ],
    updated: '2026-09-12',
  },
  'jordan': {
    forbidden: [
      'Наркотики и психотропные препараты (уголовное преследование)',
      'Оружие, боеприпасы, военное снаряжение и взрывчатка',
      'Яды, химикаты, радиоактивные и биологически опасные вещества',
      'Материалы, оскорбляющие моральные и этические принципы',
      'Животные, саженцы, семена, овощи и фрукты без документов',
      'Электронные средства связи, передачи данных и наблюдения, включая спутниковые',
    ],
    limits: { cash: 'до 10 000 динаров без декларации при выезде', alcohol: '1 бутылка до 1 л (с 18 лет)', cigarettes: '200 шт. (с 18 лет)' },
    sources: [
      { name: 'КонсДеп МИД РФ — Иордания, таможенный контроль', url: 'https://www.kdmid.ru/docs/jordan/information-about-the-country/' },
      { name: 'Посольство РФ в Иордании', url: 'https://jordan.mid.ru/ru/' },
    ],
    updated: '2026-09-12',
  },
  'iran': {
    forbidden: [
      'Любой алкоголь — и ввоз, и вывоз (на таможне изымают)',
      'Продукты из свинины',
      'Карты, кости и другие принадлежности для азартных игр, лотерейные билеты',
      'Оборудование для съёмки с воздуха (дроны)',
      'Печатные и видеоматериалы, оскорбляющие ислам и национальные чувства, порнография',
      'Вывоз: антиквариат старше 50 лет, ручные ковры больше 24 м², икра больше 250 г, валюта дороже 5 000 долларов',
    ],
    limits: { alcohol: 'запрещён полностью' },
    sources: [
      { name: 'КонсДеп МИД РФ — Иран, таможенный контроль', url: 'https://www.kdmid.ru/docs/iran/information-about-the-country/' },
      { name: 'Посольство РФ в Иране — памятка российским гражданам', url: 'https://iran.mid.ru/upload/iblock/d3b/d3bc23dc9ec8fa76804394596da49376.doc' },
    ],
    updated: '2026-09-12',
  },
  'kazakhstan': {
    forbidden: [
      'Оружие и боеприпасы',
      'Наркотики, психотропные вещества и приспособления для их употребления',
      'Материалы, пропагандирующие войну, терроризм, насилие и расизм, и порнография',
      'Предметы старины и искусства, представляющие культурную ценность',
      'Животные и растения из Красной книги, рога сайгака',
      'Мясо, рыба и птица (летом санитарные службы часто запрещают ввоз и вывоз)',
    ],
    limits: { cash: 'до 10 000 $ без декларации', alcohol: '3 л на человека старше 18 лет', cigarettes: '200 шт., или 50 сигар, или 250 г табака' },
    sources: [
      { name: 'Консульский департамент МИД РФ — таможенный контроль в Казахстане', url: 'https://www.kdmid.ru/docs/kazakhstan/information-about-the-country/' },
      {
        name: 'Посольство РФ в Казахстане — таможенной границы с Россией нет',
        url: 'https://kazakhstan.mid.ru/ru/consular-services/consulate/vnimaniyu_grazhdan_sobirayushchikhsya_posetit_kazakhstan/',
      },
      { name: 'Консульский департамент МИД РФ — нормы ЕАЭС для личного ввоза (на примере Киргизии)', url: 'https://www.kdmid.ru/docs/kyrgyzstan/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'uzbekistan': {
    forbidden: [
      'Дроны (беспилотные летательные аппараты)',
      'Феназепам и другие психотропные препараты без разрешения Минздрава',
      'Материалы, пропагандирующие насилие, терроризм и религиозную нетерпимость, и порнография',
      'Религиозная литература — не больше трёх экземпляров и только после экспертизы',
      'Фрукты и овощи',
      'Вывоз культурных ценностей старше 50 лет',
    ],
    limits: { cash: 'до 70 млн сумов без декларации', alcohol: '1,5 л крепкого и 2 л вина (старше 16 лет)', cigarettes: 'до 1 000 шт. или 1 000 г табака' },
    sources: [
      { name: 'Посольство РФ в Узбекистане — таможенное законодательство', url: 'https://uzbekistan.mid.ru/ru/consular-services/dlya_grazhdan_rossii/tamozhennoe_pravo_uzbekistana/' },
      { name: 'Консульский департамент МИД РФ — таможенная памятка по Узбекистану', url: 'https://www.kdmid.ru/docs/uzbekistan/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'tajikistan': {
    forbidden: [
      'Наркотики',
      'Сильнодействующие лекарства без рецепта, подтверждающего их применение',
      'Печатная продукция и видео, противоречащие нормам ислама',
      'Оружие и боеприпасы',
      'Вывоз драгоценных камней, минералов и горных пород без разрешения',
      'Ювелирные украшения — только с декларацией',
    ],
    sources: [
      { name: 'Консульский департамент МИД РФ — таможенный контроль в Таджикистане', url: 'https://www.kdmid.ru/docs/tajikistan/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'kyrgyzstan': {
    forbidden: [
      'Наркотики и сильнодействующие лекарства без рецепта врача',
      'Оружие, боеприпасы и взрывчатые вещества',
      'Материалы, направленные на подрыв государственного строя',
      'Животные, овощи и фрукты без санитарного сертификата',
      'Охотничье и спортивное оружие — только с декларацией и разрешением МВД',
    ],
    limits: { cash: 'до 10 000 $ без декларации', alcohol: '3 л на человека старше 18 лет', cigarettes: '200 шт., или 50 сигар, или 250 г табака' },
    sources: [
      { name: 'Консульский департамент МИД РФ — таможенный контроль в Киргизии', url: 'https://www.kdmid.ru/docs/kyrgyzstan/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'croatia': {
    forbidden: [
      'Мясо, молоко и продукты из них из стран вне ЕС (кроме детского питания и лечебных продуктов)',
      'Наличные от 10 000 € без декларации (могут изъять на выезде)',
      'Наркотики (за каннабис для себя — крупные штрафы, за провоз — тюрьма; багаж сканируют и у транзитных пассажиров)',
      'Сигареты сверх 40 штук при въезде по суше или морем (из Сербии, Боснии, Черногории)',
      'Товары на перепродажу (беспошлинные нормы — только для личных вещей)',
    ],
    limits: {
      cash: 'от 10 000 € — декларировать',
      alcohol: '4 л тихого вина и 16 л пива, плюс 1 л крепче 22% или 2 л игристого либо креплёного (до 17 лет — без нормы)',
      cigarettes: '200 шт при прилёте, 40 шт при въезде по суше или морем',
      perfume: 'прочие товары, включая духи, — до 430 € самолётом или морем, до 300 € по суше',
    },
    sources: [
      { name: 'Your Europe — нормы ввоза из стран вне ЕС', url: 'https://europa.eu/youreurope/citizens/travel/carry/alcohol-tobacco-cash/index_en.htm' },
      { name: 'GOV.UK — Croatia entry requirements', url: 'https://www.gov.uk/foreign-travel-advice/croatia/entry-requirements' },
    ],
    updated: '2026-09-12',
  },
  'cyprus': {
    forbidden: [
      'Сырое мясо и рыба, молоко и молочные продукты',
      'Фрукты, овощи, цветы, орехи, семена и саженцы без разрешения Департамента сельского хозяйства',
      'Оружие, выкидные ножи и кинжалы',
      'Контрафакт (поддельная одежда, сумки, диски, программы)',
      'Наркотики (ввоз, хранение и употребление запрещены законом)',
      'Собаки пород питбуль-терьер, тоса-ину, дого аргентино и фила бразилейро',
    ],
    limits: {
      cash: 'от 10 000 € — декларировать на таможне',
      alcohol: '4 л тихого вина и 16 л пива, плюс 1 л крепче 22% или 2 л игристого либо креплёного (до 17 лет — без нормы)',
      cigarettes: '200 шт; с севера острова на юг — не больше 40 шт',
      perfume: 'прочие товары, включая духи, — до 430 €, детям до 15 лет — до 150 €',
    },
    sources: [
      { name: 'Visit Cyprus — Entry requirements', url: 'https://www.visitcyprus.com/useful-info/entry-requirements/' },
      { name: 'Visit Cyprus — Money & Currency', url: 'https://www.visitcyprus.com/useful-info/money-currency/' },
      { name: 'GOV.UK — Cyprus entry requirements', url: 'https://www.gov.uk/foreign-travel-advice/cyprus/entry-requirements' },
    ],
    updated: '2026-09-12',
  },
  'greece': {
    forbidden: [
      'Мясо, молоко и продукты из них из стран вне ЕС (исключения — детское питание и лечебные продукты)',
      'Наличные от 10 000 € без декларации (могут изъять на выезде)',
      'Наркотики, включая каннабис (реальный срок и крупные штрафы, в том числе при транзите)',
      'Товары на перепродажу (беспошлинные нормы — только для личных вещей)',
      'Сигареты сверх 40 штук при въезде по суше или морем (например, паромом из Турции)',
    ],
    limits: {
      cash: 'от 10 000 € — декларировать при въезде',
      alcohol: '4 л тихого вина и 16 л пива, плюс 1 л крепче 22% или 2 л игристого либо креплёного (до 17 лет — без нормы)',
      cigarettes: '200 шт при прилёте, 40 шт при въезде по суше или морем',
      perfume: 'прочие покупки, включая духи, — до 430 € самолётом или морем, до 300 € по суше',
    },
    sources: [
      { name: 'Your Europe — нормы ввоза из стран вне ЕС', url: 'https://europa.eu/youreurope/citizens/travel/carry/alcohol-tobacco-cash/index_en.htm' },
      { name: 'GOV.UK — Greece entry requirements', url: 'https://www.gov.uk/foreign-travel-advice/greece/entry-requirements' },
    ],
    updated: '2026-09-12',
  },
  'costa-rica-panama': {
    forbidden: [
      'Любые продукты из свинины из любой страны (колбасы, хамон, салями, консервы)',
      'Овощи, фрукты, растения, семена, сырое мясо — только с сертификатами',
      'Наркотики, оружие, боеприпасы и взрывчатка',
      'Химикаты, косметика и пищевые добавки — только с разрешением Минздрава',
      'Домашние животные — только с международным ветеринарным сертификатом',
    ],
    limits: { cash: 'меньше $10 000 без декларации, незадекларированное сверх нормы конфискуют' },
    sources: [
      { name: 'Аэропорт Гуанакасте (Либерия) — таможенные правила', url: 'https://www.guanacasteairport.com/es/aduanas' },
      { name: 'SENASA — запрет на ввоз продуктов из свинины', url: 'https://www.senasa.go.cr/informacion/noticias/615-senasa-recuerda-prohibicion-de-ingreso-de-productos-porcinos' },
      { name: 'МИД России — памятка по Коста-Рике', url: 'https://www.kdmid.ru/docs/costa-rica/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'guatemala-belize': {
    forbidden: [
      'Любые продукты, где есть свинина (колбасы, ветчина, консервы)',
      'Оружие и патроны — только с лицензией',
      'Растения и животные — только с разрешением',
      'Старинные вещи и культурные ценности — вывоз только с разрешения властей',
      'Товары не для себя — в электронную декларацию DJRV и с пошлиной',
    ],
    limits: { perfume: 'в общей норме: вещи сверх личного багажа до $500 без пошлины' },
    sources: [
      { name: 'МИД России — памятка по Гватемале', url: 'https://www.kdmid.ru/docs/guatemala/information-about-the-country/' },
      { name: 'SAT Guatemala — Declaración Jurada Regional de Viajero', url: 'https://portal.sat.gob.gt/portal/declaracion-jurada-regional-de-viajero/' },
    ],
    updated: '2026-09-12',
  },
  'finland': {
    forbidden: [
      'Мясо, мясные продукты, молоко и молочное — из любой страны вне ЕС',
      'Из России — сигареты, сигары, телефоны, фотоаппараты, косметику, бытовую технику и туалетную бумагу (санкции ЕС, в том числе на покупки в дьюти-фри)',
      'Из России — крепкий алкоголь больше 22% и слабые коктейли с добавленным спиртом',
      'Машины с российскими номерами — в страну не въедут',
      'Алкоголь младше 18 лет — никакой, до 20 лет — только слабый (до 22%)',
      'Табак — только с 18 лет и только для себя, не в подарок',
    ],
    limits: {
      cash: 'меньше 10 000 € без декларации; от 10 000 € — декларация на въезде',
      alcohol: 'из стран вне ЕС: 1 л крепкого (22–80%) или 2 л слабее 22%, плюс 4 л вина и 16 л пива; крепкое из России нельзя',
      cigarettes: '200 шт., или 50 сигар, или 100 сигарилл, или 250 г табака; из России — ничего',
    },
    sources: [
      { name: 'Таможня Финляндии — алкоголь', url: 'https://tulli.fi/en/restrictions/alcohol/traveller-imports' },
      { name: 'Таможня Финляндии — табак', url: 'https://tulli.fi/en/restrictions/tobacco/traveller-imports' },
      { name: 'Таможня Финляндии — наличные', url: 'https://tulli.fi/restrictions/cash' },
      { name: 'Таможня Финляндии — продукты', url: 'https://tulli.fi/en/restrictions/foods' },
    ],
    updated: '2026-09-12',
  },
  'switzerland': {
    forbidden: [
      'Мясо, колбаса, молоко, масло и другие продукты животного происхождения — из стран вне ЕС (из России, Сербии, Турции нельзя)',
      'Подделки брендов — изымают и уничтожают',
      'Радар-детекторы — запрещены, конфискация и штраф',
      'Оружие и боеприпасы — только с разрешением',
      'Охраняемые животные и растения, изделия из них — только с разрешением',
      'Наркотики',
    ],
    limits: {
      cash: 'без ограничений и без декларации; от 10 000 CHF могут спросить, откуда деньги и зачем',
      alcohol: '5 л до 18% и 1 л крепче 18% на человека в день, с 17 лет',
      cigarettes: '250 шт. (или 250 г другого табака), с 17 лет',
    },
    sources: [
      { name: 'Таможня Швейцарии (BAZG) — беспошлинные нормы', url: 'https://www.bazg.admin.ch/en/duty-free-allowances-foodstuffs-alcohol-and-tobacco' },
      { name: 'Таможня Швейцарии (BAZG) — запреты и ограничения', url: 'https://www.bazg.admin.ch/en/bans-restrictions-and-authorisations' },
      { name: 'Таможня Швейцарии (BAZG) — наличные', url: 'https://www.bazg.admin.ch/en/cash-foreign-currency-securities' },
    ],
    updated: '2026-09-12',
  },
};

// Таможня у страниц одной страны общая — та же подстановка, что у бытовых фактов.
export function getCustoms(slug) {
  return CUSTOMS[slug] || CUSTOMS[ESSENTIALS_ALIAS[slug]] || null;
}

export function hasCustoms(slug) {
  return Boolean(getCustoms(slug));
}
