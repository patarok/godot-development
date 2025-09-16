<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { tick } from 'svelte';
  import ProjectMetaCard from '$lib/components/molecules/projects/ProjectMetaCard.svelte';
  import ProjectCreateForm from '$lib/components/molecules/projects/ProjectCreateForm.svelte';

  let { data }: { data: PageData } = $props();
  const { priorities, states, riskLevels, users } = data as any;

  const projects = $derived($page.data.projects);

  let form = $state();

  // Reusable enhance function
  const enhanceWithForm = () => {
    return async ({ result, update }) => {
      form = result?.data;
      await update();

      if (result?.data?.success) {
        await tick();
        invalidateAll();
        await tick();
      }
    };
  };
</script>

<svelte:head>
  <title>Projects</title>
</svelte:head>

<hr />
<h1>Create Project</h1>
<hr class="mb-4" />

<ProjectCreateForm
        class="mb-8"
        action="?/create"
        enhanceForm={true}
        enhanceCallback={enhanceWithForm}
        {states}
        {priorities}
        {riskLevels}
        {users}
/>

<hr class="mt-8" />
<h2>Existing Projects</h2>
<hr />

<ul>
  {#each projects as p}
    <li class="mb-4">
      <ProjectMetaCard
              class="mt-4"
              action={`?/updateMeta/${p.id}`}
              enhanceForm={true}
              enhanceCallback={enhanceWithForm}
              project={{
          id: p.id,
          title: p.title,
          description: p.description,
          startDate: p.startDate,
          endDate: p.endDate,
          actualStartDate: p.actualStartDate,
          actualEndDate: p.actualEndDate
        }}
      />
    </li>
  {/each}
</ul>
