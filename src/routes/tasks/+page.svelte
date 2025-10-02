<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import DataTable from '$lib/components/data-table.svelte';
  import TasksDataTable from '$lib/components/tasks-data-table.svelte';
  import DropTest from '$lib/components/drop-test.svelte';
  import TaskCreateForm from '$lib/components/molecules/tasks/TaskCreateForm.svelte';
  import { onMount } from 'svelte';
  import Section from '$lib/components/section.svelte';
  import DraggableContainers from '$lib/components/examples/nested/draggable-containers.svelte';


  let mountCount = 0;
  onMount(() => {
    mountCount++;
    console.log(`Tasks Page Mount #${mountCount}`);
    return () => console.log(`Tasks Page Unmount #${mountCount}`);
  });

  let { data }: { data: PageData } = $props();
  const { dropContainerItems, fakeData, tasksProjected, priorities, states, tags, users, user, mTasks } = data;
  const metaTasks = (mTasks ?? []).filter((t: any) => t?.isMeta === true);
  //debugger;
  const enhanceCallback = async ({ result, update }) => {
    if (result?.data?.success) {
      await invalidateAll();
    }
  };



</script>

<h1 class="text-2xl font-bold mb-4">Create Task</h1>

<TaskCreateForm
        action="?/create"
        enhanceForm={true}
        {enhanceCallback}
        {states}
        {priorities}
        {users}
        tasks={metaTasks}
/>


<div class="flex flex-1 flex-col">
  <div class="@container/main flex flex-1 flex-col gap-2">
      <Section id="example-0" title="Existing Tasks" link="#">
        <DataTable data={fakeData} />
      </Section>
      <Section id="example-1" title="Actual Tasks" link="#">
          <TasksDataTable data={tasksProjected} />
      </Section>
      <Section id="example-2" title="Draggable Containers" link="#">
        <DraggableContainers data={dropContainerItems}/>
      </Section>
  </div>
</div>

<!--<ul class="space-y-2 mt-4">-->
<!--  {#each taskList as t}-->
<!--    <li class="p-4 border rounded flex flex-col gap-2">-->
<!--      <strong>{t.title}</strong>-->
<!--      <span>Status: {t.taskStatus?.name ?? '—'} | Priority: {t.priority?.name ?? '—'}</span>-->
<!--    </li>-->
<!--  {/each}-->
<!--</ul>-->