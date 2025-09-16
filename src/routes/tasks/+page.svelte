<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { derived } from 'svelte/store';

  import TaskCreateForm from '$lib/components/molecules/tasks/TaskCreateForm.svelte';

  let { data }: { data: PageData } = $props();
  const { priorities, states, users, tasks: taskList } = data;

  const tasks = derived(page, ($page) => $page.data.tasks);

  const enhanceCallback = async ({ result, update }) => {
    if (result?.data?.success) {
      invalidateAll();
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
        tasks={taskList}
/>

<h2 class="mt-8 text-xl font-semibold">Existing Tasks</h2>
<ul class="space-y-2 mt-4">
  {#each tasks as t}
    <li class="p-4 border rounded flex flex-col gap-2">
      <strong>{t.title}</strong>
      <span>State: {t.taskState?.name ?? '—'} | Priority: {t.priority?.name ?? '—'}</span>
    </li>
  {/each}
</ul>
