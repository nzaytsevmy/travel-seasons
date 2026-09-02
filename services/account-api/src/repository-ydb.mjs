import { Driver } from '@ydbjs/core';
import { query } from '@ydbjs/query';
import { MetadataCredentialsProvider } from '@ydbjs/auth/metadata';
import { planFingerprint } from './plans.mjs';

const asNumber = (value) => typeof value === 'bigint' ? Number(value) : Number(value || 0);
const parse = (value, fallback = null) => {
  try { return JSON.parse(String(value)); } catch { return fallback; }
};

export class YdbRepository {
  constructor(driver, sql) {
    this.driver = driver;
    this.sql = sql;
  }

  static async connect(connectionString) {
    const driver = new Driver(connectionString, {
      credentialsProvider: new MetadataCredentialsProvider(),
      'ydb.sdk.application': 'traveltribe-account-api',
      'ydb.sdk.ready_timeout_ms': 10_000,
    });
    await driver.ready(AbortSignal.timeout(10_000));
    return new YdbRepository(driver, query(driver, { poolOptions: { maxSize: 10 } }));
  }

  async close() { this.driver.close(); }
  async health() { await this.sql`SELECT 1 AS ok`.timeout(1_000); return true; }

  async ensureSchema() {
    await this.sql`CREATE TABLE IF NOT EXISTS accounts (
      subject_hash Utf8 NOT NULL,
      consent_version Utf8 NOT NULL,
      created_at Uint64 NOT NULL,
      PRIMARY KEY (subject_hash)
    )`;
    await this.sql`CREATE TABLE IF NOT EXISTS sessions (
      session_id Utf8 NOT NULL,
      subject_hash Utf8 NOT NULL,
      created_at Uint64 NOT NULL,
      last_seen_at Uint64 NOT NULL,
      idle_expires_at Uint64 NOT NULL,
      absolute_expires_at Uint64 NOT NULL,
      PRIMARY KEY (session_id)
    )`;
    await this.sql`CREATE TABLE IF NOT EXISTS plans (
      subject_hash Utf8 NOT NULL,
      plan_id Utf8 NOT NULL,
      version Uint64 NOT NULL,
      updated_at Uint64 NOT NULL,
      payload Utf8 NOT NULL,
      PRIMARY KEY (subject_hash, plan_id)
    )`;
    await this.sql`CREATE TABLE IF NOT EXISTS idempotency (
      subject_hash Utf8 NOT NULL,
      request_key Utf8 NOT NULL,
      expires_at Uint64 NOT NULL,
      response Utf8 NOT NULL,
      PRIMARY KEY (subject_hash, request_key)
    )`;
  }

  async createAccount(subjectHash, consentVersion, createdAt) {
    const [rows] = await this.sql`SELECT subject_hash, consent_version, created_at FROM accounts WHERE subject_hash = ${subjectHash}`;
    if (!rows.length) {
      await this.sql`UPSERT INTO accounts (subject_hash, consent_version, created_at)
        VALUES (${subjectHash}, ${consentVersion}, ${BigInt(createdAt)})`;
      return { subjectHash, consentVersion, createdAt };
    }
    return { subjectHash, consentVersion: rows[0].consent_version, createdAt: asNumber(rows[0].created_at) };
  }

  async createSession(session) {
    await this.sql`UPSERT INTO sessions
      (session_id, subject_hash, created_at, last_seen_at, idle_expires_at, absolute_expires_at)
      VALUES (${session.id}, ${session.subjectHash}, ${BigInt(session.createdAt)}, ${BigInt(session.lastSeenAt)},
        ${BigInt(session.idleExpiresAt)}, ${BigInt(session.absoluteExpiresAt)})`;
  }

  async getSession(id) {
    const [rows] = await this.sql`SELECT * FROM sessions WHERE session_id = ${id}`;
    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.session_id,
      subjectHash: row.subject_hash,
      createdAt: asNumber(row.created_at),
      lastSeenAt: asNumber(row.last_seen_at),
      idleExpiresAt: asNumber(row.idle_expires_at),
      absoluteExpiresAt: asNumber(row.absolute_expires_at),
    };
  }

  async touchSession(id, lastSeenAt, idleExpiresAt) {
    const session = await this.getSession(id);
    if (!session) return;
    await this.createSession({ ...session, lastSeenAt, idleExpiresAt });
  }

  async deleteSession(id) { await this.sql`DELETE FROM sessions WHERE session_id = ${id}`; }

  async listPlans(subjectHash) {
    const [rows] = await this.sql`SELECT plan_id, version, updated_at, payload FROM plans
      WHERE subject_hash = ${subjectHash} ORDER BY updated_at DESC`;
    return rows.map((row) => ({
      ...parse(row.payload, {}),
      id: row.plan_id,
      version: asNumber(row.version),
      updatedAt: asNumber(row.updated_at),
    }));
  }

  async savePlans(subjectHash, incoming, now, maxPlans) {
    return this.sql.begin({ isolation: 'serializableReadWrite', idempotent: true }, async (tx) => {
      const [rows] = await tx`SELECT plan_id, version, updated_at, payload FROM plans WHERE subject_hash = ${subjectHash}`;
      const current = new Map(rows.map((row) => [row.plan_id, {
        ...parse(row.payload, {}), id: row.plan_id, version: asNumber(row.version), updatedAt: asNumber(row.updated_at),
      }]));
      const conflicts = [];
      for (const plan of incoming) {
        const cloud = current.get(plan.id);
        if (cloud && Number(plan.version) !== Number(cloud.version) && planFingerprint(plan) !== planFingerprint(cloud)) {
          conflicts.push({ planId: plan.id, localVersion: plan.version, cloudVersion: cloud.version });
        }
      }
      if (conflicts.length) return { conflicts, plans: [...current.values()] };
      if (new Set([...current.keys(), ...incoming.map((plan) => plan.id)]).size > maxPlans) {
        const error = new Error('plan_limit'); error.code = 'plan_limit'; throw error;
      }
      for (const plan of incoming) {
        const version = Number(current.get(plan.id)?.version || 0) + 1;
        const saved = { ...plan, version, updatedAt: now };
        await tx`UPSERT INTO plans (subject_hash, plan_id, version, updated_at, payload)
          VALUES (${subjectHash}, ${plan.id}, ${BigInt(version)}, ${BigInt(now)}, ${JSON.stringify(saved)})`;
        current.set(plan.id, saved);
      }
      return { conflicts: [], plans: [...current.values()].sort((a, b) => b.updatedAt - a.updatedAt) };
    });
  }

  async deletePlan(subjectHash, planId, expectedVersion) {
    return this.sql.begin({ isolation: 'serializableReadWrite', idempotent: true }, async (tx) => {
      const [rows] = await tx`SELECT version, payload FROM plans WHERE subject_hash = ${subjectHash} AND plan_id = ${planId}`;
      if (!rows.length) return { deleted: false };
      const version = asNumber(rows[0].version);
      if (expectedVersion != null && Number(expectedVersion) !== version) {
        return { conflict: true, cloud: { ...parse(rows[0].payload, {}), version } };
      }
      await tx`DELETE FROM plans WHERE subject_hash = ${subjectHash} AND plan_id = ${planId}`;
      return { deleted: true };
    });
  }

  async getIdempotent(subjectHash, key, now) {
    const [rows] = await this.sql`SELECT expires_at, response FROM idempotency
      WHERE subject_hash = ${subjectHash} AND request_key = ${key}`;
    if (!rows.length || asNumber(rows[0].expires_at) <= now) return null;
    return parse(rows[0].response, null);
  }

  async putIdempotent(subjectHash, key, response, expiresAt) {
    await this.sql`UPSERT INTO idempotency (subject_hash, request_key, expires_at, response)
      VALUES (${subjectHash}, ${key}, ${BigInt(expiresAt)}, ${JSON.stringify(response)})`;
  }

  async exportAccount(subjectHash) {
    const [rows] = await this.sql`SELECT consent_version, created_at FROM accounts WHERE subject_hash = ${subjectHash}`;
    return {
      createdAt: rows.length ? asNumber(rows[0].created_at) : null,
      consentVersion: rows[0]?.consent_version || null,
      plans: await this.listPlans(subjectHash),
    };
  }

  async deleteAccount(subjectHash) {
    await this.sql.begin({ isolation: 'serializableReadWrite', idempotent: true }, async (tx) => {
      await tx`DELETE FROM plans WHERE subject_hash = ${subjectHash}`;
      await tx`DELETE FROM sessions WHERE subject_hash = ${subjectHash}`;
      await tx`DELETE FROM idempotency WHERE subject_hash = ${subjectHash}`;
      await tx`DELETE FROM accounts WHERE subject_hash = ${subjectHash}`;
    });
  }
}
