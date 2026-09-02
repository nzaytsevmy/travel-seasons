import { planFingerprint } from './plans.mjs';

export class MemoryRepository {
  accounts = new Map();
  sessions = new Map();
  plans = new Map();
  idempotency = new Map();

  async health() { return true; }
  async close() {}
  async createAccount(subjectHash, consentVersion, createdAt) {
    if (!this.accounts.has(subjectHash)) this.accounts.set(subjectHash, { subjectHash, consentVersion, createdAt });
    return this.accounts.get(subjectHash);
  }
  async createSession(session) { this.sessions.set(session.id, { ...session }); }
  async getSession(id) { return this.sessions.get(id) || null; }
  async touchSession(id, lastSeenAt, idleExpiresAt) {
    const session = this.sessions.get(id);
    if (session) Object.assign(session, { lastSeenAt, idleExpiresAt });
  }
  async deleteSession(id) { this.sessions.delete(id); }
  async listPlans(subjectHash) {
    return [...(this.plans.get(subjectHash)?.values() || [])]
      .sort((a, b) => b.updatedAt - a.updatedAt).map((plan) => structuredClone(plan));
  }
  async savePlans(subjectHash, incoming, now, maxPlans) {
    const current = new Map(this.plans.get(subjectHash) || []);
    const conflicts = [];
    for (const plan of incoming) {
      const cloud = current.get(plan.id);
      if (cloud && Number(plan.version) !== Number(cloud.version) && planFingerprint(plan) !== planFingerprint(cloud)) {
        conflicts.push({ planId: plan.id, localVersion: plan.version, cloudVersion: cloud.version });
      }
    }
    if (conflicts.length) return { conflicts, plans: await this.listPlans(subjectHash) };
    if (new Set([...current.keys(), ...incoming.map((plan) => plan.id)]).size > maxPlans) {
      const error = new Error('plan_limit'); error.code = 'plan_limit'; throw error;
    }
    for (const plan of incoming) {
      const cloud = current.get(plan.id);
      current.set(plan.id, { ...structuredClone(plan), version: Number(cloud?.version || 0) + 1, updatedAt: now });
    }
    this.plans.set(subjectHash, current);
    return { conflicts: [], plans: await this.listPlans(subjectHash) };
  }
  async deletePlan(subjectHash, planId, expectedVersion) {
    const current = this.plans.get(subjectHash) || new Map();
    const cloud = current.get(planId);
    if (!cloud) return { deleted: false };
    if (expectedVersion != null && Number(expectedVersion) !== Number(cloud.version)) return { conflict: true, cloud };
    current.delete(planId);
    return { deleted: true };
  }
  async getIdempotent(subjectHash, key, now) {
    const value = this.idempotency.get(`${subjectHash}:${key}`);
    return value && value.expiresAt > now ? structuredClone(value.response) : null;
  }
  async putIdempotent(subjectHash, key, response, expiresAt) {
    this.idempotency.set(`${subjectHash}:${key}`, { response: structuredClone(response), expiresAt });
  }
  async exportAccount(subjectHash) {
    const account = this.accounts.get(subjectHash);
    return { createdAt: account?.createdAt || null, consentVersion: account?.consentVersion || null, plans: await this.listPlans(subjectHash) };
  }
  async deleteAccount(subjectHash) {
    this.accounts.delete(subjectHash);
    this.plans.delete(subjectHash);
    for (const [id, session] of this.sessions) if (session.subjectHash === subjectHash) this.sessions.delete(id);
    for (const key of this.idempotency.keys()) if (key.startsWith(`${subjectHash}:`)) this.idempotency.delete(key);
  }
}
