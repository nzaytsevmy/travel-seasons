// Когда свежая выгрузка цен — это отказ поставщика, а не рынок.
// 12.09.2026 аудит: отозванный доступ, лимит запросов или смена формата ответа превращали
// все живые цены в «цены нет», и файл цен перезаписывался молча — сайт показывал прикидки.
export const MIN_SHARE_OF_PREVIOUS = 0.5;

export function countFilled(prices) {
  return Object.values(prices ?? {}).flatMap((m) => Object.values(m)).filter((v) => v !== null).length;
}

export function refuseReason(prevFilled, filled) {
  if (filled === 0) return 'ни одной живой цены';
  if (prevFilled > 0 && filled < prevFilled * MIN_SHARE_OF_PREVIOUS) {
    return `живых цен ${filled} против ${prevFilled} в прошлом обновлении`;
  }
  return null;
}
