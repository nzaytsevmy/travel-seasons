export const PLAN_STORAGE_KEY = 'tt_plans_v2';
export const LEGACY_LIST_KEY = 'tt_trips';
export const LEGACY_SINGLE_KEY = 'tt_trip';
export const MAX_PLANS = 20;

export type PlanStop = { id: string; label: string; day: number };
export type SyncStatus = 'local' | 'synced' | 'offline' | 'conflict';
export type TripPlan = {
  schemaVersion: 2;
  id: string;
  kind: 'destination' | 'route';
  routeSlug: string | null;
  destinationSlug: string;
  slug: string;
  title: string;
  nom: string;
  monthIdx: number | null;
  days: number;
  people: number;
  dateStart: string | null;
  dateEnd: string | null;
  stops: PlanStop[];
  savedAt: number;
  updatedAt: number;
  version: number;
  syncStatus: SyncStatus;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const now = () => Date.now();
const safeInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const safeDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
const safeText = (value: unknown, fallback = '', max = 160) => String(value ?? fallback).trim().slice(0, max);
const id = () => globalThis.crypto?.randomUUID?.() ?? `p-${now()}-${Math.random().toString(16).slice(2)}`;

function normalizeStop(value: any, index: number): PlanStop | null {
  const label = safeText(value?.label, '', 180);
  if (!label) return null;
  return {
    id: safeText(value?.id, `stop-${index + 1}`, 80).replace(/[^a-zA-Z0-9_-]/g, '-'),
    label,
    day: safeInt(value?.day, index + 1, 1, 90),
  };
}

export function normalizePlan(value: any): TripPlan | null {
  const destinationSlug = safeText(value?.destinationSlug ?? value?.slug, '', 80).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(destinationSlug)) return null;
  const savedAt = safeInt(value?.savedAt, now(), 1, Number.MAX_SAFE_INTEGER);
  const kind = value?.kind === 'route' ? 'route' : 'destination';
  return {
    schemaVersion: 2,
    id: safeText(value?.id, id(), 96),
    kind,
    routeSlug: kind === 'route' ? safeText(value?.routeSlug, '', 96) || null : null,
    destinationSlug,
    slug: destinationSlug,
    title: safeText(value?.title ?? value?.nom, destinationSlug, 160),
    nom: safeText(value?.nom ?? value?.title, destinationSlug, 160),
    monthIdx: value?.monthIdx == null ? null : safeInt(value.monthIdx, new Date().getMonth(), 0, 11),
    days: safeInt(value?.days, 7, 1, 90),
    people: safeInt(value?.people, 1, 1, 10),
    dateStart: safeDate(value?.dateStart),
    dateEnd: safeDate(value?.dateEnd),
    stops: Array.isArray(value?.stops)
      ? value.stops.map(normalizeStop).filter(Boolean).slice(0, 50) as PlanStop[]
      : [],
    savedAt,
    updatedAt: safeInt(value?.updatedAt, savedAt, 1, Number.MAX_SAFE_INTEGER),
    version: safeInt(value?.version, 0, 0, Number.MAX_SAFE_INTEGER),
    syncStatus: ['local', 'synced', 'offline', 'conflict'].includes(value?.syncStatus)
      ? value.syncStatus
      : 'local',
  };
}

function parseArray(storage: StorageLike, key: string): any[] {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function legacyPlans(storage: StorageLike): TripPlan[] {
  let values = parseArray(storage, LEGACY_LIST_KEY);
  if (!values.length) {
    try {
      const one = JSON.parse(storage.getItem(LEGACY_SINGLE_KEY) || 'null');
      if (one) values = [one];
    } catch {}
  }
  return values.map(normalizePlan).filter(Boolean) as TripPlan[];
}

function writeLegacy(storage: StorageLike, plans: TripPlan[]) {
  // Старые закэшированные страницы умеют показать только пять поездок.
  // Канонический список из 20 не режем: в legacy-ключ пишется совместимое окно.
  const legacy = plans.slice(0, 5).map((plan) => ({
    slug: plan.destinationSlug,
    nom: plan.title,
    monthIdx: plan.monthIdx,
    days: plan.days,
    people: plan.people,
    dateStart: plan.dateStart,
    savedAt: plan.savedAt,
  }));
  storage.setItem(LEGACY_LIST_KEY, JSON.stringify(legacy));
  if (legacy.length) storage.setItem(LEGACY_SINGLE_KEY, JSON.stringify(legacy[0]));
  else storage.removeItem(LEGACY_SINGLE_KEY);
}

export function listPlans(storage: StorageLike = localStorage): TripPlan[] {
  const canonical = parseArray(storage, PLAN_STORAGE_KEY).map(normalizePlan).filter(Boolean) as TripPlan[];
  // Повреждённое или старое хранилище с количеством выше нового лимита не
  // режем при чтении: человек сначала должен сам удалить лишнее.
  if (canonical.length) return canonical;
  // Закэшированная старая страница может записать tt_trip уже после того, как
  // новая версия успела создать пустой канонический список. Пустой v2 не
  // должен в таком случае закрывать единственную реальную поездку.
  const migrated = legacyPlans(storage).slice(0, MAX_PLANS);
  if (migrated.length || storage.getItem(PLAN_STORAGE_KEY) === null) writePlans(migrated, storage);
  return migrated;
}

export function writePlans(values: unknown[], storage: StorageLike = localStorage): TripPlan[] {
  const plans = values.map(normalizePlan).filter(Boolean) as TripPlan[];
  if (plans.length > MAX_PLANS) throw new RangeError(`Можно хранить не больше ${MAX_PLANS} планов.`);
  storage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
  writeLegacy(storage, plans);
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('tt:plans-changed', { detail: { count: plans.length } }));
  return plans;
}

export function addDestinationPlan(input: { slug: string; nom: string; monthIdx?: number | null }, storage: StorageLike = localStorage) {
  const plans = listPlans(storage);
  const existing = plans.findIndex((plan) => plan.kind === 'destination' && plan.destinationSlug === input.slug);
  if (existing >= 0) return { ok: true as const, plan: plans[existing], plans, existed: true };
  if (plans.length >= MAX_PLANS) return { ok: false as const, reason: 'limit' as const, plans };
  const plan = normalizePlan({ ...input, kind: 'destination', savedAt: now() })!;
  const next = writePlans([plan, ...plans], storage);
  return { ok: true as const, plan, plans: next, existed: false };
}

export function saveRoutePlan(input: any, storage: StorageLike = localStorage) {
  const plans = listPlans(storage);
  const existing = plans.findIndex((plan) => plan.id === input?.id || (plan.kind === 'route' && plan.routeSlug === input?.routeSlug));
  const previous = existing >= 0 ? plans[existing] : null;
  if (!previous && plans.length >= MAX_PLANS) return { ok: false as const, reason: 'limit' as const, plans };
  const plan = normalizePlan({
    ...previous,
    ...input,
    id: previous?.id ?? input?.id ?? id(),
    kind: 'route',
    savedAt: previous?.savedAt ?? now(),
    updatedAt: now(),
    syncStatus: previous?.syncStatus === 'synced' ? 'local' : (previous?.syncStatus ?? 'local'),
  })!;
  const next = [...plans];
  if (existing >= 0) next[existing] = plan;
  else next.unshift(plan);
  return { ok: true as const, plan, plans: writePlans(next, storage), existed: existing >= 0 };
}

export function removePlan(planId: string, storage: StorageLike = localStorage) {
  return writePlans(listPlans(storage).filter((plan) => plan.id !== planId), storage);
}

export function removeDestinationPlan(slug: string, storage: StorageLike = localStorage) {
  return writePlans(listPlans(storage).filter((plan) => !(plan.kind === 'destination' && plan.destinationSlug === slug)), storage);
}

export function setPlanSync(planId: string, syncStatus: SyncStatus, version?: number, storage: StorageLike = localStorage) {
  return writePlans(listPlans(storage).map((plan) => plan.id === planId
    ? { ...plan, syncStatus, version: version ?? plan.version }
    : plan), storage);
}
