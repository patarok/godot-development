<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import DataTable from '$lib/components/data-table.svelte';
  import TasksDataTable from '$lib/components/tasks-data-table.svelte';
  import TaskCreateForm from '$lib/components/molecules/tasks/TaskCreateForm.svelte';
  import KanbanBoard from '$lib/components/kanban/kanban-board.svelte';
  import { onMount } from 'svelte';
  import Section from '$lib/components/section.svelte';
//  import DraggableContainers from '$lib/components/examples/nested/draggable-containers.svelte';


  let { data }: { data: PageData } = $props();

  const { dropContainerItems, tasksProjected, projects, priorities, states, tags, users, types, user, mTasks } = data;
  const metaTasks = (mTasks ?? []).filter((t: any) => t?.isMeta === true);
  const enhanceCallback = async ({ result, update }) => {
    if (result?.data?.success) {
      await invalidateAll();
    }
  };

  let view = $state<'table' | 'kanban'>('table');
  let kanbanGroupBy = $state<'status' | 'weekday'>('weekday');

</script>

<div class="flex items-center justify-between mb-4">
    <h1>Tasks</h1>

    <!-- View Toggle -->
    <div class="flex gap-2">
        <button
                class="btn btn-sm"
                class:btn-primary={view === 'table'}
                onclick={() => view = 'table'}
        >
            Table View
        </button>
        <button
                class="btn btn-sm"
                class:btn-primary={view === 'kanban'}
                onclick={() => view = 'kanban'}
        >
            Kanban View
        </button>
    </div>
</div>

<div class="m-4">
<TaskCreateForm
        action="?/create"
        enhanceForm={true}
        {enhanceCallback}
        {states}
        {priorities}
        {users}
        tasks={metaTasks}
/>
</div>

<div class="flex flex-1 flex-col">
  <div class="@container/main flex flex-1 flex-col gap-2">
      {#if view === 'table'}
      <Section id="example-1" title="Task List" link="#">
          <TasksDataTable data={tasksProjected} {states} {priorities} {types} {users} {projects} />
      </Section>
      {:else}
          <div class="flex gap-2 mb-4">
              <button
                      class="btn btn-sm"
                      class:btn-primary={kanbanGroupBy === 'weekday'}
                      onclick={() => kanbanGroupBy = 'weekday'}
              >
                  By Week
              </button>
              <button
                      class="btn btn-sm"
                      class:btn-primary={kanbanGroupBy === 'status'}
                      onclick={() => kanbanGroupBy = 'status'}
              >
                  By Status
              </button>
          </div>

          <KanbanBoard
                  tasks={tasksProjected}
                  {states}
                  {priorities}
                  {types}
                  {users}
                  {projects}
                  groupBy={kanbanGroupBy}
          />
      {/if}
<!--      <Section id="example-2" title="Draggable Containers" link="#">-->
<!--        <DraggableContainers data={dropContainerItems}/>-->
<!--      </Section>-->
  </div>
</div>
