<script lang="ts">
  export let data: { isAdmin: boolean; user: any };
</script>

{#if !data.isAdmin}
  <h1>Admin Login</h1>
  <form method="post">
    <input type="hidden" name="/adminLogin" />
    <div>
      <label>Username</label>
      <input name="username" required />
    </div>
    <div>
      <label>Password</label>
      <input name="password" type="password" required />
    </div>
    <button type="submit" formaction="?/adminLogin">Login as Admin</button>
  </form>
{:else}
  <h1>Admin Dashboard</h1>
  <nav style="display:flex; gap: 12px; flex-wrap: wrap;">
    <a class="btn" href="/admin/system">system</a>
    <a class="btn" href="/admin/users/list">userMgmt</a>
    <a class="btn" href="/admin/mail">mail</a>
    <a class="btn" href="/admin/documents">documents</a>
    <a class="btn" href="/admin/projects">projects</a>
    <a class="btn" href="/admin/log">log</a>
  </nav>
{/if}
