import { listPlans, MAX_PLANS, setPlanSync, writePlans, type TripPlan } from './trip-plans';
import { trackProductEvent } from './product-analytics';

export type Bootstrap = {
  authenticated: boolean;
  csrfToken?: string;
  plans?: TripPlan[];
  limits?: { plans: number; bodyBytes: number };
};

export type SyncConflict = {
  conflicts: Array<{ planId: string; localVersion: number; cloudVersion: number }>;
  cloudPlans: TripPlan[];
};

async function api<T>(origin: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${origin}${path}`, { ...init, credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`) as Error & { status?: number; data?: any };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as T;
}

export const getBootstrap = (origin: string) => api<Bootstrap>(origin, '/v1/bootstrap');

export async function syncPlans(origin: string, csrfToken: string) {
  const local = listPlans();
  if (local.length > MAX_PLANS) {
    return { ok: false as const, conflict: false as const, reason: 'limit' as const };
  }
  try {
    const result = await api<{ plans: TripPlan[] }>(origin, '/v1/plans/import', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify({ plans: local }),
    });
    const plans = writePlans((result.plans || []).map((plan) => ({ ...plan, syncStatus: 'synced' })));
    trackProductEvent('sync_success', { status: 'synced', stop_count: plans.length });
    return { ok: true as const, plans };
  } catch (error: any) {
    if (error?.status === 409) {
      for (const plan of local) setPlanSync(plan.id, 'conflict');
      trackProductEvent('sync_conflict', { status: 'conflict', stop_count: local.length });
      return {
        ok: false as const,
        conflict: true as const,
        error,
        conflicts: Array.isArray(error.data?.conflicts) ? error.data.conflicts : [],
        cloudPlans: Array.isArray(error.data?.plans) ? error.data.plans : [],
      };
    }
    for (const plan of local) setPlanSync(plan.id, 'offline');
    return { ok: false as const, conflict: false as const, error };
  }
}

export function useCloudPlans(conflict: SyncConflict) {
  const conflictIds = new Set(conflict.conflicts.map((item) => item.planId));
  const resolved = new Map(conflict.cloudPlans.map((plan) => [plan.id, { ...plan, syncStatus: 'synced' as const }]));
  // «Использовать облачную» относится только к конфликтующим планам. Новый
  // локальный план, которого в облаке ещё нет, нельзя незаметно удалить.
  for (const plan of listPlans()) {
    if (!conflictIds.has(plan.id) && !resolved.has(plan.id)) resolved.set(plan.id, plan);
  }
  const plans = [...resolved.values()];
  if (plans.length > MAX_PLANS) return { ok: false as const, reason: 'limit' as const, plans: listPlans() };
  return { ok: true as const, plans: writePlans(plans) };
}

export async function keepLocalCopies(origin: string, csrfToken: string, conflict: SyncConflict) {
  const local = listPlans();
  const conflictIds = new Set(conflict.conflicts.map((item) => item.planId));
  const cloudById = new Map(conflict.cloudPlans.map((plan) => [plan.id, plan]));
  const resolved = new Map(conflict.cloudPlans.map((plan) => [plan.id, { ...plan, syncStatus: 'synced' as const }]));

  for (const plan of local) {
    if (conflictIds.has(plan.id)) {
      const copy = {
        ...plan,
        id: crypto.randomUUID(),
        title: `${plan.title} (локальная копия)`.slice(0, 160),
        savedAt: Date.now(),
        updatedAt: Date.now(),
        version: 0,
        syncStatus: 'local' as const,
      };
      resolved.set(copy.id, copy);
    } else {
      const cloud = cloudById.get(plan.id);
      resolved.set(plan.id, { ...plan, version: cloud?.version ?? plan.version, syncStatus: 'local' as const });
    }
  }

  const candidates = [...resolved.values()];
  if (candidates.length > MAX_PLANS) {
    return { ok: false as const, reason: 'limit' as const, plans: local };
  }
  try {
    const result = await api<{ plans: TripPlan[] }>(origin, '/v1/plans/import', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify({ plans: candidates }),
    });
    const plans = writePlans((result.plans || []).map((plan) => ({ ...plan, syncStatus: 'synced' })));
    trackProductEvent('sync_success', { status: 'copy_resolved', stop_count: plans.length });
    return { ok: true as const, plans };
  } catch (error) {
    return { ok: false as const, reason: 'request' as const, error, plans: local };
  }
}

export async function downloadAccountExport(origin: string) {
  const payload = await api<Record<string, unknown>>(origin, '/v1/account/export');
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `traveltribe-plans-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(href);
}

export async function deleteAccount(origin: string, csrfToken: string) {
  return api<{ deleted: boolean }>(origin, '/v1/account', {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrfToken, 'idempotency-key': crypto.randomUUID() },
  });
}

export async function logout(origin: string, csrfToken: string) {
  return api<{ loggedOut: boolean }>(origin, '/v1/logout', {
    method: 'POST',
    headers: { 'x-csrf-token': csrfToken, 'idempotency-key': crypto.randomUUID() },
  });
}
