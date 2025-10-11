<script lang="ts">
  import { enhance } from "$app/forms";
  export let data: {
    plainSettings: { key: string; value: string }[];
    subRoles: {
                id: string;
                title: string;
                companyJobTitle: string;
                companyJobRole: string;
                color?: string | null;
                description?: string | null }[];
    subRolePermissions: {
      id: string;
      name: string;
      category: string;
      value: string;
      description?: string | null;
    }[];
    subRolePermissionAssignments: {
      id: string;
      subRoleCfgId: string;
      subRolePermissionId: string;
      createdAt: string; // or Date if you’re not toPlain-ing dates
    }[];
  };

  // Optional helper: Map subrole -> Set(permissionId)
  const permsBySubRole = new Map<string, Set<string>>();
  for (const a of data.subRolePermissionAssignments) {
    let set = permsBySubRole.get(a.subRoleCfgId);
    if (!set) {
      set = new Set<string>();
      permsBySubRole.set(a.subRoleCfgId, set);
    }
    set.add(a.subRolePermissionId);
  }

  let message: string | null = null;
  function handleEnhance({ result }: any) {
    if (result?.type === 'success') {
      message = result?.data?.message ?? 'Saved';
    } else if (result?.type === 'failure') {
      message = result?.data?.message ?? 'Error';
    }
  }
</script>

<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">Task Statuses</h2>
  <hr>
  <form method="POST" action="?/create_task_state" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center; margin: 8px 0;">
    <input name="name" placeholder="Name (e.g., Todo)" required />
    <input name="rank" placeholder="Rank (0)" type="number" />
    <input name="color" placeholder="#color (optional)" />
    <input name="description" placeholder="Description (optional)" />
    <button class="btn" type="submit">Add</button>
  </form>
  <hr style="color: lightgrey; margin-bottom: 1rem;">
  <ul style="list-style:none; padding:0;">
    {#each data.taskStatuses as s (s.id)}
      <li style="margin-bottom: 8px; display: flex;">
        <form method="POST" action="?/update_task_state" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center;">
          <input type="hidden" name="id" value={s.id} />
          <input name="name" value={s.name} />
          <input name="rank" value={s.rank} type="number" />
          <input name="color" value={s.color ?? ''} />
          <input name="description" value={s.description ?? ''} />
          <button class="btn" type="submit">Save</button>
        </form>
        <form method="POST" action="?/delete_task_state" use:enhance={handleEnhance} style="display:inline-block; margin-left: 8px;">
          <input type="hidden" name="id" value={s.id} />
          <button class="btn" type="submit">Delete</button>
        </form>
      </li>
    {/each}
  </ul>
</section>

<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">Project Statuses</h2>
  <hr>
  <form method="POST" action="?/create_project_state" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center; margin: 8px 0;">
    <input name="name" placeholder="Name (e.g., Active)" required />
    <input name="rank" placeholder="Rank (0)" type="number" />
    <input name="color" placeholder="#color (optional)" />
    <input name="description" placeholder="Description (optional)" />
    <button class="btn" type="submit">Add</button>
  </form>
  <ul style="list-style:none; padding:0;">
    {#each data.projectStatuses as s (s.id)}
      <li style="margin-bottom: 8px; display: flex;">
        <form method="POST" action="?/update_project_state" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center;">
          <input type="hidden" name="id" value={s.id} />
          <input name="name" value={s.name} />
          <input name="rank" value={s.rank} type="number" />
          <input name="color" value={s.color ?? ''} />
          <input name="description" value={s.description ?? ''} />
          <button class="btn" type="submit">Save</button>
        </form>
        <form method="POST" action="?/delete_project_state" use:enhance={handleEnhance} style="display:inline-block; margin-left: 8px;">
          <input type="hidden" name="id" value={s.id} />
          <button class="btn" type="submit">Delete</button>
        </form>
      </li>
    {/each}
  </ul>
</section>

<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">Risk Levels</h2>
  <hr>
  <form method="POST" action="?/create_risk_level" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center; margin: 8px 0;">
    <input name="name" placeholder="Name (e.g., Low)" required />
    <input name="rank" placeholder="Rank (0)" type="number" />
    <input name="color" placeholder="#color (optional)" />
    <input name="description" placeholder="Description (optional)" />
    <button class="btn" type="submit">Add</button>
  </form>
  <ul style="list-style:none; padding:0;">
    {#each data.riskLevels as r (r.id)}
      <li style="margin-bottom: 8px; display: flex;">
        <form method="POST" action="?/update_risk_level" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center;">
          <input type="hidden" name="id" value={r.id} />
          <input name="name" value={r.name} />
          <input name="rank" value={r.rank} type="number" />
          <input name="color" value={r.color ?? ''} />
          <input name="description" value={r.description ?? ''} />
          <label><input type="checkbox" name="isActive" checked={r.isActive} /> Active</label>
          <button class="btn" type="submit">Save</button>
        </form>
        <form method="POST" action="?/delete_risk_level" use:enhance={handleEnhance} style="display:inline-block; margin-left: 8px;">
          <input type="hidden" name="id" value={r.id} />
          <button class="btn" type="submit">Delete</button>
        </form>
      </li>
    {/each}
  </ul>
</section>

<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">Priorities</h2>
  <hr>
  <form method="POST" action="?/create_priority" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center; margin: 8px 0;">
    <input name="name" placeholder="Name (e.g., Low)" required />
    <input name="rank" placeholder="Rank (0)" type="number" />
    <input name="color" placeholder="#color (optional)" />
    <input name="description" placeholder="Description (optional)" />
    <button class="btn" type="submit">Add</button>
  </form>
  <ul style="list-style:none; padding:0;">
    {#each data.priorities as p (p.id)}
      <li style="margin-bottom: 8px; display: flex;">
        <form method="POST" action="?/update_priority" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center;">
          <input type="hidden" name="id" value={p.id} />
          <input name="name" value={p.name} />
          <input name="rank" value={p.rank} type="number" />
          <input name="color" value={p.color ?? ''} />
          <input name="description" value={p.description ?? ''} />
          <button class="btn" type="submit">Save</button>
        </form>
        <form method="POST" action="?/delete_priority" use:enhance={handleEnhance} style="display:inline-block; margin-left: 8px;">
          <input type="hidden" name="id" value={p.id} />
          <button class="btn" type="submit">Delete</button>
        </form>
      </li>
    {/each}
  </ul>
</section>
<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">SubRoles</h2>
  <hr>
  <form method="POST" action="?/create_subrole" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center; margin: 8px 0;">
    <input name="title" placeholder="Title (e.g., Contributor)" required />
    <input name="companyJobTitle" placeholder="Company Job Title (e.g., Engineer)" required />
    <input name="companyJobRole" placeholder="Company Job Role (e.g., Backend Developer)" required />
    <input name="color" placeholder="#color (optional)" />
    <input name="description" placeholder="Description (optional)" />
    <button class="btn" type="submit">Add</button>
  </form>
  <ul style="list-style:none; padding:0;">
    {#each data.subRoles as s (s.id)}
      <li style="margin-bottom: 8px; display: flex;">
        <form method="POST" action="?/update_subrole" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center;">
          <input type="hidden" name="id" value={s.id} />
          <input name="title" value={s.title} required />
          <input name="companyJobTitle" value={s.companyJobTitle} required />
          <input name="companyJobRole" value={s.companyJobRole} required />
          <input name="color" value={s.color ?? ''} />
          <input name="description" value={s.description ?? ''} />
          <button class="btn" type="submit">Save</button>
        </form>
        <form method="POST" action="?/delete_subrole" use:enhance={handleEnhance} style="display:inline-block; margin-left: 8px;">
          <input type="hidden" name="id" value={s.id} />
          <button class="btn" type="submit">Delete</button>
        </form>
      </li>
    {/each}
  </ul>
</section>
<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">SubRole Permissions</h2>
  <hr>

  <!-- Create -->
  <form method="POST" action="?/create_subrole_permission" use:enhance={handleEnhance}
        style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center; margin: 8px 0;">
    <input name="name" placeholder="Name (unique, e.g., status.change)" required />
    <input name="category" placeholder="Category (e.g., status)" required />
    <input name="value" placeholder="Value (e.g., change)" required />
    <input name="description" placeholder="Description (optional)" />
    <button class="btn" type="submit">Add</button>
  </form>

  <!-- List/Update/Delete -->
  <ul style="list-style:none; padding:0;">
    {#each data.subRolePermissions as p (p.id)}
      <li style="margin-bottom: 8px; display:flex;">
        <form method="POST" action="?/update_subrole_permission" use:enhance={handleEnhance}
              style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center;">
          <input type="hidden" name="id" value={p.id} />
          <input name="name" value={p.name} required />
          <input name="category" value={p.category} required />
          <input name="value" value={p.value} required />
          <input name="description" value={p.description ?? ''} />
          <button class="btn" type="submit">Save</button>
        </form>

        <form method="POST" action="?/delete_subrole_permission" use:enhance={handleEnhance}
              style="display:inline-block; margin-left: 8px;">
          <input type="hidden" name="id" value={p.id} />
          <button class="btn" type="submit">Delete</button>
        </form>
      </li>
    {/each}
  </ul>
</section>
<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">Assign Permissions to SubRoles</h2>
  <hr>

  <ul style="list-style:none; padding:0;">
    {#each data.subRoles as s (s.id)}
      <li style="margin-bottom: 16px;">
        <div style="font-weight:600; margin-bottom: 6px;">
          {s.title} &mdash; {s.companyJobTitle} ({s.companyJobRole})
        </div>

        <form method="POST" action="?/set_subrole_permissions" use:enhance={handleEnhance}
              style="display:flex; flex-direction: column; gap:8px;">
          <input type="hidden" name="subRoleCfgId" value={s.id} />

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:8px;">
            {#each data.subRolePermissions as p (p.id)}
              <label style="display:flex; gap:6px; align-items:center;">
                <input
                        type="checkbox"
                        name="permissionIds"
                        value={p.id}
                        checked={permsBySubRole.get(s.id)?.has(p.id) ?? false}
                />
                <span>
                  <strong>{p.category}</strong>: {p.name}
                  <small style="opacity:0.7;">[{p.value}]</small>
                  {#if p.description}<small style="opacity:0.7;"> - {p.description}</small>{/if}
                </span>
              </label>
            {/each}
          </div>

          <div>
            <button class="btn" type="submit">Save Permissions</button>
          </div>
        </form>
      </li>
    {/each}
  </ul>
</section>

<hr>
<h2 style="font-weight: 700;">System Settings</h2>
<hr>

{#if message}
  <p role="status">{message}</p>
{/if}

{#if data?.plainSettings?.length}
  <ul style="list-style:none; padding:0;">
    {#each data.plainSettings as s (s.key)}
      <li style="margin-bottom: 12px;">
        <form method="POST" action="?/update" use:enhance={handleEnhance} style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; flex-direction: row;">
          <input type="hidden" name="key" value={s.key} />
          <label style="min-width: 220px; font-weight: 600;">{s.key}</label>
          <input name="value" value={s.value ?? ''} style="flex:1 1 280px;" />
          <button class="btn" type="submit">Save</button>
        </form>
      </li>
    {/each}
  </ul>
{:else}
  <p>No settings yet.</p>
{/if}
<hr style="color: lightgrey; margin-bottom: 1rem;">
<h3>Add or update a setting</h3>
<form method="POST" action="?/update" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
  <label>Key <input name="key" placeholder="some.setting.key" required /></label>
  <label>Value <input name="value" placeholder="value" /></label>
  <button class="btn" type="submit">Save</button>
</form>
