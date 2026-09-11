// @freshness: DATA_UPDATED — файл несёт датированную фактуру (цены, правила,
//   погода). Правишь его — бампни DATA_UPDATED в meta.js, иначе подпись
//   «данные проверены на дату X» соврёт. Гейт свежести ищет именно эту метку.
// Per-country essentials: чаевые, экстренные номера, вода из-под крана, такси-приложения.
// Используется в EssentialsCard.astro — отдельная карточка в /<slug>/.
//
// Источники (обязательно для YMYL):
// — Посольство РФ в стране (japan.mid.ru, ru.embassyrussia.com и аналоги)
// — Официальный иммиграционный/туристический сайт страны (JNTO, ТАТ, JIE)
// — IEC 60083 для plug type — см. country-plug-types.js
//
// Каденс ревизии: ≤180 дней; экстренные номера + посольство — критично проверять.
// При изменении факта: grep по репо, обновить llms.txt в той же сессии.
//
// Schema FAQPage — каждый пункт = Q&A для AEO (Яндекс.Нейро / Google AI Overviews
// забирают только структурированные блок-факты, не абзац прозы).

export const ESSENTIALS = {
  'china': {
    tipping: {
      restaurants: 'не приняты — wait-staff на ставке, отказываются',
      taxi: 'не приняты',
      hotel: '10-30 ¥ носильщику',
      note: 'культура no-tipping; чаевые могут восприняться как обида'
    },
    emergency: {
      police: '110',
      ambulance: '120',
      fire: '119',
      tourist: '12301',
      embassy_ru_url: 'https://china.mid.ru/',
      embassy_note: 'Посольство РФ в Пекине + консульства в Шанхае, Гуанчжоу, Шэньяне, Гонконге'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; даже местные кипятят; в отелях термос с горячей водой стандарт'
    },
    taxi_apps: [
      { name: 'DiDi', note: 'крупнейшее; через Alipay/WeChat mini-program для иностранцев' },
      { name: 'Meituan', note: 'для еды + такси, требует китайский номер' }
    ],
    sources: [
      { name: 'Посольство РФ в КНР', url: 'https://china.mid.ru/' },
      { name: 'VisaHQ — China visa-free Russia 2026', url: 'https://www.visahq.com/news/2026-04-07/cn/china-to-extend-30-day-visa-free-entry-for-russian-citizens-until-september-2027/' }
    ],
    updated: '2026-05-27'
  },

  'hainan': {
    tipping: {
      restaurants: 'не приняты — китайская no-tipping культура',
      taxi: 'не приняты; DiDi через приложение',
      hotel: '10-30 ¥ носильщику на курорте',
      note: 'на Хайнане туристы из РФ привычны — персонал не обижается на отсутствие чаевых'
    },
    emergency: {
      police: '110',
      ambulance: '120',
      fire: '119',
      tourist: '12301',
      embassy_ru_url: 'https://china.mid.ru/',
      embassy_note: 'Ближайшее консульство РФ — Гуанчжоу'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; на курортах фильтрованная подаётся бесплатно'
    },
    taxi_apps: [
      { name: 'DiDi', note: 'в Санье и Хайкоу через Alipay' },
      { name: 'Bluebird/Yellow Cab', note: 'местные жёлтые такси, торг или счётчик' }
    ],
    sources: [
      { name: 'Hainan Free Trade Port — Visa-Free', url: 'http://en.hnftp.gov.cn/tips/policy/202003/t20200317_3263796.html' },
      { name: 'Посольство РФ в КНР', url: 'https://china.mid.ru/' }
    ],
    updated: '2026-05-27'
  },

  'egypt': {
    tipping: {
      restaurants: '10-15% если сервис-чардж не включён',
      taxi: 'округление; ~10-20 EGP за поездку',
      hotel: '10-20 EGP/сумка носильщику; 20-30 EGP/день горничной',
      note: '«бакшиш» — глубоко укоренённая культура; держи мелкие купюры'
    },
    emergency: {
      police: '122',
      ambulance: '123',
      fire: '180',
      tourist_police: '126',
      traffic: '128',
      embassy_ru_phone: '+20-2-748-9353',
      embassy_ru_url: 'https://egypt.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить — даже в Каире чистая, но трубы старые; на курортах только бутилированная'
    },
    taxi_apps: [
      { name: 'Uber', note: 'Каир, Александрия — основной' },
      { name: 'Careem', note: 'Каир, Александрия, Хургада, Луксор, Асуан' },
      { name: 'inDrive', note: 'торг с водителем' }
    ],
    sources: [
      { name: 'Посольство РФ в Египте', url: 'https://egypt.mid.ru/' },
      { name: 'Orange Egypt — Emergency Numbers', url: 'https://www.orange.eg/en/help/emergency-numbers' }
    ],
    updated: '2026-05-27'
  },

  'south-korea': {
    tipping: {
      restaurants: 'НЕ приняты — wait-staff на ставке; отказ от чаевых = норма',
      taxi: 'не приняты',
      hotel: 'не приняты; экскл. luxury hotels — там 1-2 USD носильщику',
      note: 'one of the few non-tipping countries; не обидно ничего не давать'
    },
    emergency: {
      police: '112',
      ambulance: '119',
      fire: '119',
      embassy_ru_phone: '+82-2-318-2116',
      embassy_ru_url: 'https://korea-seoul.mid.ru/',
      embassy_note: '119 для туристов: 3-way call с переводчиком (EN/JP/CN)'
    },
    water: {
      tap_drinkable: true,
      note: 'Сеульский «Arisu» проходит все 303 стандарта ВОЗ; но 64% корейцев предпочитают бутилированную'
    },
    taxi_apps: [
      { name: 'Kakao T', note: '90% рынка, дешевле Uber, English-friendly' },
      { name: 'Uber', note: 'только лицензированные такси через Uber, не свои машины' },
      { name: 'K-RIDE', note: 'специально для иностранцев, English-only' }
    ],
    sources: [
      { name: 'Посольство РФ в Республике Корея', url: 'https://korea-seoul.mid.ru/' },
      { name: 'Visit Seoul — Medical Emergencies', url: 'https://english.visitseoul.net/medical-emergencies' }
    ],
    updated: '2026-05-27'
  },

  'malaysia': {
    tipping: {
      restaurants: 'не обязательно; 10% сервис-чардж обычно включён в счёт',
      taxi: 'округление',
      hotel: '2-5 RM носильщику',
      note: 'не часть культуры; в туристических местах ценится'
    },
    emergency: {
      general: '999',
      ambulance: '999',
      fire: '999',
      police: '999',
      embassy_ru_url: 'https://malaysia.mid.ru/',
      embassy_note: '999 — единый номер для всех экстренных служб'
    },
    water: {
      tap_drinkable: false,
      note: 'технически безопасна в КЛ после кипячения, но местные предпочитают бутилированную или фильтр'
    },
    taxi_apps: [
      { name: 'Grab', note: 'крупнейшее, по всей стране' },
      { name: 'AirAsia ride (формерно EzCab)', note: 'дешевле в КЛ' },
      { name: 'inDrive', note: 'торг' }
    ],
    sources: [
      { name: 'Civil Defence Malaysia — 999', url: 'https://www.civildefence.gov.my/999-emergency-services/?lang=en' },
      { name: 'Посольство РФ в Малайзии', url: 'https://malaysia.mid.ru/' }
    ],
    updated: '2026-05-27'
  },

  'morocco': {
    tipping: {
      restaurants: '5-10% если сервис не включён; в дорогих ресторанах — 10%',
      taxi: '5-10 дирхам или 10% округление',
      hotel: '10-20 дирхам носильщику; 30-50/день горничной',
      note: 'часть культуры; туалетным attendants 1-2 дирхама; гидам обязательно'
    },
    emergency: {
      police: '19',
      ambulance: '15',
      fire: '15',
      gendarmerie: '177',
      embassy_ru_url: 'https://morocco.mid.ru/',
      embassy_note: 'Посольство РФ в Рабате + консульство в Марракеше +212-661-14-56-40'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить — хлорированная, но непривычная микрофлора; бутилированная везде'
    },
    taxi_apps: [
      { name: 'inDrive', note: 'торг с водителем; самое дешёвое' },
      { name: 'Careem', note: 'Касабланка, Марракеш, Рабат' },
      { name: 'Heetch', note: 'регулируемое VTC, лицензированные такси' }
    ],
    sources: [
      { name: 'Посольство РФ в Марокко', url: 'https://morocco.mid.ru/' },
      { name: 'CityTours Morocco — Emergency 2026', url: 'https://citytoursmorocco.com/emergency' }
    ],
    updated: '2026-05-27'
  },

  'peru': {
    tipping: {
      restaurants: '5-10% если «servicio» не в счёте',
      taxi: 'не приняты на улице; в Uber/inDrive через приложение',
      hotel: '2-5 PEN носильщику; 5/день горничной',
      note: 'гидам Мачу-Пикчу обязательно 30-50 USD/день; портерам трекинга — 50-100 PEN/день'
    },
    emergency: {
      police: '105',
      ambulance: '106',
      fire: '116',
      general: '911',
      tourist: '0800-22221',
      embassy_ru_url: 'https://peru.mid.ru/',
      embassy_note: 'Лима/Кальяо унифицирован под 911 в 2024; legacy 105/106/116 работает'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; в Куско (>3000м) кипятить 3 мин из-за высоты'
    },
    taxi_apps: [
      { name: 'Uber', note: 'Лима, Куско, Арекипа, Трухильо' },
      { name: 'inDrive', note: 'торг — часто дешевле Uber на 30%' },
      { name: 'Cabify', note: 'премиум-сегмент в Лиме' },
      { name: 'DiDi', note: 'набирает в Лиме' }
    ],
    sources: [
      { name: 'Посольство РФ в Перу', url: 'https://peru.mid.ru/' },
      { name: 'New Peruvian — Emergency Phones', url: 'https://newperuvian.com/emergency-phone-numbers-in-peru-police-ambulance-fire/' }
    ],
    updated: '2026-05-27'
  },

  'bolivia': {
    tipping: {
      restaurants: '5-10% если сервис не включён',
      taxi: 'не приняты',
      hotel: '5-10 BOB носильщику',
      note: 'гидам сафари/Уюни 50-100 BOB/день; драйверам солончака — обязательно'
    },
    emergency: {
      police: '110',
      ambulance: '118',
      fire: '119',
      embassy_ru_phone: '+591-2-278-6419',
      embassy_ru_url: 'https://bolivia.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; на высоте Ла-Паса (3650м) кипятить 3 мин; бутилированная везде'
    },
    taxi_apps: [
      { name: 'inDrive', note: 'основной — соответствует местной торговой культуре' },
      { name: 'Uber', note: 'работает но менее популярен; в основном Санта-Крус' },
      { name: 'Yango', note: 'набирает с 2024' }
    ],
    sources: [
      { name: 'Посольство РФ в Боливии', url: 'https://bolivia.mid.ru/' },
      { name: 'Antipode Bolivia — Useful Numbers', url: 'https://antipode-bolivia.com/en-guide-useful-numbers-in-bolivia' }
    ],
    updated: '2026-05-27'
  },

  'chile': {
    tipping: {
      restaurants: '10% «propina» обычно автоматически добавляется — нужно подтвердить или отказаться',
      taxi: 'округление',
      hotel: '1000-2000 CLP носильщику',
      note: 'обязательно подтверждать «propina» в чеке (¿con propina?)'
    },
    emergency: {
      police: '133',
      ambulance: '131',
      fire: '132',
      general: '112',
      embassy_ru_url: 'https://chile.mid.ru/',
      embassy_note: 'мнемоника: A=131, B(omberos)=132, C(arabineros)=133'
    },
    water: {
      tap_drinkable: true,
      note: 'Чили — единственная страна Латам где вода безопасна по всей территории'
    },
    taxi_apps: [
      { name: 'Uber', note: 'крупнейшее, по всей стране' },
      { name: 'Cabify', note: 'премиум в Сантьяго и Вальпараисо' },
      { name: 'DiDi', note: 'дешевле Uber на 15-20%' }
    ],
    sources: [
      { name: 'Посольство РФ в Чили', url: 'https://chile.mid.ru/' },
      { name: 'Homeurbano — Emergency Phones Santiago', url: 'https://www.homeurbano.com/en/chile-santiago/security-emergency-numbers' }
    ],
    updated: '2026-05-27'
  },

  'serbia': {
    tipping: {
      restaurants: '10% если сервис не включён; округление обычно',
      taxi: 'округление до целого RSD',
      hotel: '100-200 RSD носильщику',
      note: 'не обязательно; за хороший сервис ценится'
    },
    emergency: {
      general: '112',
      police: '192',
      ambulance: '194',
      fire: '193',
      embassy_ru_url: 'https://serbia.mid.ru/',
      embassy_note: '112 → пресс 1 (полиция) / 2 (скорая) / 3 (пожарные)'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна — водопровод и фонтаны питьевые, если нет таблички «не питьевая»'
    },
    taxi_apps: [
      { name: 'Yandex Go', note: 'крупнейшее в Белграде (Yandex купил рынок)' },
      { name: 'CarGo', note: 'местный Uber-конкурент' },
      { name: 'Naxis Taxi', note: 'традиционные такси по приложению' }
    ],
    sources: [
      { name: 'Посольство РФ в Сербии', url: 'https://serbia.mid.ru/' },
      { name: 'Serbia.com — Important Phone Numbers', url: 'https://serbia.com/visit-serbia/travel/useful-info/important-phone-numbers/' }
    ],
    updated: '2026-05-27'
  },

  'bali': {
    tipping: {
      restaurants: '10% service-charge + 11% налог обычно включены; в кафе/варунгах — округление',
      taxi: 'округление; Grab/Gojek чаевые в приложении',
      hotel: '10-50k IDR носильщику',
      note: 'местные зарплаты низкие; чаевые делают разницу'
    },
    emergency: {
      police: '110',
      ambulance: '118',
      fire: '113',
      general: '112',
      embassy_ru_url: 'https://indonesia.mid.ru/',
      embassy_note: 'Главное посольство — Джакарта; в Денпасаре только Почётный консул (визы и паспорта НЕ оформляются)'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; местные тоже пьют бутилированную/фильтрованную'
    },
    taxi_apps: [
      { name: 'Grab', note: 'крупнейшее, по всей Юго-Восточной Азии' },
      { name: 'Gojek', note: 'местное, мото-такси GoRide дешевле всего' },
      { name: 'Bluebird', note: 'официальные синие такси Bali Taxi' }
    ],
    sources: [
      { name: 'Посольство РФ в Индонезии', url: 'https://indonesia.mid.ru/' },
      { name: 'Bali.com — Emergency Numbers', url: 'https://bali.com/bali/travel-guide/health-safety/emergency-numbers/' },
      { name: 'Bali.com — Tap Water', url: 'https://bali.com/bali/travel-guide/practical-tips-must-know/can-i-drink-tap-water-bali/' }
    ],
    updated: '2026-05-26'
  },

  'uae': {
    tipping: {
      restaurants: '10-15% если сервис-чардж не включён',
      taxi: 'округление до целого AED',
      hotel: '10-20 AED носильщику',
      note: 'нет строгих правил; чаевые ценятся, но не обязательны'
    },
    emergency: {
      police: '999',
      ambulance: '998',
      fire: '997',
      embassy_ru_phone: '+971-4-328-5347',
      embassy_ru_url: 'https://dubai.mid.ru/',
      embassy_note: 'Генконсульство в Дубае + Посольство в Абу-Даби'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна — 99% воды из крупномасштабной опреснительной обработки (DEWA)'
    },
    taxi_apps: [
      { name: 'Careem', note: 'крупнейшее на Ближнем Востоке (принадлежит Uber с 2020)' },
      { name: 'Uber', note: 'работает как везде, через тот же флот' },
      { name: 'Hala', note: 'интегрировано с Careem, такси Dubai Taxi Corporation' }
    ],
    sources: [
      { name: 'Генконсульство РФ в Дубае', url: 'https://dubai.mid.ru/' },
      { name: 'UAE Government — Emergencies', url: 'https://u.ae/en/information-and-services/justice-safety-and-the-law/handling-emergencies' },
      { name: 'Visit Dubai — Tipping', url: 'https://www.visitdubai.com/en/articles/tipping-in-dubai' }
    ],
    updated: '2026-05-26'
  },

  'vietnam': {
    tipping: {
      restaurants: 'не обязательно; 5-10% в mid-range/luxury',
      taxi: 'округление до целого; в Grab — через приложение',
      hotel: '20-50k VND носильщику',
      note: 'не часть культуры; гидам/драйверам 10-15% от тура'
    },
    emergency: {
      police: '113',
      fire: '114',
      ambulance: '115',
      embassy_ru_phone: '+84-24-3833-6991',
      embassy_ru_url: 'https://vietnam.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; даже хлорированная в городах — старые трубы; бутилированная везде'
    },
    taxi_apps: [
      { name: 'Grab', note: 'крупнейшее; машины, мото, доставка' },
      { name: 'Be', note: 'вьетнамское, дешевле; ~28 городов' },
      { name: 'XanhSM', note: 'электротакси VinFast, новые машины' }
    ],
    sources: [
      { name: 'Посольство РФ во Вьетнаме (Ханой)', url: 'https://vietnam.mid.ru/' },
      { name: 'GOV.UK — Vietnam Emergency', url: 'https://www.gov.uk/foreign-travel-advice/vietnam/getting-help' },
      { name: 'Vietnam.vn — 2026 Entry Regulations', url: 'https://www.vietnam.vn/en/cap-nhat-quy-dinh-nhap-canh-viet-nam-2026' }
    ],
    updated: '2026-05-26'
  },

  'armenia': {
    tipping: {
      restaurants: '10% часто включено в сервис-чардж; иначе — по желанию',
      taxi: 'не принято; max 500 драм за хороший сервис',
      hotel: '500-1000 драм носильщику',
      note: 'не часть культуры; max 2000 драм в любой ситуации'
    },
    emergency: {
      police: '102',
      ambulance: '103',
      fire: '101',
      general: '911',
      gas: '104',
      embassy_ru_phone: '+374-10-567-427',
      embassy_ru_url: 'https://armenia.mid.ru/'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна и вкусная; Армения славится водой (Джермук, Бжни — газированные источники)'
    },
    taxi_apps: [
      { name: 'GG Taxi', note: 'местное, основное в Ереване' },
      { name: 'Yandex Go', note: 'дешевле, ночью лучшая доступность' },
      { name: 'Uklon', note: 'дополнительный вариант' }
    ],
    sources: [
      { name: 'Посольство РФ в Армении (Ереван)', url: 'https://armenia.mid.ru/' },
      { name: 'Visit Yerevan — Emergency', url: 'https://visityerevan.am/uinfo/details/8/en/' },
      { name: 'Advantour — Armenia Codes', url: 'https://www.advantour.com/armenia/phone-code.htm' }
    ],
    updated: '2026-05-26'
  },

  'sri-lanka': {
    tipping: {
      restaurants: '10% часто включён; иначе — 10% за хороший сервис',
      taxi: 'округление; PickMe — через приложение',
      hotel: '100-200 LKR носильщику',
      note: 'ценится больше чем в Индии; гидам сафари 500-1000 LKR в день'
    },
    emergency: {
      police: '119',
      fire: '110',
      ambulance: '1990',
      tourist_police: '011-2421052',
      embassy_ru_phone: '+94-11-2697036',
      embassy_ru_emergency: '+94-77-7287988',
      embassy_ru_url: 'https://sri-lanka.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; рестораны часто имеют "government water line" — безопасная альтернатива'
    },
    taxi_apps: [
      { name: 'PickMe', note: 'местное, по всей стране' },
      { name: 'Uber', note: 'только Коломбо и крупные города' }
    ],
    sources: [
      { name: 'Посольство РФ в Шри-Ланке (Коломбо)', url: 'https://sri-lanka.mid.ru/' },
      { name: 'Sri Lanka Police — Emergency 119', url: 'https://www.police.lk/?p=18161' },
      { name: 'DigiBiz — Sri Lanka Emergency', url: 'https://www.digibiz.lk/blog/emergency-services-telephone-numbers-sri-lanka' }
    ],
    updated: '2026-05-26'
  },

  'maldives': {
    tipping: {
      restaurants: 'на курортах сервис-чардж 10% обычно включён',
      taxi: 'на островах такси редко; в Мале — округление',
      hotel: '$5-10 за услугу на курорте',
      note: 'на курортах ценится; стандарт $1-3 в день горничной + $5-10 за сафари-гида'
    },
    emergency: {
      police: '119',
      police_hotline: '332-2111',
      fire: '118',
      ambulance: '102',
      embassy_ru_url: 'https://sri-lanka.mid.ru/',
      embassy_note: 'Отдельного посольства РФ на Мальдивах нет — обращения через Посольство РФ в Шри-Ланке'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; на курортах фильтрованная подаётся бесплатно'
    },
    taxi_apps: [
      { name: 'Avas Ride', note: 'местное, в Мале' }
    ],
    sources: [
      { name: 'Maldives Police — Emergency', url: 'https://x.com/PoliceMv/status/407360773342523392' },
      { name: 'NDMA Maldives', url: 'https://ndma.gov.mv/en' }
    ],
    updated: '2026-05-26'
  },

  'kenya': {
    tipping: {
      restaurants: '10% если сервис-чардж не включён',
      taxi: 'округление; в Bolt/Uber через приложение',
      hotel: '100-200 KES носильщику',
      note: 'сафари-гидам обязательно: $10-15/день драйверу, $5-10/день кемп-стаффу'
    },
    emergency: {
      police: '999',
      general: '112',
      ambulance_red_cross: '1199',
      ambulance_e_plus: '+254-700-395-395',
      amref_flying_doctors: '+254-20-6992299',
      embassy_ru_phone: '+254-20-2722462',
      embassy_ru_url: 'https://russembkenya.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить без кипячения/фильтрации; в отелях — бутилированная'
    },
    taxi_apps: [
      { name: 'Bolt', note: 'крупнейшее в Кении, дешевле Uber на 10-15%' },
      { name: 'Uber', note: 'работает в Найроби, Момбасе, недавно — сафари-туры' },
      { name: 'Little Cab', note: 'кенийское, безопаснее ночью' }
    ],
    sources: [
      { name: 'Посольство РФ в Кении', url: 'https://russembkenya.mid.ru/' },
      { name: 'Nairobi Info — Useful Numbers', url: 'https://www.nairobi-info.com/town/travel_info/useful-numbers' },
      { name: 'Tapestry of Africa — Tipping', url: 'https://tapestryofafrica.com/what-is-the-tipping-etiquette-in-kenya/' }
    ],
    updated: '2026-05-26'
  },

  'mexico': {
    tipping: {
      restaurants: '10-15% — это обязательно; даже если есть сервис-чардж, +10%',
      taxi: 'округление',
      hotel: '20-50 MXN носильщику, ~20 MXN/день горничной',
      note: 'часть культуры, не оставлять считается грубо в ресторанах'
    },
    emergency: {
      general: '911',
      green_angels: '078',
      embassy_ru_url: 'https://mexico.mid.ru/',
      embassy_note: '«Зелёные ангелы» 078 — англоязычная служба для туристов на трассах'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить; местные тоже пьют бутилированную (garrafones — большие 20л)'
    },
    taxi_apps: [
      { name: 'Uber', note: 'крупнейшее в стране' },
      { name: 'DiDi', note: 'дешевле Uber на 10-20%' },
      { name: 'Cabify', note: 'премиум-сегмент' }
    ],
    sources: [
      { name: 'Посольство РФ в Мексике', url: 'https://mexico.mid.ru/' },
      { name: 'Pacific Prime — Mexico Emergency', url: 'https://www.pacificprime.com/blog/emergency-response-systems-in-mexico-for-foreigners.html' }
    ],
    updated: '2026-05-26'
  },

  'cuba': {
    tipping: {
      restaurants: '10% в туристических местах; в государственных столовых не принято',
      taxi: '$1-3 USD за короткую; 10% за длинную трассу (Гавана → Варадеро)',
      hotel: '$1-2 USD/день горничной; в all-inclusive — общий tipping pool на ресепшен',
      note: 'USD/EUR предпочтительнее куб. песо; ценится высоко местными'
    },
    emergency: {
      police: '106',
      ambulance: '104',
      fire: '105',
      embassy_ru_url: 'https://cuba.mid.ru/',
      embassy_note: 'Посольство РФ в Гаване (5-та авенида, Мирамар, Плайя)'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить — даже местные пьют бутилированную; иногда фильтруют'
    },
    taxi_apps: [
      { name: 'La Nave', note: 'местное приложение, в Гаване' },
      { name: 'Cubacar', note: 'классические такси-стоянки' },
      { name: 'Сoco/Almendrón', note: 'старые американские такси по маршрутам — не приложение, ловить на улице' }
    ],
    sources: [
      { name: 'Посольство РФ на Кубе', url: 'https://cuba.mid.ru/' },
      { name: 'Cuba-Room — Useful Numbers', url: 'https://www.cubaroom.net/useful-numbers' },
      { name: 'Cubas Best — Tipping 2026', url: 'https://cubasbest.com/tipping-in-cuba/' }
    ],
    updated: '2026-05-26'
  },

  'italy-north': {
    tipping: {
      restaurants: '5-10% при хорошем сервисе; coperto (€1-3) уже в счёте',
      taxi: 'округление до целого евро',
      hotel: '€1-2 носильщику; €1/день горничной',
      note: 'не обязательно; локалы оставляют пару евро на дне или ничего'
    },
    emergency: {
      general: '112',
      police: '113',
      fire: '115',
      ambulance: '118',
      embassy_ru_phone: '+39-06-494-1680',
      embassy_ru_url: 'https://italy.mid.ru/',
      embassy_note: '112 — единый европейский, отвечает на EN/FR/DE; консульства РФ в Милане, Генуе, Венеции'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна — EU стандарты; в рестораны можно попросить "acqua del rubinetto"; «Non Potabile» = нельзя пить'
    },
    taxi_apps: [
      { name: 'FreeNow', note: 'официальные белые такси по счётчику' },
      { name: 'Uber Black', note: 'только премиум-сегмент в крупных городах' },
      { name: 'itTaxi', note: 'местное приложение для официальных такси' }
    ],
    sources: [
      { name: 'Посольство РФ в Италии', url: 'https://italy.mid.ru/' },
      { name: 'Italia.it — Emergency', url: 'https://www.italia.it/en/italy/practical-information/emergency-and-assistance' },
      { name: 'Pyllola — Tap Water Italy 2026', url: 'https://www.pyllola.com/post/water-in-italy-tap-water-and-safety-considerations' }
    ],
    updated: '2026-05-26'
  },

  'italy-south': {
    tipping: {
      restaurants: '5-10% при хорошем сервисе; coperto (€1-3) уже в счёте',
      taxi: 'округление до целого евро',
      hotel: '€1-2 носильщику; €1/день горничной',
      note: 'не обязательно; на юге чуть охотнее берут'
    },
    emergency: {
      general: '112',
      police: '113',
      fire: '115',
      ambulance: '118',
      embassy_ru_phone: '+39-06-494-1680',
      embassy_ru_url: 'https://italy.mid.ru/',
      embassy_note: '112 — единый европейский, отвечает на EN/FR/DE; консульство РФ в Палермо, Бари, Мессине'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна — EU стандарты; в Риме питьевые фонтаны (nasoni) бесплатные. На Сицилии в старых зданиях — старые трубы'
    },
    taxi_apps: [
      { name: 'FreeNow', note: 'официальные белые такси' },
      { name: 'Uber Black', note: 'премиум в Риме/Неаполе' },
      { name: 'itTaxi', note: 'местное' }
    ],
    sources: [
      { name: 'Посольство РФ в Италии', url: 'https://italy.mid.ru/' },
      { name: 'Italia.it — Emergency', url: 'https://www.italia.it/en/italy/practical-information/emergency-and-assistance' }
    ],
    updated: '2026-05-26'
  },

  'spain': {
    tipping: {
      restaurants: '5-10% при хорошем сервисе; не обязательно',
      taxi: 'округление до целого евро',
      hotel: '€1-2 носильщику; €1-2/день горничной',
      note: 'не часть культуры; локалы оставляют пару монет или ничего'
    },
    emergency: {
      general: '112',
      police: '091',
      ambulance: '061',
      embassy_ru_phone: '+34-91-562-9712',
      embassy_ru_url: 'https://spain.mid.ru/',
      embassy_note: '112 — отвечает на 50+ языках включая русский; консульство РФ в Барселоне'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна — 99.5% соответствует стандартам; с 2022 рестораны обязаны давать водопроводную бесплатно'
    },
    taxi_apps: [
      { name: 'Cabify', note: 'крупнейшее, по всей стране; премиум-чувство' },
      { name: 'FreeNow', note: 'официальные белые такси по счётчику' },
      { name: 'Uber', note: 'Мадрид, Барселона, Малага, Валенсия' },
      { name: 'Bolt', note: 'дешевле, основные города' }
    ],
    sources: [
      { name: 'Посольство РФ в Испании', url: 'https://spain.mid.ru/' },
      { name: 'Administracion.gob.es — 112 Services', url: 'https://administracion.gob.es/pag_Home/en/Tu-espacio-europeo/derechos-obligaciones/ciudadanos/asistencia-sanitaria/numeros-urgencia.html' },
      { name: 'WaterWell — Spain Tap Water 2025', url: 'https://orderwaterwell.com/blogs/news/tap-water-safety-spain-travel-guide' }
    ],
    updated: '2026-05-26'
  },

  'turkey': {
    tipping: {
      restaurants: '5-10% если сервис-чардж не включён; для high-end 10-15%',
      taxi: 'округление до целой лиры или 10% за хороший сервис',
      hotel: '20-50 TRY портье/уборка по желанию',
      note: 'чаевые не обязательны, но приветствуются'
    },
    emergency: {
      police: '155',
      ambulance: '112',
      fire: '110',
      embassy_ru_phone: '+90-312-439-21-22',
      embassy_ru_url: 'https://turkey.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'технически чистая в Стамбуле/Анкаре/Измире, но старые трубы — местные пьют бутилированную'
    },
    taxi_apps: [
      { name: 'BiTaksi', note: 'крупнейшее, по всей Турции' },
      { name: 'iTaksi', note: 'официальные жёлтые такси' },
      { name: 'Uber', note: 'только Стамбул' }
    ],
    sources: [
      { name: 'Посольство РФ в Турции (turkey.mid.ru)', url: 'https://turkey.mid.ru/' },
      { name: 'КонсДеп МИД РФ — Турция', url: 'https://www.kdmid.ru/docs/turkey/russian-consular-offices/' },
      { name: 'Memphis Tours — Turkey Emergency Numbers', url: 'https://www.memphistours.com/turkey/turkey-travel-guide/things-to-know/wiki/emergency-numbers' }
    ],
    updated: '2026-05-26'
  },

  'thailand': {
    tipping: {
      restaurants: 'не обязательно; 10% если сервис-чардж не включён (high-end)',
      taxi: 'округлять до целого, ~20-50 THB',
      hotel: '20-50 THB носильщику',
      note: 'не часть культуры, но приветствуется в туристических зонах'
    },
    emergency: {
      police: '191',
      ambulance: '1669',
      fire: '199',
      tourist_police: '1155',
      embassy_ru_phone: '+66-2-234-98-24',
      embassy_ru_url: 'https://thailand.mid.ru/'
    },
    water: {
      tap_drinkable: false,
      note: 'НЕ пить — только бутилированная; 1.5л в 7-Eleven 15-20 THB'
    },
    taxi_apps: [
      { name: 'Grab', note: 'крупнейшее, по всей стране' },
      { name: 'Bolt', note: 'дешевле, основные города' },
      { name: 'InDriver', note: 'торг с водителем' }
    ],
    sources: [
      { name: 'Посольство РФ в Таиланде (thailand.mid.ru)', url: 'https://thailand.mid.ru/' },
      { name: 'BackpackThailand — Emergency Guide 2026', url: 'https://backpackthailand.com/guides/thailand-emergency-guide' },
      { name: 'Tourist Police Thailand (1155)', url: 'https://www.amazing-thailand.com/thai-tourist-police.html' }
    ],
    updated: '2026-05-26'
  },

  'georgia': {
    tipping: {
      restaurants: '10% если сервис-чардж не включён',
      taxi: 'округление до 1-2 GEL, не обязательно',
      hotel: '1-3 GEL за услугу',
      note: 'не часть культуры, но за отличный сервис приветствуется'
    },
    emergency: {
      police: '112',
      ambulance_fire: '112',
      embassy_ru_phone: '+995-32-291-24-53',
      embassy_ru_url: 'https://georgia.mid.ru/',
      embassy_note: 'Секция интересов РФ при посольстве Швейцарии — дипотношений нет с 2008'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасна по WHO + национальные стандарты; в старых зданиях рекомендуется фильтр из-за труб'
    },
    taxi_apps: [
      { name: 'Bolt', note: 'надёжный в центре, новые машины' },
      { name: 'Yandex Go', note: 'дешевле на 10-20%, лучшая доступность ночью' },
      { name: 'Maxim', note: 'самый дешёвый, особенно за городом' }
    ],
    sources: [
      { name: '112.gov.ge — Emergency FAQ', url: 'https://112.gov.ge/?page_id=1715&lang=en' },
      { name: 'Секция интересов РФ в Грузии', url: 'https://georgia.mid.ru/' },
      { name: 'Georgian Water and Power — Water Quality', url: 'https://www.gwp.ge/en/waterquality' }
    ],
    updated: '2026-05-26'
  },

  'japan': {
    tipping: {
      restaurants: 'нет — обычно включено в счёт; попытка оставить = неловкость',
      taxi: 'нет',
      hotel: 'нет; за рёкан традиционно можно 1,000 ¥ в конверте при заселении',
      note: 'Япония — азиатская страна без культуры чаевых'
    },
    emergency: {
      police: '110',
      ambulance_fire: '119',
      embassy_ru_phone: '+81-3-3583-4445',
      embassy_ru_url: 'https://japan.mid.ru/'
    },
    water: {
      tap_drinkable: true,
      note: 'безопасно по всей стране, включая горные регионы'
    },
    taxi_apps: [
      { name: 'GO', note: 'крупнейший, по всей Японии' },
      { name: 'DiDi', note: 'дешевле в крупных городах' },
      { name: 'Uber', note: 'только Токио, ограниченно' }
    ],
    sources: [
      { name: 'Посольство РФ в Японии', url: 'https://japan.mid.ru/' },
      { name: 'JNTO — Japan National Tourism Organization', url: 'https://www.jnto.go.jp/' }
    ],
    updated: '2026-05-26'
  },
  'australia-east': {
    tipping: {
      restaurants: 'не обязательны; в дорогих ресторанах за хороший сервис принято оставить официанту 10% счёта',
      taxi: 'не обязательны, по желанию',
      hotel: 'сервисный сбор в счёт не добавляют, чаевые по желанию',
      note: 'в Австралии чаевые всегда на усмотрение гостя',
    },
    emergency: {
      police: '000',
      ambulance_fire: '000',
      embassy_ru_phone: '+61-2-6295-9033',
      embassy_ru_url: 'https://australia.mid.ru/',
      embassy_note: 'Посольство в Канберре: 78 Canberra Avenue, Griffith. Экстренная связь с посольством: +61 413 004 816, консульский отдел: +61 2 6295 9474. С мобильного вместо 000 можно набрать 112 — звонок попадёт в ту же службу. Полиция не по срочному делу — 131 444.',
    },
    water: {
      tap_drinkable: true,
      note: 'Можно по всей стране. Где вода непитьевая (обычно в глубинке), над краном висит табличка. В городах есть питьевые фонтанчики, в кафе и отелях бутылку наполнят по просьбе.',
    },
    taxi_apps: [
      { name: 'Uber', note: 'Сидней, Брисбен, Голд-Кост, Кэрнс и Дарвин' },
      { name: 'DiDi', note: 'Сидней, Брисбен, Голд-Кост, Кэрнс; в Дарвине не работает' },
    ],
    sources: [
      { name: 'Посольство РФ в Австралии — контакты', url: 'https://australia.mid.ru/ru/embassy/contacts/' },
      { name: 'Правительство Австралии — Triple Zero (000)', url: 'https://www.infrastructure.gov.au/media-communications/phone/triple-zero' },
      { name: 'Tourism Australia — полезные советы', url: 'https://www.australia.com/en-us/facts-and-planning/about-australia/useful-tips.html' },
      { name: 'DiDi — города Австралии', url: 'https://web.didiglobal.com/au/help-center/where-is-didi-available/' },
    ],
    updated: '2026-09-12',
  },
  'new-zealand': {
    tipping: {
      restaurants: 'не обязательны даже в ресторанах и барах; за хороший сервис — по желанию',
      taxi: 'не обязательны',
      hotel: 'сервисный сбор в счёт не включают, чаевые по желанию',
      note: 'оставлять ли чаевые, решает гость',
    },
    emergency: {
      police: '111',
      ambulance_fire: '111',
      embassy_ru_phone: '+64-4-476-6113',
      embassy_ru_url: 'https://newzealand.mid.ru/',
      embassy_note: 'Посольство в Веллингтоне: 57 Messines Road, Karori. Консульский отдел: +64 4 476 6742, +64 4 476 9548 (9:00–12:30). В чрезвычайной ситуации дежурный отвечает по +64 4 476 6113 и +64 21 550 767. Полиция не по срочному делу — 105.',
    },
    water: { tap_drinkable: true, note: 'Можно в любой части страны. Бутылку наполняют в питьевых фонтанчиках и в номере, в кафе воду наливают бесплатно.' },
    taxi_apps: [
      { name: 'Uber', note: 'Окленд, Веллингтон, Крайстчерч, Квинстаун' },
      { name: 'YourRide', note: 'бывший Zoomy: лицензированные такси по всей стране, цену показывает до поездки' },
    ],
    sources: [
      { name: 'Посольство РФ в Новой Зеландии', url: 'https://newzealand.mid.ru/ru/' },
      { name: 'Полиция Новой Зеландии — номера 111 и 105', url: 'https://www.police.govt.nz/contact-us' },
      { name: 'Tourism New Zealand — деньги и чаевые', url: 'https://www.newzealand.com/us/feature/new-zealand-currency/' },
      { name: 'Tourism New Zealand — вода из-под крана', url: 'https://www.newzealand.com/ca/keep-new-zealand-clean/' },
    ],
    updated: '2026-09-12',
  },
  'iceland': {
    tipping: {
      restaurants: 'нет — чаевых не ждут; за исключительный сервис можно оставить наличные в любой валюте',
      taxi: 'нет',
      hotel: 'не ждут',
      note: 'гиду на экскурсии тоже можно оставить наличные, если он особенно постарался',
    },
    emergency: {
      police: '112',
      ambulance_fire: '112',
      embassy_ru_phone: '+354-551-5156',
      embassy_ru_url: 'https://iceland.mid.ru/',
      embassy_note: 'Посольство в Рейкьявике: Garðastræti 33. Консульский отдел: +354 561 0851; экстренная связь: +354 696 5524. Если до 112 не дозвониться, запасной номер службы — +354 599 0112.',
    },
    water: { tap_drinkable: true, note: 'Можно по всей стране: почти вся вода подземная, её не хлорируют, качество проверяют постоянно.' },
    taxi_apps: [
      { name: 'Hopp', note: 'Рейкьявик с пригородами, аэропорт Кефлавик и Акюрейри; цена видна до заказа, оплата в приложении' },
      { name: 'Hreyfill', note: 'таксомоторная компания с 1943 года со своим приложением; Рейкьявик и Акюрейри' },
    ],
    sources: [
      { name: 'Посольство РФ в Исландии — контакты', url: 'https://iceland.mid.ru/ru/embassy/contacts/' },
      { name: 'Neyðarlínan — единый номер 112', url: 'https://www.112.is/en' },
      { name: 'Visit Reykjavík — деньги и чаевые', url: 'https://visitreykjavik.is/currency-credit-cards-and-banks' },
      { name: 'Visit South Iceland — вода', url: 'https://www.south.is/en/travel-info/practical-information/icelandic-water' },
    ],
    updated: '2026-09-12',
  },
  'norway': {
    tipping: {
      restaurants: 'по желанию: в ресторанах и барах местные оставляют 5–15% счёта, если понравились еда и сервис',
      taxi: 'обычно не оставляют',
      hotel: 'обычно не оставляют',
      note: 'кроме баров и ресторанов, чаевые в Норвегии не приняты; не оставить — не обида',
    },
    emergency: {
      police: '112',
      ambulance: '113',
      fire: '110',
      embassy_ru_phone: '+47-22-55-32-78',
      embassy_ru_url: 'https://norway.mid.ru/',
      embassy_note: 'Посольство в Осло: Drammensveien 74. Экстренная связь: +47 46 85 88 25; консульский отдел: +47 22 55 17 63. Генконсульства: в Киркенесе (+47 78 99 37 37) и в Баренцбурге на Шпицбергене (+47 90 67 23 80).',
    },
    water: { tap_drinkable: true, note: 'Воду из-под крана пьют: она чистая и бесплатная, удобно возить с собой бутылку и наполнять её.' },
    taxi_apps: [
      { name: 'Uber', note: 'в Осло; через приложение приезжают лицензированные таксисты' },
      { name: 'Bolt', note: 'в Осло, в том числе поездки в аэропорт и из аэропорта' },
      { name: 'Taxifix', note: 'приложение Oslo Taxi, крупнейшей таксомоторной компании страны; заказ по всей Норвегии' },
    ],
    sources: [
      { name: 'Посольство РФ в Норвегии — контакты', url: 'https://norway.mid.ru/ru/embassy/contacts/' },
      {
        name: 'Nkom (регулятор связи Норвегии) — экстренные номера',
        url: 'https://nkom.no/telefoni-og-telefonnummer/informasjon-om-telefoni-for-sluttbruker/n%C3%B8dnummer-og-n%C3%B8danrop',
      },
      { name: 'Visit Norway — деньги, цены и чаевые', url: 'https://www.visitnorway.com/plan-your-trip/travel-tips-a-z/currency-and-prices/' },
      { name: 'Visit Norway — как сэкономить (вода из-под крана)', url: 'https://www.visitnorway.com/plan-your-trip/travel-tips-a-z/budget-travel/' },
    ],
    updated: '2026-09-12',
  },
  'qatar': {
    tipping: { restaurants: 'сервисный сбор обычно включён в счёт; сверху 10–15% по желанию', taxi: 'по желанию', hotel: 'по желанию', note: 'чаевые не обязательны, оставляют их наличными' },
    emergency: { police: '999', ambulance_fire: '999', embassy_ru_phone: '+974-4483-6231; экстренный +974-5588-7659', embassy_ru_url: 'https://qatar.mid.ru/' },
    water: { tap_drinkable: true, note: 'опреснённая вода из водопровода соответствует нормам ВОЗ, но многие пьют бутилированную — её продают везде' },
    taxi_apps: [
      { name: 'Karwa Taxi', note: 'такси компании Mowasalat; в приложении же заказывают бесплатный подвоз до ближайшей станции метро' },
      { name: 'Uber', note: 'работает круглосуточно, через него можно вызвать и такси Karwa' },
    ],
    sources: [
      { name: 'Посольство РФ в Катаре', url: 'https://qatar.mid.ru/ru/' },
      { name: 'КД МИД России — Катар', url: 'https://www.kdmid.ru/docs/qatar/information-about-the-country/' },
      { name: 'Visit Qatar — Travel tips', url: 'https://visitqatar.com/intl-en/plan-your-trip/travel-tips' },
      { name: 'Минздрав Катара — страховка для гостей', url: 'https://www.moph.gov.qa/english/departments/ministeroffice/hfid/Pages/FAQs.aspx' },
    ],
    updated: '2026-09-12',
  },
  'saudi-arabia': {
    tipping: { restaurants: 'по желанию, если сервисный сбор не включён', taxi: 'по желанию', hotel: 'по желанию', note: 'чаевые не обязательны' },
    emergency: {
      police: '999',
      ambulance: '997',
      fire: '998',
      embassy_ru_phone: '+966-11-481-1432; экстренный +966-54-910-2266; генконсульство в Джидде +966-12-665-9255',
      embassy_ru_url: 'https://riyadh.mid.ru/',
    },
    water: { tap_drinkable: false, note: 'подтверждения, что водопроводную воду можно пить, нет — берите бутилированную' },
    taxi_apps: [
      { name: 'Uber', note: 'работает в Эр-Рияде и Джидде' },
      { name: 'Careem', note: 'работает в крупных городах страны' },
      { name: 'Bolt', note: 'есть в Эр-Рияде и Джидде' },
    ],
    sources: [
      { name: 'Посольство РФ в Саудовской Аравии', url: 'https://riyadh.mid.ru/ru/kontakty/' },
      { name: 'Генконсульство РФ в Джидде', url: 'https://jeddah.mid.ru/ru/' },
      { name: 'КД МИД России — Саудовская Аравия', url: 'https://www.kdmid.ru/docs/saudi-arabia/information-about-the-country/' },
      { name: 'Visit Saudi — Getting around', url: 'https://www.visitsaudi.com/en/getting-around' },
    ],
    updated: '2026-09-12',
  },
  'cambodia': {
    tipping: { restaurants: 'не обязательны, но приветствуются', taxi: 'цена договорная, о ней условливаются до поездки; в Grab цена известна заранее' },
    emergency: { police: '117', ambulance: '119', fire: '118', embassy_ru_phone: '+855-23-210-931; экстренный +855-886-430-810', embassy_ru_url: 'https://embrusscambodia.mid.ru/' },
    taxi_apps: [
      { name: 'Grab', note: 'тук-туки и реморки по цене, известной заранее; машина с водителем в Пномпене и Сиемреапе' },
    ],
    sources: [
      { name: 'Консульский департамент МИД России — Камбоджа', url: 'https://www.kdmid.ru/docs/cambodia/information-about-the-country/' },
      { name: 'Консульский департамент МИД России — посольство в Камбодже', url: 'https://www.kdmid.ru/docs/cambodia/russian-consular-offices/' },
      { name: 'Grab Cambodia — поездки', url: 'https://www.grab.com/kh/en/transport/' },
    ],
    updated: '2026-09-12',
  },
  'india-goa': {
    tipping: {
      restaurants: 'сервисный сбор только по желанию гостя, вписывать его в счёт без спроса запрещено',
      taxi: 'цену оговаривают до посадки — иностранцам часто называют завышенную',
      note: 'если сервисный сбор вписали без спроса, его можно попросить убрать из счёта',
    },
    emergency: {
      police: '112 или 100',
      ambulance: '108',
      fire: '101',
      embassy_ru_phone: '+91-22-2367-7566 (генконсульство в Мумбаи, Гоа в его округе); экстренный +91-91675-75661',
      embassy_ru_url: 'https://mumbai.mid.ru/',
    },
    water: { tap_drinkable: false, note: 'пьют бутилированную воду в закрытой заводской упаковке; воду непонятного происхождения не пьют' },
    taxi_apps: [
      { name: 'GoaMiles', note: 'приложение туристической корпорации штата, им пользуется 15% жителей; Uber и Ola в Гоа не пускают' },
    ],
    sources: [
      { name: 'Портал правительства Гоа — экстренные номера', url: 'https://www.goa.gov.in/' },
      { name: 'Консульский департамент МИД России — загранучреждения в Индии', url: 'https://www.kdmid.ru/docs/india/russian-consular-offices/' },
      { name: 'Консульский департамент МИД России — Индия', url: 'https://www.kdmid.ru/docs/india/information-about-the-country/' },
      { name: 'GoaMiles — такси туристической корпорации Гоа', url: 'https://www.goamiles.com/' },
    ],
    updated: '2026-09-12',
  },
  'nepal': {
    emergency: { police: '100', ambulance: '102', fire: '101', tourist_police: '1144', embassy_ru_phone: '+977-1-451-10-63; экстренный +977-980-104-71-87', embassy_ru_url: 'https://nepal.mid.ru/' },
    water: { tap_drinkable: false, note: 'пьют воду из заводских бутылок и ею же чистят зубы; некипячёную воду, свежевыжатые соки и салаты в общепите лучше не брать' },
    taxi_apps: [
      { name: 'Pathao', note: 'мототакси и машины в одном приложении' },
    ],
    sources: [
      { name: 'Консульский департамент МИД России — посольство в Непале', url: 'https://www.kdmid.ru/docs/nepal/russian-consular-offices/' },
      { name: 'Туристический совет Непала — туристическая полиция', url: 'https://ntb.gov.np/en/plan-your-trip/before-you-come/tourist-police' },
      { name: 'Полиция Непала — экстренные номера', url: 'https://www.nepalpolice.gov.np/stations/emergency-contacts/' },
      { name: 'Консульский департамент МИД России — Непал', url: 'https://www.kdmid.ru/docs/nepal/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'philippines': {
    tipping: { restaurants: 'сервисный сбор из счёта по закону целиком делят между персоналом', taxi: 'в Grab цена известна до поездки' },
    emergency: { police: '911', ambulance_fire: '911', embassy_ru_phone: '+63-917-860-94-90 (круглосуточно); консульский отдел +63-2-750-15-711', embassy_ru_url: 'https://philippines.mid.ru/' },
    taxi_apps: [
      { name: 'Grab', note: 'такси и частные машины, цена известна заранее' },
      { name: 'Angkas', note: 'мототакси: Манила с пригородами, Себу, Кагаян-де-Оро' },
      { name: 'JoyRide', note: 'мототакси, машины и трансферы в аэропорт' },
    ],
    sources: [
      { name: 'Посольство России на Филиппинах — контакты', url: 'https://philippines.mid.ru/ru/embassy/contacts/' },
      { name: 'Указ № 56 (2018) о единой линии 911', url: 'https://lawphil.net/executive/execord/eo2018/eo_56_2018.html' },
      { name: 'Закон RA 11360 о сервисном сборе', url: 'https://lawphil.net/statutes/repacts/ra2019/ra_11360_2019.html' },
      { name: 'Grab Philippines — поездки', url: 'https://www.grab.com/ph/transport/' },
    ],
    updated: '2026-09-12',
  },
  'abkhazia': {
    emergency: {
      police: '02, с мобильного 002',
      ambulance: '03, с мобильного 003',
      fire: '01, с мобильного 001',
      embassy_ru_phone: '+7-840-226-04-91; дежурный +7-940-711-45-55',
      embassy_ru_url: 'https://abkhazia.mid.ru/',
    },
    water: {
      tap_drinkable: false,
      note: 'или кипячёная из-под крана: магистральные трубы меняют, а за трубы к домам санитарная служба не ручается; бутилированную воду делают на месте, её проверяют',
    },
    sources: [
      { name: 'Консульский департамент МИД России — Абхазия', url: 'https://www.kdmid.ru/docs/abkhazia/information-about-the-country/' },
      { name: 'Посольство России в Абхазии — памятка туристам', url: 'https://abkhazia.mid.ru/ru/pamyatka_turistam/' },
      { name: 'Главный санврач Абхазии о водопроводной воде («Вестник Кавказа»)', url: 'https://vestikavkaza.ru/news/mozno-li-pit-vodu-iz-pod-krana-v-abhazii.html' },
    ],
    updated: '2026-09-12',
  },
  'dominican-republic': {
    tipping: {
      restaurants: '10% за обслуживание добавляют к счёту по закону, плюс 18% налога; сверху — по желанию',
      taxi: 'не обязательны; цену согласуйте до посадки',
      hotel: 'по желанию',
      note: 'итог в ресторане выше цены в меню примерно на 28%',
    },
    emergency: { police: '911 — единая служба экстренной помощи; туристическая полиция POLITUR — 809-222-2026', embassy_ru_phone: '+1 809 872-9559', embassy_ru_url: 'https://dominicana.mid.ru/ru/' },
    water: {
      tap_drinkable: false,
      note: 'водоканал Санто-Доминго называет воду из крана питьевой, минздрав — только безопасной для бытовых нужд, а риск загрязнения в трубах признают сами власти; пьют бутилированную',
    },
    taxi_apps: [
      { name: 'Uber', note: 'Санто-Доминго и Пунта-Кана, в том числе поездки из аэропорта' },
    ],
    sources: [
      { name: 'Посольство РФ в Доминикане', url: 'https://dominicana.mid.ru/ru/' },
      { name: 'Туристическая полиция POLITUR', url: 'https://politur.gob.do/' },
      { name: 'Налоговая служба DGII — ставка ITBIS', url: 'https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/principalesImpuestos/Paginas/itbis.aspx' },
      { name: 'Трудовой кодекс Доминиканы, статья 228', url: 'https://poderjudicial.gob.do/wp-content/uploads/2021/06/Codigo_Trabajo.pdf' },
    ],
    updated: '2026-09-12',
  },
  'ecuador': {
    tipping: {
      restaurants: 'в ресторанах первой и второй категории 10% за обслуживание входит в счёт; сверху оставляют мелочь от сдачи или $1–2',
      taxi: 'не обязательны; поездка по городу обычно стоит $2–6, цену согласуйте до посадки или попросите включить счётчик',
      hotel: 'по желанию, мелкими купюрами',
      note: 'платят долларами США; купюры от $50 в небольших магазинах и кафе могут не принять, держите мелкие',
    },
    emergency: {
      police: '911 или 101',
      ambulance: '911 или 131',
      fire: '911 или 102',
      embassy_ru_phone: '+593 2 252-6361; консульский отдел +593 2 250-50-89',
      embassy_ru_url: 'https://ecuador.mid.ru/ru/',
    },
    water: {
      tap_drinkable: false,
      note: 'из-под крана не пить: вода, немытые фрукты и еда с уличных лотков — частая причина тяжёлого кишечного расстройства; для питья и чистки зубов берут бутилированную',
    },
    taxi_apps: [
      { name: 'Uber', note: 'Кито, Гуаякиль, Манта, Салинас и ещё несколько городов' },
    ],
    sources: [
      { name: 'Посольство РФ в Эквадоре', url: 'https://ecuador.mid.ru/ru/' },
      { name: 'Консульский департамент МИД России — памятка по Эквадору', url: 'https://www.kdmid.ru/docs/ecuador/information-about-the-country/' },
      { name: 'Uber — Кито', url: 'https://www.uber.com/global/en/cities/quito/' },
    ],
    updated: '2026-09-12',
  },
  'argentina': {
    tipping: {
      restaurants: 'по желанию, сумму решает гость; удобнее оставлять наличными',
      taxi: 'не обязательны',
      hotel: 'по желанию',
      note: 'обязательного процента нет — размер чаевых решает гость',
    },
    emergency: {
      police: '911',
      ambulance: '911; в Буэнос-Айресе и области работает и 107',
      fire: '100',
      embassy_ru_phone: '+54 9 11 4813-1552; консульский отдел +54 9 11 4812-1794, в выходные для экстренных случаев +54 9 11 3296-6536',
      embassy_ru_url: 'https://argentina.mid.ru/ru/',
    },
    water: { tap_drinkable: true, note: 'в Буэнос-Айресе вода из-под крана питьевая — её подаёт городской водоканал AySA; за пределами столицы уточняйте у хозяев жилья' },
    taxi_apps: [
      { name: 'Uber', note: 'работает в Буэнос-Айресе круглосуточно' },
      { name: 'Cabify', note: 'показывает цену до заказа поездки' },
    ],
    sources: [
      { name: 'Посольство РФ в Аргентине', url: 'https://argentina.mid.ru/ru/' },
      { name: 'Портал правительства Аргентины — экстренные номера', url: 'https://www.argentina.gob.ar/tema/emergencias' },
      { name: 'AySA — питьевая вода', url: 'https://www.aysa.com.ar/portal/Que-Hacemos/Agua-potable' },
    ],
    updated: '2026-09-12',
  },
  'brazil': {
    tipping: {
      restaurants: 'в счёт часто добавляют 10% за обслуживание — это чаевые, платить их не обязательно',
      taxi: 'не обязательны',
      hotel: 'по желанию',
      note: 'по закону надбавка taxa de serviço идёт персоналу, но гость вправе от неё отказаться',
    },
    emergency: {
      police: '190',
      ambulance: '192',
      fire: '193',
      embassy_ru_phone: 'горячая линия посольства +55 61 3223-3094; консульский отдел +55 61 3223-5094; генконсульство в Рио-де-Жанейро +55 21 2274-0097',
      embassy_ru_url: 'https://brazil.mid.ru/ru/',
    },
    water: { tap_drinkable: false, note: 'водопроводную воду пить не советуют — для питья берут бутилированную' },
    taxi_apps: [
      { name: 'Uber', note: 'работает в Рио-де-Жанейро круглосуточно, возит и из аэропорта' },
      { name: '99', note: 'бразильский сервис: частные машины и такси' },
    ],
    sources: [
      { name: 'Посольство РФ в Бразилии', url: 'https://brazil.mid.ru/ru/' },
      { name: 'Консульский департамент МИД России — памятка по Бразилии', url: 'https://www.kdmid.ru/docs/brazil/information-about-the-country/' },
      { name: 'Прокуратура штата Сеара — защита прав потребителей, надбавка 10%', url: 'https://mpce.mp.br/decon/duvidas/bares-e-restaurantes/cobranca-de-10/' },
    ],
    updated: '2026-09-12',
  },
  'canada-east': {
    tipping: {
      restaurants: '15–20% от суммы до налога',
      taxi: '10–15%',
      hotel: 'CAD 2–5 за ночь горничной',
      note: 'цены в меню и на ценниках без налога: в Онтарио прибавят 13%, в Квебеке 5% и 9,975%, в Альберте 5%',
    },
    emergency: {
      police: '911',
      ambulance_fire: '911',
      embassy_ru_phone: '+1-613-235-43-41',
      embassy_ru_url: 'https://canada.mid.ru/',
      embassy_note: 'Посольство в Оттаве, консульский отдел: +1-613-236-72-20; генконсульства в Торонто (+1-416-962-99-11) и Монреале (+1-514-843-59-01)',
    },
    water: { tap_drinkable: true, note: 'в Торонто, Калгари и других городах пьют из-под крана; воду из рек и озёр в горах кипятят, фильтруют или обеззараживают' },
    taxi_apps: [
      { name: 'Uber', note: 'Торонто, Монреаль, Оттава, Квебек, Калгари, Ванкувер и другие города' },
      { name: 'Lyft', note: 'Монреаль, Оттава, Квебек, Калгари, Ванкувер' },
    ],
    sources: [
      { name: 'Консульский портал МИД РФ — Канада', url: 'https://www.kdmid.ru/docs/canada/russian-consular-offices/' },
      { name: 'IRCC — требования к въезду', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html' },
      { name: 'Город Торонто — водопроводная вода', url: 'https://www.toronto.ca/services-payments/water-environment/tap-water-in-toronto/' },
      { name: 'CRA — ставки GST/HST', url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html' },
    ],
    updated: '2026-09-12',
  },
  'usa': {
    tipping: {
      restaurants: '15–20% от суммы до налога — обязательная норма',
      taxi: '15–20%, в Uber и Lyft — в приложении',
      hotel: '$2–5 за ночь горничной, $1–2 за сумку носильщику',
      note: 'чаевые — часть заработка официанта; в счёт для больших компаний их иногда включают — проверяйте строку service charge',
    },
    emergency: {
      police: '911',
      ambulance_fire: '911',
      embassy_ru_phone: '+1-202-298-57-00',
      embassy_ru_url: 'https://washington.mid.ru/',
      embassy_note: 'Консульский отдел в Вашингтоне: +1-202-939-89-07; генконсульства в Нью-Йорке (+1-212-534-3782) и Хьюстоне (+1-713-337-33-00)',
    },
    water: {
      tap_drinkable: true,
      note: 'водопроводную воду проверяют по федеральному закону о питьевой воде, в городах её пьют из-под крана; нью-йоркскую городские власти называют одной из лучших в мире',
    },
    taxi_apps: [
      { name: 'Uber', note: 'основное приложение, работает по всей стране' },
      { name: 'Lyft', note: 'в крупных городах; для обоих нужна карта не российского банка' },
    ],
    sources: [
      { name: 'Консульский портал МИД РФ — США', url: 'https://www.kdmid.ru/docs/usa/russian-consular-offices/' },
      { name: 'Консульский портал МИД РФ — сведения о США', url: 'https://www.kdmid.ru/docs/usa/information-about-the-country/' },
      { name: 'EPA — закон о питьевой воде', url: 'https://www.epa.gov/sdwa/overview-safe-drinking-water-act' },
      { name: 'NYC DEP — питьевая вода Нью-Йорка', url: 'https://www.nyc.gov/site/dep/water/drinking-water.page' },
    ],
    updated: '2026-09-12',
  },
  'singapore': {
    tipping: {
      restaurants: 'не приняты; в ресторанах к счёту могут прибавить сервисный сбор',
      taxi: 'не приняты, оплата по счётчику или в приложении',
      hotel: 'не обязательны',
      note: 'чаевые не ждут; налог GST 9% включают в чек',
    },
    emergency: {
      police: '999',
      ambulance_fire: '995',
      embassy_ru_phone: '+65-6235-1832',
      embassy_ru_url: 'https://singapore.mid.ru/ru/',
      embassy_note: 'консульский отдел: +65-6320-3263; адрес — 51 Nassim Road',
    },
    water: { tap_drinkable: true, note: 'пьют прямо из-под крана: вода соответствует нормам ВОЗ, фильтр не нужен' },
    taxi_apps: [
      { name: 'Grab', note: 'такси и машины с водителем по всему острову' },
      { name: 'Gojek', note: 'машины с водителем, удобно сравнивать цену с Grab' },
      { name: 'CDG Zig', note: 'приложение таксопарка ComfortDelGro' },
    ],
    sources: [
      { name: 'Посольство РФ в Сингапуре', url: 'https://singapore.mid.ru/ru/' },
      { name: 'Полиция Сингапура', url: 'https://www.police.gov.sg/' },
      { name: 'Гражданская оборона Сингапура (SCDF)', url: 'https://www.scdf.gov.sg/' },
      { name: 'PUB — качество водопроводной воды', url: 'https://www.pub.gov.sg/Public/WaterLoop/Water-Quality' },
    ],
    updated: '2026-09-12',
  },
  'hong-kong': {
    tipping: {
      restaurants: 'в большинстве ресторанов в счёт включают 10% сервисного сбора, в кафе и закусочных его может не быть',
      taxi: 'не обязательны; с 1 апреля 2026 таксист обязан принимать минимум два способа электронной оплаты',
      hotel: 'носильщику по желанию',
      note: 'сверх сервисного сбора оставлять не обязательно',
    },
    emergency: {
      police: '999',
      ambulance_fire: '999',
      embassy_ru_phone: '+852-2877-7188',
      embassy_ru_url: 'https://hongkong.mid.ru/ru/',
      embassy_note: 'Генеральное консульство: Sun Hung Kai Centre, 30 Harbour Road, Ваньчай',
    },
    water: { tap_drinkable: true, note: 'водопровод отвечает стандартам ВОЗ, но в старых домах качество портят трубы и баки — там надёжнее кипятить или брать бутилированную' },
    taxi_apps: [
      { name: 'Uber', note: 'работает в Гонконге, есть поездки из аэропорта' },
    ],
    sources: [
      { name: 'Генеральное консульство РФ в Гонконге', url: 'https://hongkong.mid.ru/ru/' },
      { name: 'Консульский департамент МИД России — Китай и Гонконг', url: 'https://www.kdmid.ru/docs/china/information-about-the-country/' },
      { name: 'Водное управление Гонконга (WSD)', url: 'https://www.wsd.gov.hk/en/core-businesses/water-quality/index.html' },
      { name: 'Транспортный департамент Гонконга — такси', url: 'https://www.td.gov.hk/en/transport_in_hong_kong/public_transport/taxi/index.html' },
    ],
    updated: '2026-09-12',
  },
  'seychelles': {
    tipping: {
      restaurants: 'не обязательны; прежде чем оставлять, проверьте, нет ли в счёте строки service charge',
      taxi: 'по желанию; поездка стоит $5–100 в зависимости от расстояния и времени суток',
      hotel: 'по желанию, носильщику и горничной',
      note: 'чаевые оставляют за хороший сервис, обязательной нормы нет',
    },
    emergency: { police: '999 или 112', ambulance: '151', fire: '999', embassy_ru_phone: '+248-252-95-49 (экстренный), +248-426-65-90', embassy_ru_url: 'https://seychelles.mid.ru/ru/' },
    water: {
      tap_drinkable: true,
      note: 'водопровод PUC подаёт очищенную питьевую воду, на Маэ, Праслине и Ла-Диге её дополняют опреснители; после сильных ливней, когда речная вода слишком мутная для очистки, надёжнее бутилированная',
    },
    taxi_apps: [],
    sources: [
      { name: 'Консульский департамент МИД России: Сейшелы', url: 'https://www.kdmid.ru/docs/seychelles/russian-consular-offices/' },
      { name: 'Министерство туризма Сейшел: экстренные номера', url: 'https://tourism.gov.sc/wp-content/uploads/2022/08/SEYCHELLES-EMERGENGY-ESSENTIAL-NUMBERS-NEW.pdf' },
      { name: 'PUC: водоснабжение Сейшел', url: 'https://www.puc.sc/water/' },
      { name: 'Консульский департамент МИД России: информация о Сейшелах', url: 'https://www.kdmid.ru/docs/seychelles/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'tanzania': {
    tipping: {
      restaurants: 'по желанию',
      taxi: 'по желанию; от аэропорта Дар-эс-Салама до центра такси стоит 20–30 тыс. шиллингов',
      hotel: 'около 500 шиллингов носильщику или прислуге',
      note: 'на Килиманджаро гиду в среднем $10 в день, повару и носильщику — по $5',
    },
    emergency: {
      police: '112',
      ambulance: '115',
      fire: '114',
      embassy_ru_phone: '+255-767-919-756 (экстренный), консульский отдел +255-22-266-60-46',
      embassy_ru_url: 'https://tanzania.mid.ru/ru/contacts/',
    },
    water: { tap_drinkable: false, note: 'водопроводную воду не пьют, бутилированную продают везде' },
    taxi_apps: [
      { name: 'Bolt', note: 'работает в Дар-эс-Саламе и на Занзибаре' },
    ],
    sources: [
      { name: 'Посольство РФ в Танзании', url: 'https://tanzania.mid.ru/ru/contacts/' },
      { name: 'Полиция Танзании: экстренные номера', url: 'https://www.polisi.go.tz/' },
      { name: 'Консульский департамент МИД России: информация о Танзании', url: 'https://www.kdmid.ru/docs/tanzania/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'mauritius': {
    tipping: { restaurants: 'по желанию', taxi: 'счётчиков нет, цену оговаривают до поездки', hotel: 'по желанию', note: 'чаевые не обязательны' },
    emergency: { police: '999 или 112', ambulance: '114', fire: '115', embassy_ru_phone: '+230 5729 40 36 (экстренный), +230 696-1545', embassy_ru_url: 'https://mauritius.mid.ru/' },
    taxi_apps: [],
    sources: [
      { name: 'Правительственный портал Маврикия: горячие линии', url: 'https://govmu.org/EN/Pages/default.aspx' },
      { name: 'Полиция Маврикия', url: 'https://police.govmu.org/police/' },
      { name: 'Консульский департамент МИД России: Маврикий', url: 'https://www.kdmid.ru/docs/mauritius/russian-consular-offices/' },
      { name: 'Консульский департамент МИД России: информация о Маврикии', url: 'https://www.kdmid.ru/docs/mauritius/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'madagascar': {
    tipping: { restaurants: 'по желанию', taxi: 'по желанию; по городу безопаснее такси, чем общественный транспорт', hotel: 'по желанию', note: 'чаевые не обязательны' },
    emergency: {
      police: '117',
      ambulance: '020-22-357-53',
      fire: '118',
      embassy_ru_phone: '+261-38-25-980-40 (экстренный), консульский отдел +261 20 85 539 10',
      embassy_ru_url: 'https://madagascar.mid.ru/ru/contacts/',
    },
    water: { tap_drinkable: false, note: 'некипячёную воду и лёд исключают полностью, пьют бутилированную или кипячёную' },
    taxi_apps: [],
    sources: [
      { name: 'Посольство РФ на Мадагаскаре', url: 'https://madagascar.mid.ru/ru/contacts/' },
      { name: 'Консульский департамент МИД России: Мадагаскар', url: 'https://www.kdmid.ru/docs/madagascar/russian-consular-offices/' },
      { name: 'Консульский департамент МИД России: информация о Мадагаскаре', url: 'https://www.kdmid.ru/docs/madagascar/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'south-africa': {
    tipping: {
      restaurants: '10–15%, если сервисный сбор не включён в счёт',
      taxi: 'в приложениях по желанию; у водителей почти не бывает сдачи',
      hotel: 'носильщику и горничной по желанию',
      note: 'обязательных ставок нет, но официанты рассчитывают на чаевые',
    },
    emergency: { police: '10111', ambulance: '10177', embassy_ru_phone: '+27-60-796-27-17 (дежурный, Претория); Кейптаун: +27-82-374-05-18', embassy_ru_url: 'https://russianembassyza.mid.ru/ru/' },
    water: { tap_drinkable: true, note: 'в Кейптауне водопроводная вода проходит проверку по стандарту SANS 241 и пригодна для питья; в глубинке и после перебоев надёжнее бутилированная' },
    taxi_apps: [
      { name: 'Uber', note: 'работает в Кейптауне круглосуточно' },
      { name: 'Bolt', note: 'работает в Кейптауне' },
    ],
    sources: [
      { name: 'Консульский департамент МИД России: ЮАР', url: 'https://www.kdmid.ru/docs/south-africa/russian-consular-offices/' },
      { name: 'Полиция ЮАР', url: 'https://www.saps.gov.za/' },
      { name: 'Консульский департамент МИД России: информация о ЮАР', url: 'https://www.kdmid.ru/docs/south-africa/information-about-the-country/' },
      {
        name: 'Кейптаун: качество водопроводной воды',
        url: 'https://www.capetown.gov.za/Family%20and%20home/residential-utility-services/residential-water-and-sanitation-services/water-quality',
      },
    ],
    updated: '2026-09-12',
  },
  'israel': {
    emergency: { police: '100', ambulance: '101', fire: '102', embassy_ru_phone: '+972-54-962-23-41', embassy_ru_url: 'https://israel.mid.ru/' },
    water: { tap_drinkable: true, note: 'водопроводная вода питьевая по всей стране, минздрав советует пить именно её; горячую из-под крана для питья не берут' },
    taxi_apps: [
      { name: 'Gett', note: 'по всей стране, в том числе официальное такси аэропорта Бен-Гурион' },
    ],
    sources: [
      { name: 'Посольство РФ в Израиле', url: 'https://israel.mid.ru/ru/' },
      { name: 'КонсДеп МИД РФ — Израиль', url: 'https://www.kdmid.ru/docs/israel/information-about-the-country/' },
      { name: 'Минздрав Израиля — вопросы о питьевой воде', url: 'https://www.gov.il/en/pages/drinking_water_faq' },
    ],
    updated: '2026-09-12',
  },
  'jordan': {
    emergency: { police: '911', ambulance_fire: '911', embassy_ru_phone: '+962-77-552-81-25', embassy_ru_url: 'https://jordan.mid.ru/' },
    water: {
      tap_drinkable: false,
      note: 'водопроводная вода не везде соответствует международным стандартам; в пятизвёздочных и большинстве четырёхзвёздочных отелей своя очистка, но пить и готовить советуют на недорогой бутилированной',
    },
    taxi_apps: [
      { name: 'Careem', note: 'приложение региона, работает в Иордании' },
      { name: 'Uber', note: 'Амман, круглосуточно' },
    ],
    sources: [
      { name: 'Посольство РФ в Иордании — контакты', url: 'https://jordan.mid.ru/ru/embassy/contacts/' },
      { name: 'Посольство РФ в Иордании — правила въезда и пребывания', url: 'https://jordan.mid.ru/ru/consular-services/vizovye_voprosy/pravila_vezda_i_prebyvaniya_v_iordanii/' },
      { name: 'КонсДеп МИД РФ — Иордания', url: 'https://www.kdmid.ru/docs/jordan/information-about-the-country/' },
    ],
    updated: '2026-09-12',
  },
  'iran': {
    emergency: { police: '110', ambulance: '115', fire: '125', embassy_ru_phone: '+98-21-6670-1161', embassy_ru_url: 'https://iran.mid.ru/' },
    taxi_apps: [
      { name: 'Snapp', note: 'онлайн-такси в городах; в аэропорту Имама Хомейни есть стойка официального такси' },
    ],
    sources: [
      { name: 'Посольство РФ в Иране', url: 'https://iran.mid.ru/ru/' },
      { name: 'КонсДеп МИД РФ — Иран', url: 'https://www.kdmid.ru/docs/iran/information-about-the-country/' },
      { name: 'МИД России — Иран', url: 'https://mid.ru/ru/maps/ir/1766378/' },
    ],
    updated: '2026-09-12',
  },
  'kazakhstan': {
    tipping: {
      restaurants: 'по желанию; если в счёте есть строка за обслуживание, сверху не оставляют',
      taxi: 'не нужны: в приложении цена известна заранее',
      hotel: 'по желанию',
      note: 'чаевые не обязательны',
    },
    emergency: { police: '102', ambulance: '103', fire: '101', embassy_ru_phone: '+7-708-880-05-31', embassy_ru_url: 'https://kazakhstan.mid.ru/' },
    water: { tap_drinkable: false, note: 'из-под крана лучше не пить: берите бутилированную или кипятите; воду из горных рек и ручьёв — только после кипячения или фильтра' },
    taxi_apps: [
      { name: 'Yandex Go', note: 'работает в Казахстане' },
      { name: 'Максим', note: 'ещё один сервис заказа такси, работает в Казахстане' },
    ],
    sources: [
      {
        name: 'Посольство РФ в Казахстане — памятка для едущих в Казахстан',
        url: 'https://kazakhstan.mid.ru/ru/consular-services/consulate/vnimaniyu_grazhdan_sobirayushchikhsya_posetit_kazakhstan/',
      },
      { name: 'Консульский департамент МИД РФ — Казахстан', url: 'https://www.kdmid.ru/docs/kazakhstan/information-about-the-country/' },
      { name: 'CDC Travelers\' Health — Kazakhstan', url: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/kazakhstan' },
    ],
    updated: '2026-09-12',
  },
  'uzbekistan': {
    tipping: {
      restaurants: 'по желанию; если в счёте есть строка за обслуживание, сверху не оставляют',
      taxi: 'не нужны: в приложении цена известна заранее',
      hotel: 'по желанию',
      note: 'чаевые не обязательны',
    },
    emergency: { police: '102', ambulance: '103', fire: '101', embassy_ru_phone: '+998-71-120-35-04', embassy_ru_url: 'https://uzbekistan.mid.ru/' },
    water: { tap_drinkable: false, note: 'из-под крана не пьют: берите бутилированную; кишечные инфекции у туристов частые, поэтому еду с уличных лотков и на базарах лучше не брать' },
    taxi_apps: [
      { name: 'Yandex Go', note: 'работает в Узбекистане' },
      { name: 'Максим', note: 'есть в Ташкенте' },
    ],
    sources: [
      { name: 'Посольство РФ в Узбекистане — временное пребывание', url: 'https://uzbekistan.mid.ru/ru/consular-services/dlya_grazhdan_rossii/vremennoe_prebyvanie_v_uzbekistane/' },
      { name: 'Консульский департамент МИД РФ — Узбекистан', url: 'https://www.kdmid.ru/docs/uzbekistan/information-about-the-country/' },
      { name: 'CDC Travelers\' Health — Uzbekistan', url: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/uzbekistan' },
    ],
    updated: '2026-09-12',
  },
  'tajikistan': {
    tipping: {
      restaurants: 'по желанию; если в счёте есть строка за обслуживание, сверху не оставляют',
      taxi: 'не нужны: цену называют до поездки',
      hotel: 'по желанию',
      note: 'чаевые не обязательны',
    },
    emergency: { embassy_ru_phone: '+992-555-551-715', embassy_ru_url: 'https://dushanbe.mid.ru/' },
    water: {
      tap_drinkable: false,
      note: 'пьют только воду из заводских бутылок: посольство советует не пить некипячёную воду, не брать лёд, свежевыжатые соки и немытые фрукты и даже зубы чистить бутилированной водой',
    },
    taxi_apps: [
      { name: 'Максим', note: 'работает в Таджикистане' },
    ],
    sources: [
      { name: 'Консульский департамент МИД РФ — Таджикистан', url: 'https://www.kdmid.ru/docs/tajikistan/information-about-the-country/' },
      { name: 'Консульский департамент МИД РФ — посольство и генконсульство в Таджикистане', url: 'https://www.kdmid.ru/docs/tajikistan/russian-consular-offices/' },
      { name: 'CDC Travelers\' Health — Tajikistan', url: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/tajikistan' },
    ],
    updated: '2026-09-12',
  },
  'kyrgyzstan': {
    tipping: {
      restaurants: 'по желанию; если в счёте есть строка за обслуживание, сверху не оставляют',
      taxi: 'не нужны: в приложении цена известна заранее',
      hotel: 'по желанию',
      note: 'чаевые не обязательны; приезжим могут назвать цену выше обычной — на базарах можно торговаться',
    },
    emergency: { police: '102', ambulance: '103', fire: '112', embassy_ru_phone: '+996-770-448-577', embassy_ru_url: 'https://kyrgyz.mid.ru/' },
    water: { tap_drinkable: false, note: 'из-под крана не пьют: берите бутилированную; перед поездкой советуют прививку от гепатита А, есть лучше в кафе и столовых, а не с уличных лотков' },
    taxi_apps: [
      { name: 'Yandex Go', note: 'работает в Кыргызстане: такси, еда и доставка в одном приложении' },
    ],
    sources: [
      { name: 'Посольство РФ в Киргизии — российским туристам', url: 'https://kyrgyz.mid.ru/ru/countries/kirgiziya/for-russia-tourists/' },
      { name: 'Консульский департамент МИД РФ — Киргизия', url: 'https://www.kdmid.ru/docs/kyrgyzstan/information-about-the-country/' },
      { name: 'МЧС Киргизии', url: 'https://www.mchs.gov.kg/' },
      { name: 'CDC Travelers\' Health — Kyrgyzstan', url: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/kyrgyzstan' },
    ],
    updated: '2026-09-12',
  },
  'croatia': {
    tipping: { restaurants: 'по желанию, за хороший сервис', taxi: 'по желанию', hotel: 'по желанию', note: 'чаевые — на усмотрение гостя' },
    emergency: {
      general: '112',
      police: '192',
      ambulance: '194',
      fire: '193',
      sea_rescue: '195',
      embassy_ru_phone: '+385-1-370-42-99, экстренный +385-99-83-90-861',
      embassy_ru_url: 'https://croatia.mid.ru/',
      embassy_note: 'консульский отдел: +385-1-3756-509; экстренный номер — только если жизни и здоровью угрожает опасность; 195 — спасение на море',
    },
    water: { tap_drinkable: true, note: 'воду из городского водопровода контролирует Хорватский институт здравоохранения, её можно пить; частные колодцы в сёлах в госмониторинг не входят' },
    taxi_apps: [
      { name: 'Bolt', note: 'Загреб, Сплит, Дубровник, Задар, Пула, Риека' },
      { name: 'Uber', note: 'работает в Хорватии' },
    ],
    sources: [
      { name: 'Посольство РФ в Хорватии', url: 'https://croatia.mid.ru/ru/' },
      { name: 'Ravnateljstvo civilne zaštite — pozivi za žurnu pomoć', url: 'https://civilna-zastita.gov.hr/izdvojeno/pozivi-za-zurnu-pomoc/265' },
      {
        name: 'HZJZ — voda za piće iz javnih vodoopskrbnih sustava',
        url: 'https://www.hzjz.hr/priopcenja-mediji/priopcenje-za-javnost-voda-za-pice-iz-javnih-vodoopskrbnih-sustava-zdravstveno-je-ispravna/',
      },
      { name: 'GOV.UK — Croatia safety and security', url: 'https://www.gov.uk/foreign-travel-advice/croatia/safety-and-security' },
    ],
    updated: '2026-09-12',
  },
  'cyprus': {
    tipping: { restaurants: 'по усмотрению гостя', taxi: 'водители ценят небольшие чаевые', hotel: 'портье — по желанию', note: 'чаевые на Кипре не обязательны, это жест благодарности' },
    emergency: {
      police: '112 или 199',
      ambulance_fire: '112',
      embassy_ru_phone: '+357-22-776832 (консульский отдел), экстренный +357-99-477258',
      embassy_ru_url: 'https://cyprus.mid.ru/',
      embassy_note: 'экстренный номер посольства — только при угрозе жизни и здоровью, это не справочная',
    },
    taxi_apps: [
      { name: 'Bolt', note: 'Ларнака, Лимасол, Никосия, Пафос, Айя-Напа' },
    ],
    sources: [
      { name: 'Посольство РФ на Кипре — консульский отдел', url: 'https://cyprus.mid.ru/ru/consular-services/' },
      { name: 'Cyprus Police — Nicosia', url: 'https://police.gov.cy/police/police.nsf/All/1C5A5E53BE5D0786C225852F0023EAE4?OpenDocument' },
      { name: 'Visit Cyprus — Health & Safety', url: 'https://www.visitcyprus.com/useful-info/health-safety/' },
      { name: 'Visit Cyprus — Transportation', url: 'https://www.visitcyprus.com/useful-info/transportation/' },
    ],
    updated: '2026-09-12',
  },
  'greece': {
    tipping: {
      restaurants: 'по желанию, за хороший сервис',
      taxi: 'по желанию',
      hotel: 'по желанию',
      note: 'чаевые — жест благодарности; а вот чек с перечнем блюд ресторан обязан выдать по закону',
    },
    emergency: {
      general: '112',
      police: '100',
      ambulance: '166',
      fire: '199',
      tourist: '1571',
      coast_guard: '108',
      embassy_ru_phone: '+30-210-672-52-35, экстренный +30-695-8000-123',
      embassy_ru_url: 'https://greece.mid.ru/',
      embassy_note: '112 — единый европейский номер; 1571 — туристическая полиция на греческом, английском, французском и немецком; генконсульство РФ в Салониках: +30-231-025-72-01',
    },
    water: {
      tap_drinkable: true,
      note: 'в Афинах и Аттике вода из-под крана отличного качества — её поставляет водоканал EYDAP из водохранилищ в чистых районах; на островах спросите хозяев жилья, какую воду пьют местные',
    },
    taxi_apps: [
      { name: 'Uber', note: 'вызывает лицензированные такси' },
      { name: 'Free Now', note: 'тоже работает с лицензированными такси' },
      { name: 'Bolt', note: 'Афины, Крит, Миконос' },
    ],
    sources: [
      { name: 'Посольство РФ в Греции — контакты', url: 'https://greece.mid.ru/ru/embassy/contacts/' },
      { name: 'Посольство РФ в Греции — полезные телефоны', url: 'https://greece.mid.ru/ru/turistam/poleznye_telefony_gretsii/' },
      { name: 'Hellenic Police — Direct lines', url: 'https://www.astynomia.gr/citizens-guide/direct-lines/?lang=en' },
      { name: 'EYDAP — Water', url: 'https://www.eydap.gr/en/TheCompany/Water/' },
    ],
    updated: '2026-09-12',
  },
  'costa-rica-panama': {
    tipping: {
      restaurants: '10% за обслуживание по закону вписывают в счёт отдельной строкой «Servicio 10%», сверху — по желанию',
      taxi: 'не обязательны: счётчик показывает максимум, водитель может взять меньше',
      hotel: 'по желанию; 13% налога и 10% сервиса обычно входят в итоговую цену',
      note: 'в Панаме в крупных ресторанах и отелях 10–15% обычно включены в счёт',
    },
    emergency: {
      police: '911 (в Панаме — 104)',
      ambulance_fire: '911 (в Панаме: скорая 911, пожарные 103)',
      embassy_ru_phone: 'Коста-Рика: +506 8828-9722 (круглосуточно); Панама: +507 382-2582 (консульский отдел)',
      embassy_ru_url: 'https://costarica.mid.ru/',
    },
    water: {
      tap_drinkable: true,
      note: 'в Коста-Рике из-под крана пьют почти везде, бутилированная нужна в некоторых сельских районах и в парке вулкана Поас; в Панаме водопроводная вода питьевая в Панама-Сити и крупных городах, за их пределами — только бутилированная',
    },
    taxi_apps: [
      { name: 'Uber', note: 'Сан-Хосе, Ла-Фортуна, Либерия, Лимон, Пунтаренас; в Панаме — Панама-Сити и Давид' },
      { name: 'DiDi', note: 'Сан-Хосе, Сан-Карлос, Либерия' },
      { name: 'inDrive', note: 'цену поездки согласуют с водителем, работает и в Панаме' },
    ],
    sources: [
      { name: 'Посольство России в Коста-Рике', url: 'https://costarica.mid.ru/' },
      { name: 'МИД России — памятка по Коста-Рике', url: 'https://www.kdmid.ru/docs/costa-rica/information-about-the-country/' },
      { name: 'Sistema de Emergencias 9-1-1 Costa Rica', url: 'https://www.911.go.cr/' },
      { name: 'Instituto Costarricense de Turismo — FAQ', url: 'https://www.visitcostarica.com/faqs' },
    ],
    updated: '2026-09-12',
  },
  'guatemala-belize': {
    tipping: {
      restaurants: 'в счёт часто вписывают «propina sugerida» 10%, но закон её не требует: можно отказаться или оставить меньше',
      taxi: 'не обязательны',
      hotel: 'по желанию',
      note: 'чаевые в Гватемале добровольные, обязательного процента нет',
    },
    emergency: {
      police: '110 или 120 (в Белизе — 911)',
      ambulance: '128',
      fire: '122 или 123',
      tourist: '1500 — INGUAT, институт туризма',
      embassy_ru_phone: 'Гватемала: +502 2367-2765 (горячая линия); Белиз: посольство в Мексике, +52 55 7913-9817',
      embassy_ru_url: 'https://mid.ru/ru/maps/gt/',
    },
    water: { tap_drinkable: false, note: 'из-под крана не пьют ни в Гватемале, ни в Белизе: только кипячёная или бутилированная вода, лёд в напитках тоже лучше не брать' },
    taxi_apps: [
      { name: 'Uber', note: 'в Гватемала-Сити круглосуточно, в том числе из аэропорта Ла-Аврора' },
    ],
    sources: [
      { name: 'МИД России — памятка по Гватемале', url: 'https://www.kdmid.ru/docs/guatemala/information-about-the-country/' },
      { name: 'МИД России — Гватемала, горячая линия посольства', url: 'https://mid.ru/ru/maps/gt/' },
      { name: 'Посольство России в Мексике (представляет Россию в Белизе)', url: 'https://mexico.mid.ru/ru/' },
      { name: 'Smartraveller — Guatemala', url: 'https://www.smartraveller.gov.au/destinations/americas/guatemala' },
    ],
    updated: '2026-09-12',
  },
  'finland': {
    tipping: {
      restaurants: 'нет, не ожидаются: обслуживание входит в цену',
      taxi: 'нет',
      hotel: 'не приняты',
      note: 'в Финляндии чаевые не ждут ни в кафе, ни в такси; оставить можно, но это жест, а не правило',
    },
    emergency: {
      police: '112',
      ambulance_fire: '112',
      embassy_ru_phone: '+358-9-278-40-23 (консульский отдел); +358-50-476-83-28 (дежурный дипломат)',
      embassy_ru_url: 'https://helsinki.mid.ru/',
      embassy_note: 'в Финляндии один номер 112 для полиции, скорой и пожарных, звонок бесплатный с любого телефона',
    },
    water: { tap_drinkable: true, note: 'из-под крана пьют по всей стране, вода чистая и холодная; исключение — дачи, где кран идёт прямо из озера' },
    taxi_apps: [
      { name: 'Bolt', note: 'работает в Хельсинки' },
      { name: 'Taksi Helsinki', note: 'приложение городской службы такси, есть фиксированная цена до аэропорта' },
    ],
    sources: [
      { name: 'Консульский департамент МИД России — учреждения в Финляндии', url: 'https://www.kdmid.ru/docs/finland/russian-consular-offices/' },
      { name: 'Служба экстренных вызовов 112 Финляндии', url: 'https://112.fi/en' },
      { name: 'Visit Finland — чаевые, деньги, вода', url: 'https://www.visitfinland.com/en/practical-tips/currency-tipping-and-paying-in-finland/' },
      { name: 'Пограничная служба Финляндии — ограничения для граждан России', url: 'https://raja.fi/en/entry-restrictions' },
    ],
    updated: '2026-09-12',
  },
  'switzerland': {
    tipping: {
      restaurants: 'не обязательны: обслуживание в цене; принято округлить или оставить около 10%',
      taxi: 'по желанию, округляют до франка',
      hotel: 'не обязательны',
      note: 'чаевые включены в цену, округление — жест, а не долг',
    },
    emergency: {
      police: '117 или общий 112',
      ambulance: '144; в горах — авиаспасатели Rega, 1414',
      fire: '118',
      embassy_ru_phone: '+41-31-352-05-67 (консульский отдел); +41-79-367-11-11 (дежурный)',
      embassy_ru_url: 'https://switzerland.mid.ru/',
      embassy_note: 'по 112 соединяют с полицией, звонить можно с иностранной SIM; генконсульство в Женеве: дежурный +41-76-331-79-55',
    },
    water: { tap_drinkable: true, note: 'из любого крана без риска для здоровья; бутылку наполняют и в городских фонтанах — в одном Цюрихе их 1 200' },
    taxi_apps: [
      { name: 'Uber', note: 'Цюрих, круглосуточно' },
      { name: 'Bolt', note: 'Цюрих' },
    ],
    sources: [
      { name: 'Консульский департамент МИД России — учреждения в Швейцарии', url: 'https://www.kdmid.ru/docs/switzerland/russian-consular-offices/' },
      { name: 'Портал властей Швейцарии ch.ch — экстренные номера', url: 'https://www.ch.ch/en/safety-and-justice/emergencies-and-danger/' },
      { name: 'Switzerland Tourism — питьевая вода', url: 'https://www.myswitzerland.com/en/planning/about-switzerland/general-facts/general-information/drinking-water/' },
      { name: 'Switzerland Tourism — чаевые', url: 'https://www.myswitzerland.com/en/planning/about-switzerland/general-facts/money-and-shopping/tipping/' },
    ],
    updated: '2026-09-12',
  },
};

// Helper — есть ли essentials для slug
// Страницы одной страны (север и юг, регион и вся страна): номера, вода, чаевые и посольство общие,
// такси — своё там, где в городах другое. Своя запись страницы, если есть, главнее.
export const ESSENTIALS_ALIAS = { 'chile-fjords': 'chile', 'chile-patagonia': 'chile', 'japan-hokkaido': 'japan', 'australia-north': 'australia-east', 'canada-rockies': 'canada-east', 'raja-ampat': 'bali', 'sumatra-kalimantan': 'bali' };
const ESSENTIALS_OVERRIDE = {"raja-ampat":{"taxi_apps":[]},"chile-patagonia":{"taxi_apps":[]},"chile-fjords":{"taxi_apps":[]},"sumatra-kalimantan":{"taxi_apps":[{"name":"Grab","note":"Медан и Баликпапан; машину заказывают прямо в аэропортах Куаланаму, Силангит у Тобы и Минангкабау в Паданге"},{"name":"Gojek","note":"Медан, Пематангсиантар, Паданг, Букиттинги, Баликпапан, Самаринда, Палангкарая"},{"name":"Maxim","note":"Медан и Баликпапан, а также Пангкалан-Бун — город у Танджунг-Путинга"}]},"australia-north":{"taxi_apps":[{"name":"Uber","note":"Сидней, Брисбен, Голд-Кост, Кэрнс и Дарвин"}]}};

export function getEssentials(slug) {
  if (ESSENTIALS[slug]) return ESSENTIALS[slug];
  const base = ESSENTIALS[ESSENTIALS_ALIAS[slug]];
  return base ? { ...base, ...(ESSENTIALS_OVERRIDE[slug] || {}) } : null;
}

export function hasEssentials(slug) {
  return Boolean(getEssentials(slug));
}
