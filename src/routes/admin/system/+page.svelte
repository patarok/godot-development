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

<h2>System Settings</h2>

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

<h3>Add or update a setting</h3>
<form method="POST" action="?/update" use:enhance={handleEnhance} style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
  <label>Key <input name="key" placeholder="some.setting.key" required /></label>
  <label>Value <input name="value" placeholder="value" /></label>
  <button class="btn" type="submit">Save</button>
</form>
