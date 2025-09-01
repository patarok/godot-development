<script lang="ts">
  export let data: { notAdmin?: boolean; to: string };
</script>

{#if data?.notAdmin}
  <p>Permission denied. Please <a href="/admin">login as admin</a>.</p>
{:else}
  <h2>Compose Email</h2>
  <form method="post">
    <div>
      <label>To</label>
      <input name="to" type="email" value={data.to} required />
    </div>
    <div>
      <label>CC</label>
      <input name="cc" type="email" />
    </div>
    <div>
      <label>Subject</label>
      <input name="subject" />
    </div>
    <div>
      <label>Content</label>
      <textarea name="content" rows="8"></textarea>
    </div>
    <button type="submit">Send</button>
  </form>
{/if}
