<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import DataTable from '$lib/components/data-table.svelte';
  import TasksDataTable from '$lib/components/tasks-data-table.svelte';
  import TaskCreateForm from '$lib/components/molecules/tasks/TaskCreateForm.svelte';
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

</script>

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
      <Section id="example-1" title="Task List" link="#">
          <TasksDataTable data={tasksProjected} {states} {priorities} {types} {users} {projects} />
      </Section>
<!--      <Section id="example-2" title="Draggable Containers" link="#">-->
<!--        <DraggableContainers data={dropContainerItems}/>-->
<!--      </Section>-->
  </div>
</div>
