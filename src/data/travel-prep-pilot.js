// Freeze this cohort until the 28/56-day readout. Other detail URLs are controls.
export const TRAVEL_PREP_UPDATED_AT = '2026-11-06';
export const TRAVEL_PREP_PILOT = Object.freeze([
  '/packing/',
  '/packing/egypt/',
  '/packing/egypt/december/',
  '/packing/thailand/',
  '/packing/thailand/december/',
  '/visa/',
  '/visa/dagestan/',
  '/visa/egypt/',
  '/visa/japan/',
  '/visa/thailand/',
]);

export function isTravelPrepPilot(url) {
  return TRAVEL_PREP_PILOT.includes(new URL(url, 'https://traveltribe.ru').pathname);
}

export const PACKING_EDITORIAL = {
  egypt: {
    source: 'https://www.experienceegypt.eg/en/home/Geography',
    checkedAt: '2026-11-06',
    caption: 'Пирамиды Гизы',
    lead: 'Соберите базовый список на неделю, затем добавьте вещи для моря, прогулок по городу или выезда в пустыню.',
    december: 'Для курортов Красного моря и поездок по долине Нила понадобятся разные вещи. Начните со списка на неделю и добавьте слой для прохладного вечера.',
    notes: [
      ['Курорт Красного моря', 'К купальнику добавьте лёгкую ветровку для прогулок у воды и поездок на катере.'],
      ['Каир и долина Нила', 'Для зимних прогулок возьмите закрытую обувь и слой, который можно снять днём.'],
      ['Пустыня и Синай', 'Если планируете выезд на рассвете, положите флис и закрытую обувь. Сверьте прогноз именно для места экскурсии.'],
    ],
  },
  thailand: {
    source: 'https://www.tatnews.org/2020/11/thailands-comfortable-cooler-months-of-november-february-are-a-fantastic-time-to-travel/',
    coastSource: 'https://www.tatnews.org/2018/08/tat-encourages-travellers-to-check-weather-updates-during-monsoon-season/',
    checkedAt: '2026-11-06',
    caption: 'Лодки у берега Таиланда и известняковые скалы',
    lead: 'Выберите, куда едете. Для островов важны вещи для воды, для севера — одежда на прохладное утро.',
    december: 'В декабре сборы зависят от побережья. На западных островах приготовьтесь к поездкам на лодке, а для севера добавьте тёплый слой.',
    notes: [
      ['Пхукет, Краби и Пхи-Пхи', 'Для поездок на лодке пригодятся сухой мешок для телефона и сменная одежда.'],
      ['Самуи и Панган', 'Возьмите компактный дождевик и проверьте прогноз перед морской поездкой. В декабре дожди на этом побережье ещё возможны.'],
      ['Север и горы', 'Для утренних выездов положите флис или тонкую куртку и закрытую обувь.'],
    ],
  },
};
