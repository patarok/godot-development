<script lang="ts">
  export let data: any;
</script>

{#if data.notAdmin}
  <p>Permission denied. Please <a href="/admin">login as admin</a>.</p>
{:else if data.notFound}
  <p>User not found.</p>
{:else}
  <h2>Edit User</h2>
  <form method="post">
    <input type="hidden" name="id" value={data.user.id} />
    <div>
      <label>Email</label>
      <input name="email" type="email" value={data.user.email} required />
    </div>
    <div>
      <label>Forename</label>
      <input name="forename" value={data.user.forename ?? ''} />
    </div>
    <div>
      <label>Surname</label>
      <input name="surname" value={data.user.surname ?? ''} />
    </div>
    <div>
      <label>Username</label>
      <input name="username" value={data.user.username} required />
    </div>
    <div>
      <label>Role</label>
      <select name="role" required>
        <option value="Admin" selected={data.user.roles?.includes('Admin')}>Admin</option>
        <option value="Consumer" selected={data.user.roles?.includes('Consumer')}>Consumer</option>
        <option value="Contributor" selected={data.user.roles?.includes('Contributor')}>Contributor</option>
      </select>
      <small>Pick one main role. Admin overrides main roles.</small>
    </div>
    <div>
      <label>Active</label>
      <input name="isActive" type="checkbox" checked={data.user.isActive ?? true} />
    </div>
    <button type="submit">Save</button>
  </form>
{/if}
