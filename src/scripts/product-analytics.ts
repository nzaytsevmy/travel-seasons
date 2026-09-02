const ALLOWED = new Set([
  'route_view', 'route_start', 'route_edit', 'route_save_intent',
  'consent_accept', 'auth_start', 'auth_success', 'auth_error',
  'sync_success', 'sync_conflict', 'route_partner_click',
]);

export function trackProductEvent(name: string, values: Record<string, unknown> = {}) {
  if (!ALLOWED.has(name)) return;
  const detail = {
    route_slug: String(values.route_slug ?? '').slice(0, 96),
    plan_kind: String(values.plan_kind ?? 'route').slice(0, 24),
    stop_count: Math.max(0, Math.min(50, Number(values.stop_count) || 0)),
    people_bucket: Number(values.people) > 4 ? '5_plus' : String(Math.max(1, Number(values.people) || 1)),
    status: String(values.status ?? '').slice(0, 32),
    contract: 'routes_v1',
  };
  document.dispatchEvent(new CustomEvent(`tt:${name}`, { detail }));
  const ym = (window as any).ym;
  if (typeof ym === 'function') ym(95832375, 'reachGoal', name, detail);
}
