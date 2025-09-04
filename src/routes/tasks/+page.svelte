<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const { priorities, states, tags, tasks } = data;
  let taskStateId: string | null = null;

  let title = '';
  let description = '';
  let dueDate = '';
  let isDone = false;
  let priorityId: string | null = null;
  let tagsCSV = '';
</script>

<svelte:head>
  <title>Tasks</title>
</svelte:head>

<h1>Create Task</h1>
<form method="post" use:enhance action="?/create">
  <div class="mb-2"><input class="input" bind:value={title} name="title" placeholder="Title" required /></div>
  <div class="mb-2"><textarea class="input" bind:value={description} name="description" placeholder="Description"></textarea></div>
  <div class="mb-2"><input class="input" type="datetime-local" bind:value={dueDate} name="dueDate" required /></div>
  <div class="mb-2"><label><input type="checkbox" bind:checked={isDone} name="isDone" /> Done</label></div>
  <div class="mb-2">
    <select class="input" name="taskStateId" bind:value={taskStateId} required>
      <option value="" disabled selected>(choose state)</option>
      {#each states as s}
        <option value={s.id}>{s.name}</option>
      {/each}
    </select>
  </div>
  <div class="mb-2">
    <select class="input" name="priorityId" bind:value={priorityId}>
      <option value="">(no priority)</option>
      {#each priorities as p}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
  </div>
  <div class="mb-2"><input class="input" bind:value={tagsCSV} name="tags" placeholder="tags (comma separated)" /></div>
  <button class="btn" type="submit">Create</button>
</form>

<h2>Existing Tasks</h2>
<ul>
  {#each tasks as t}
    <li class="mb-2">
      <form method="post" use:enhance action="?/toggle" class="inline-flex items-center gap-2">
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="isDone" value={(!t.isDone).toString()} />
        <button class="btn" type="submit">{t.isDone ? 'Mark Undone' : 'Mark Done'}</button>
        <span>{t.title}</span>
      </form>
      <form method="post" use:enhance action="?/tag" class="inline-flex items-center gap-2">
        <input type="hidden" name="taskId" value={t.id} />
        <input class="input" name="tag" placeholder="Add tag" />
        <button class="btn" type="submit">Add</button>
      </form>
    </li>
  {/each}
</ul>
