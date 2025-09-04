### When an explicit SystemSettingsRepository makes sense

Create a dedicated repository when you need domain-specific behavior beyond generic CRUD. For system settings, common motivations include:
- Typed getters with defaults (string/boolean/number/JSON) and consistent parsing
- Centralized validation against an allow-list (e.g., from schema/settings.keys)
- Namespaced/prefixed lookups for grouped settings
- Batch upserts in a single transaction
- Caching with invalidation to reduce DB hits
- Auditing of changes (who changed what and when)

Below is a concrete, TypeORM v0.3-compatible example showing these concerns and how it integrates with your current SvelteKit page.

### Entity (reference)
```ts
// $lib/server/database/entities/config/SystemSetting.ts
import { Entity, Column, PrimaryGeneratedColumn, Unique, Index } from 'typeorm';

@Entity('system_settings')
@Unique(['key'])
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
```

### Option A: Factory-based repository (recommended)
Keeps TS types clean and avoids coupling to DataSource initialization order.

```ts
// $lib/server/database/repositories/SystemSettingsRepository.ts
import type { DataSource, Repository } from 'typeorm';
import { SystemSetting } from '$lib/server/database/entities/config/SystemSetting';

export type AllowedKeys = Set<string> | null;

export interface ISystemSettingsRepository {
  listOrdered(): Promise<SystemSetting[]>;
  asRecord(prefix?: string): Promise<Record<string, string>>;

  getString(key: string, def?: string): Promise<string | undefined>;
  getBoolean(key: string, def?: boolean): Promise<boolean | undefined>;
  getNumber(key: string, def?: number): Promise<number | undefined>;

  set(key: string, value: string | null, actorId?: string): Promise<void>;
  upsertMany(entries: Array<{ key: string; value: string | null }>, actorId?: string): Promise<void>;
  delete(key: string, actorId?: string): Promise<void>;
  clearCache(): void;
}

function parseBoolean(raw: string | null | undefined): boolean | undefined {
  if (raw == null) return undefined;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return undefined;
}

export function createSystemSettingsRepository(
  dataSource: DataSource,
  options?: {
    allowedKeys?: AllowedKeys; // validate against schema/settings.keys if desired
    enableCache?: boolean;
  }
): ISystemSettingsRepository {
  const repo: Repository<SystemSetting> = dataSource.getRepository(SystemSetting);
  const allowed = options?.allowedKeys ?? null;
  const enableCache = options?.enableCache ?? true;
  const cache = new Map<string, string | null>();

  function ensureAllowed(key: string) {
    if (allowed && !allowed.has(key)) {
      const suggestion = Array.from(allowed).find((k) => k.startsWith(key.split('.')[0]));
      throw new Error(`Setting key “${key}” is not allowed${suggestion ? `. Did you mean ${suggestion}?` : ''}.`);
    }
  }

  async function getRaw(key: string): Promise<string | null | undefined> {
    if (enableCache && cache.has(key)) return cache.get(key) ?? undefined;
    const row = await repo.findOne({ where: { key } });
    if (enableCache) cache.set(key, row?.value ?? null);
    return row?.value ?? undefined;
  }

  return {
    async listOrdered() {
      const list = await repo.find({ order: { key: 'ASC' as any } });
      if (enableCache) {
        for (const s of list) cache.set(s.key, s.value);
      }
      return list;
    },

    async asRecord(prefix?: string) {
      const all = await this.listOrdered();
      const rec: Record<string, string> = {};
      for (const s of all) {
        if (s.value == null) continue;
        if (!prefix || s.key.startsWith(prefix)) rec[s.key] = s.value;
      }
      return rec;
    },

    async getString(key: string, def?: string) {
      const raw = await getRaw(key);
      return raw ?? def;
    },

    async getBoolean(key: string, def?: boolean) {
      const parsed = parseBoolean(await getRaw(key));
      return parsed ?? def;
    },

    async getNumber(key: string, def?: number) {
      const raw = await getRaw(key);
      if (raw == null) return def;
      const n = Number(raw);
      return Number.isFinite(n) ? n : def;
    },

    async set(key: string, value: string | null, actorId?: string) {
      ensureAllowed(key);
      await dataSource.transaction(async (em) => {
        const r = em.getRepository(SystemSetting);
        let row = await r.findOne({ where: { key } });
        if (!row) row = r.create({ key, value });
        else row.value = value;
        await r.save(row);

        // Optional: audit
        if (actorId) {
          await em.query(
            'insert into audit_log (entity, entity_id, action, actor_id, meta) values ($1,$2,$3,$4,$5)',
            ['SystemSetting', row.id, 'UPSERT', actorId, JSON.stringify({ key, value })]
          );
        }
      });
      if (enableCache) cache.set(key, value);
    },

    async upsertMany(entries, actorId?: string) {
      for (const e of entries) ensureAllowed(e.key);

      await dataSource.transaction(async (em) => {
        const r = em.getRepository(SystemSetting);
        for (const e of entries) {
          let row = await r.findOne({ where: { key: e.key } });
          if (!row) row = r.create({ key: e.key, value: e.value });
          else row.value = e.value;
          await r.save(row);
        }
        if (actorId) {
          await em.query(
            'insert into audit_log (entity, entity_id, action, actor_id, meta) values ($1,$2,$3,$4,$5)',
            ['SystemSetting', '*', 'BATCH_UPSERT', actorId, JSON.stringify(entries)]
          );
        }
      });

      if (enableCache) for (const e of entries) cache.set(e.key, e.value);
    },

    async delete(key: string, actorId?: string) {
      await dataSource.transaction(async (em) => {
        await em.getRepository(SystemSetting).delete({ key });
        if (actorId) {
          await em.query(
            'insert into audit_log (entity, entity_id, action, actor_id, meta) values ($1,$2,$3,$4,$5)',
            ['SystemSetting', '*', 'DELETE', actorId, JSON.stringify({ key })]
          );
        }
      });
      if (enableCache) cache.delete(key);
    },

    clearCache() {
      cache.clear();
    },
  };
}
```

#### Usage in your SvelteKit route
```ts
// src/routes/admin/system/+page.server.ts (snippet)
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { AppDataSource } from '$lib/server/database/config/datasource';
import { createSystemSettingsRepository } from '$lib/server/database/repositories/SystemSettingsRepository';
import { instanceToPlain } from 'class-transformer';

const allowedKeys = new Set([
  'ui.theme',
  'features.registration.enabled',
  'limits.maxUploadMb',
  // you can load these from schema/settings.keys at startup
]);

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const settingsRepo = createSystemSettingsRepository(AppDataSource, {
    allowedKeys,
    enableCache: true,
  });

  const settings = await settingsRepo.listOrdered();
  const plainSettings = settings.map((s) => instanceToPlain(s));
  return { plainSettings };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Unauthorized' });

    const fd = await request.formData();
    const key = String(fd.get('key') ?? '');
    const value = String(fd.get('value') ?? '');
    if (!key) return fail(400, { message: 'Missing key' });

    const settingsRepo = createSystemSettingsRepository(AppDataSource, { allowedKeys });
    try {
      await settingsRepo.set(key, value, locals.user.id);
      return { message: 'Saved' };
    } catch (e: any) {
      return fail(400, { message: e?.message ?? 'Failed to save' });
    }
  },
};
```

### Option B: Extend the TypeORM repository
Adds custom methods to a specific repository instance. Ensure DataSource is initialized first.

```ts
// $lib/server/database/repositories/SystemSettingsRepository.extend.ts
import { AppDataSource } from '$lib/server/database/config/datasource';
import { SystemSetting } from '$lib/server/database/entities/config/SystemSetting';

export const SystemSettingsRepository = AppDataSource
  .getRepository(SystemSetting)
  .extend({
    async getBoolean(this: any, key: string, def?: boolean) {
      const row = await this.findOne({ where: { key } });
      if (!row?.value) return def;
      const v = row.value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'on'].includes(v)) return true;
      if (['0', 'false', 'no', 'off'].includes(v)) return false;
      return def;
    },

    async upsertMany(this: any, entries: Array<{ key: string; value: string | null }>) {
      await this.manager.transaction(async (em: any) => {
        const r = em.getRepository(SystemSetting);
        for (const e of entries) {
          let row = await r.findOne({ where: { key: e.key } });
          if (!row) row = r.create({ key: e.key, value: e.value });
          else row.value = e.value;
          await r.save(row);
        }
      });
    },
  });
```

#### Usage
```ts
import { SystemSettingsRepository } from '$lib/server/database/repositories/SystemSettingsRepository.extend';

const darkMode = await SystemSettingsRepository.getBoolean('ui.theme.dark', false);
await SystemSettingsRepository.upsertMany([
  { key: 'limits.maxUploadMb', value: '64' },
  { key: 'features.registration.enabled', value: 'true' },
]);
```

### Tie into a settings schema file (optional)
If you maintain `schema/settings.keys`, load it once at startup and pass into the factory as `allowedKeys`, giving you a single source of truth.

```ts
// at startup (e.g., in hooks.server.ts) pseudo-code
import fs from 'node:fs';
const allowedKeys = new Set(
  fs.readFileSync('schema/settings.keys', 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
);

export const AllowedSettingKeys = allowedKeys;
// then use: createSystemSettingsRepository(AppDataSource, { allowedKeys: AllowedSettingKeys })
```

### Summary
An explicit SystemSettingsRepository becomes valuable when you want to:
- Provide typed accessors and defaults
- Enforce allowed keys and validation
- Perform atomic batch updates
- Add caching and auditing in one place
- Keep routes/controllers thin and consistent

These examples show exactly how to implement and integrate such a repository in your existing SvelteKit + TypeORM setup.