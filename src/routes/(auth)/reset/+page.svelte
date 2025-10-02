<script lang="ts">
  export let data: { token: string };
</script>

<form method="post">
  <input type="hidden" name="token" value={data.token} />
  <label for="password">New password</label>
  <input id="password" name="password" type="password" required />
  <button type="submit">Reset password</button>
</form>
