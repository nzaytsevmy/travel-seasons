// Session parameters use the site's consented counter. No input values are sent.
export function recordPrepInteraction(action) {
  if (!window.__analyticsEnabled || typeof window.ym !== 'function') return false;
  try {
    if (window.localStorage.getItem('tt_consent') !== 'granted') return false;
  } catch {
    return false;
  }
  window.ym(95832375, 'params', { travel_prep: { [action]: 1 } });
  return true;
}
