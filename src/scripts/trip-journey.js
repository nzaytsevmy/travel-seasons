// Месяц из подбора сохраняется на пути через чистый URL гида.
// Внешний новый визит прекращает атрибуцию прежней поездки.
export function initTripJourney(doc = document, win = window) {
  try {
    const age = Date.now() - Number(win.sessionStorage.getItem('tt_home_journey') || 0);
    const internal = doc.referrer && new URL(doc.referrer).origin === win.location.origin;
    if (win.location.pathname !== '/' && (!internal || age > 30 * 60 * 1000 || age < 0)) {
      win.sessionStorage.removeItem('tt_home_journey');
      return;
    }
    if (age > 30 * 60 * 1000 || age < 0) return;
    doc.body.dataset.journeySource = 'home_planner';
    const state = JSON.parse(win.sessionStorage.getItem('tt_home_selection') || '{}');
    if (!Number.isInteger(state.m) || state.m < 1 || state.m > 12) return;
    for (const a of doc.querySelectorAll('a[href^="/calculator/"]')) {
      const url = new URL(a.href, win.location.origin);
      if (!url.searchParams.has('m')) url.searchParams.set('m', String(state.m));
      a.href = url.href;
    }
  } catch { /* Отказ storage не блокирует гиды и калькулятор. */ }
}
