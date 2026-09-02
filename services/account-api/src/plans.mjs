const text = (value, max) => String(value ?? '').trim().slice(0, max);
const integer = (value, fallback, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const date = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

export function sanitizePlan(value, now = Date.now()) {
  const destinationSlug = text(value?.destinationSlug ?? value?.slug, 80).toLowerCase();
  const planId = text(value?.id, 96);
  if (!planId || !/^[a-zA-Z0-9_-]+$/.test(planId) || !/^[a-z0-9-]+$/.test(destinationSlug)) return null;
  const kind = value?.kind === 'route' ? 'route' : 'destination';
  const stops = kind === 'route' && Array.isArray(value?.stops) ? value.stops.slice(0, 50).map((stop, index) => ({
    id: text(stop?.id, 80).replace(/[^a-zA-Z0-9_-]/g, '-'),
    label: text(stop?.label, 180),
    day: integer(stop?.day, index + 1, 1, 90),
  })).filter((stop) => stop.id && stop.label) : [];
  const dateStart = date(value?.dateStart);
  const dateEnd = date(value?.dateEnd);
  if (dateStart && dateEnd && dateEnd < dateStart) return null;
  return {
    schemaVersion: 2,
    id: planId,
    kind,
    routeSlug: kind === 'route' ? text(value?.routeSlug, 96) || null : null,
    destinationSlug,
    slug: destinationSlug,
    title: text(value?.title ?? value?.nom, 160) || destinationSlug,
    nom: text(value?.nom ?? value?.title, 160) || destinationSlug,
    monthIdx: value?.monthIdx == null ? null : integer(value.monthIdx, 0, 0, 11),
    days: integer(value?.days, 7, 1, 90),
    people: integer(value?.people, 1, 1, 10),
    dateStart,
    dateEnd,
    stops,
    savedAt: integer(value?.savedAt, now, 1, Number.MAX_SAFE_INTEGER),
    updatedAt: now,
    version: integer(value?.version, 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function planFingerprint(plan) {
  const { version: _version, updatedAt: _updatedAt, syncStatus: _syncStatus, ...value } = plan;
  return JSON.stringify(value);
}
