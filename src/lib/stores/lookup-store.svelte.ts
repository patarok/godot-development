/**
 * Client-side lookup store.
 *
 * The layout loader (+layout.server.ts) delivers projects/priorities/states/users/
 * types/metaTasks on every navigation. These are read-mostly and rarely change.
 * This runes store holds them as a stable client reference so that:
 *   - SPA navigations can reuse the already-loaded lookups instead of re-deriving them
 *   - components can read a stable reference instead of prop-drilling through many layers
 *
 * It is seeded from the layout data and kept in sync when a fresh load delivers new
 * values. It does NOT depend on the server-side cache (feature/server-cache) — both
 * are independent optimizations that compose in the merge branch.
 */

type LookupSlice = any[];
export type Lookups = {
    projects: LookupSlice;
    priorities: LookupSlice;
    states: LookupSlice;
    users: LookupSlice;
    types: LookupSlice;
    metaTasks: LookupSlice;
};

class LookupStore {
    projects = $state<LookupSlice>([]);
    priorities = $state<LookupSlice>([]);
    states = $state<LookupSlice>([]);
    users = $state<LookupSlice>([]);
    types = $state<LookupSlice>([]);
    metaTasks = $state<LookupSlice>([]);

    /**
     * Seed (or refresh) the store from layout data. Called once the layout data
     * is available. New values replace the current ones — this is a cache, not a
     * source of truth; the server remains authoritative via `data`.
     */
    hydrate(data: Partial<Lookups>) {
        if (data.projects) this.projects = data.projects;
        if (data.priorities) this.priorities = data.priorities;
        if (data.states) this.states = data.states;
        if (data.users) this.users = data.users;
        if (data.types) this.types = data.types;
        if (data.metaTasks) this.metaTasks = data.metaTasks;
    }
}

export const lookupStore = new LookupStore();
