<script lang="ts">
  import { enhance } from "$app/forms";
  export let data: { plainSettings: { key: string; value: string }[] };
  let message: string | null = null;
  function handleEnhance({ result }: any) {
    if (result?.type === 'success') {
      // result.data.message from action
      message = result?.data?.message ?? 'Saved';
    } else if (result?.type === 'failure') {
      message = result?.data?.message ?? 'Error';
    }
  }
</script>

<section style="margin-bottom: 24px;">
  <hr>
  <h2 style="font-weight: 700;">Task States</h2>
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
    {#each data.taskStates as s (s.id)}
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
  <h2 style="font-weight: 700;">Project States</h2>
  <hr>
  <form method="POST" action="?/create_project_state" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row; align-items:center; margin: 8px 0;">
    <input name="name" placeholder="Name (e.g., Active)" required />
    <input name="rank" placeholder="Rank (0)" type="number" />
    <input name="color" placeholder="#color (optional)" />
    <input name="description" placeholder="Description (optional)" />
    <button class="btn" type="submit">Add</button>
  </form>
  <ul style="list-style:none; padding:0;">
    {#each data.projectStates as s (s.id)}
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
