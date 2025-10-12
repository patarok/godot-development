<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { tick } from 'svelte';
  import ProjectMetaCard from '$lib/components/molecules/projects/ProjectMetaCard.svelte';
  import ProjectCreateForm from '$lib/components/molecules/projects/ProjectCreateForm.svelte';
  import SectionCards from "$lib/components/section-cards.svelte";

  let { data }: { data: PageData } = $props();
  const { priorities, states, riskLevels, users, taskStates, taskPriorities, taskTypes, metaTasks } = data as any;

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

  const enhanceCallback = async ({ result, update }) => {
    if (result?.data?.success) {
      await invalidateAll();
    }
  };
//debugger;
</script>

<svelte:head>
  <title>Projects</title>
</svelte:head>


<div class="flex flex-1 flex-col">
  <div class="@container/main flex flex-1 flex-col gap-2">
    <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards/>
    </div>
  </div>
  <div class="m-4">
    <ProjectCreateForm
      action="?/create"
      enhanceForm={true}
      {enhanceCallback}
      priorities={priorities}
      states={states}
      riskLevels={riskLevels}
      users={users}
    />
  </div>
  <div class="@container/main flex flex-1 flex-col gap-2">
    <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t lg:px-6">
      {#each projects as p}
          <ProjectMetaCard
                    class="mt-4"
                    action={`?/updateMeta/${p.id}`}
                    enhanceForm={true}
                    enhanceCallback={enhanceWithForm}
                    project={{
                id: p.id,
                creator: p.creator,
                title: p.title,
                estimatedBudget: p.estimatedBudget,
                estimatedHours: p.estimatedHours,
                actualHours: p.actualHours,
                description: p.description,
                avatarData: p.avatarData,
                startDate: p.startDate,
                actualCost: p.actualCost,
                endDate: p.endDate,
                actualStartDate: p.actualStartDate,
                actualEndDate: p.actualEndDate,
                involvedUsers: p.involvedUsers,
                projectStatus: p.projectStatus,
                priority: p.priority,
                riskLevel: p.riskLevel,
                isActive: p.isActive,
                isDone: p.isDone,
                currentIterationNumber: p.currentIterationNumber,
                maxIterations: p.maxIterations,
                iterationWarnAt: p.iterationWarnAt,
                mainResponsible: p.mainResponsible
              }}
              {priorities}
              {states}
              {riskLevels}
              {users}
              taskStates={taskStates}
              taskPriorities={taskPriorities}
              taskTypes={taskTypes}
              metaTasks={metaTasks}
            />
        {/each}
    </div>
    </div>
  </div>
</div>
