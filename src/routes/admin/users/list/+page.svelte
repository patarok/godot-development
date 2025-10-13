<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const { user } = data;

</script>

{#if !user.isAdmin}
  <p>Permission denied. Please <a href="/admin">login as admin</a>.</p>
{:else}
  <h2>All Users</h2>
  <table>
    <thead>
      <tr><th>Username</th><th>Email</th><th>Name</th><th>Role</th><th>Active</th><th></th></tr>
    </thead>
    <tbody>
      {#each data.users as u}
        <tr>
          <td>{u.username}</td>
          <td>{u.email}</td>
          <td>{u.forename ?? ''} {u.surname ?? ''}</td>
          <td>{u.role}</td>
          <td>{String(u.isActive ?? true)}</td>
          <td>
            <a href={`/admin/users/manipulation?id=${encodeURIComponent(u.id)}`} aria-label="edit">✏️</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
