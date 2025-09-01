<script lang="ts">
  export let data: { notAdmin?: boolean; users: any[]; mails: any[] };
</script>

{#if data?.notAdmin}
  <p>Permission denied. Please <a href="/admin">login as admin</a>.</p>
{:else}
  <h2>Incoming Mail (system mailbox)</h2>
  <ul>
    {#each data.mails as m}
      <li><strong>{m.subject}</strong> — from {m.from} to {m.to} <small>{m.date}</small></li>
    {/each}
  </ul>

  <h3>Compose to a user</h3>
  <div style="display:flex; gap: 8px; flex-wrap: wrap;">
    {#each data.users as u}
      <a class="btn" href={`/admin/mail/create?to=${encodeURIComponent(u.email)}`}>{u.email}</a>
    {/each}
  </div>
{/if}
