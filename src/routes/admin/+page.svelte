<script lang="ts">
  import SectionCards from "$lib/components/section-cards.svelte";
  import ChartAreaInteractive from "$lib/components/chart-area-interactive.svelte";
  import DataTable from "$lib/components/data-table.svelte";
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const { user } = data;
</script>

<div class="p-8">
{#if !user.isAdmin}
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
  <div class="flex flex-1 flex-col">
    <div class="@container/main flex flex-1 flex-col gap-2">
      <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div class="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
<!--        <DataTable {data} />-->
      </div>
    </div>
  </div>
{/if}
</div>