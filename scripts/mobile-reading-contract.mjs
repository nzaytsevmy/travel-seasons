// The former destination navigation used .dt; the trip price TABLE also does.
// Identify the navigation landmark, never treat a data table as a removed menu.
export function hasReadingObstruction(html) {
  return /<nav\b[^>]*(?:aria-label=["']Разделы направления:|class=["'][^"']*\bdt\b)/i.test(html)
    || /class=["'][^"']*\bsticky-cta\b/i.test(html);
}
