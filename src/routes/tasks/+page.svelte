<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const { priorities, states, tags, users } = data;
  
  // Get tasks from the reactive page store using $derived
  const tasks = $derived($page.data.tasks);

  // Capture form state
  let form = $state();

  let taskStateId = $state<string | null>(null);

  let title = $state('');
  let description = $state('');
  let dueDate = $state('');
  let startDate = $state('');
  let isDone = $state(false);
  let isActive = $state(true);
  let priorityId = $state<string | null>(null);
  let userId = $state<string | null>(null);
  let parentTaskId = $state<string | null>(null);
  let projectId = $state('');
  let actualHours = $state<number | null>(null);
  let hasSegmentGroupCircle = $state(true);
  let segmentGroupCircleId = $state<number | null>(null);
  let iterationSegmentId = $state<number | null>(null);
  let tagsCSV = $state('');

  // Reusable enhance function
  const enhanceWithForm = () => {
    return async ({ result, update }) => {
      form = result.data;
      await update();
    };
  };

  $effect(() => {
    if (form?.success) {
      invalidateAll();
    }
  });
</script>

<svelte:head>
  <title>Tasks</title>
</svelte:head>

<hr>
<h1>Create Task</h1>
<hr style="margin-bottom: 2rem;">
<form method="post" use:enhance={enhanceWithForm} action="?/create">
  <div class="mb-2"><label>Title<br /><input class="input" bind:value={title} name="title" placeholder="Title" required /></label></div>
  <div class="mb-2"><label>Description<br /><textarea class="input" bind:value={description} name="description" placeholder="Description"></textarea></label></div>
  <div class="mb-2"><label>Due date<br /><input class="input" type="datetime-local" bind:value={dueDate} name="dueDate" required /></label></div>
  <div class="mb-2"><label>Start date<br /><input class="input" type="datetime-local" bind:value={startDate} name="startDate" placeholder="Start date (optional)" /></label></div>
  <div class="mb-2"><label><input type="checkbox" bind:checked={isDone} name="isDone" /> Done</label></div>
  <div class="mb-2"><label><input type="checkbox" bind:checked={isActive} name="isActive" /> Active</label></div>
  <div class="mb-2">
    <label>Task state<br />
    <select class="input" name="taskStateId" bind:value={taskStateId} required>
      <option value="" disabled selected>(choose state)</option>
      {#each states as s}
        <option value={s.id}>{s.name}</option>
      {/each}
    </select></label>
  </div>
  <div class="mb-2">
    <label>Priority<br />
    <select class="input" name="priorityId" bind:value={priorityId}>
      <option value="">(no priority)</option>
      {#each priorities as p}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select></label>
  </div>
  <div class="mb-2">
    <label>Active user<br />
    <select class="input" name="userId" bind:value={userId}>
      <option value="">(no active user)</option>
      {#each users as u}
        <option value={u.id}>{u.email}</option>
      {/each}
    </select></label>
  </div>
  <div class="mb-2">
    <label>Parent task<br />
    <select class="input" name="parentTaskId" bind:value={parentTaskId}>
      <option value="">(no parent)</option>
      {#each tasks as t}
        <option value={t.id}>{t.title}</option>
      {/each}
    </select></label>
  </div>
  <div class="mb-2"><label>Project ID<br /><input class="input" name="projectId" bind:value={projectId} placeholder="Project ID (uuid)" /></label></div>
  <div class="mb-2"><label>Actual hours<br /><input class="input" type="number" name="actualHours" bind:value={actualHours} placeholder="Actual hours" /></label></div>
  <div class="mb-2"><label><input type="checkbox" bind:checked={hasSegmentGroupCircle} name="hasSegmentGroupCircle" /> Has segment group circle</label></div>
  <div class="mb-2"><label>Tags<br /><input class="input" bind:value={tagsCSV} name="tags" placeholder="tags (comma separated)" /></label></div>
  <button class="btn" type="submit">Create</button>
</form>
<hr style="margin-top: 2rem;">
<h2>Existing Tasks</h2>
<hr>
<ul>
  {#each tasks as t}
    <li class="mb-2" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; margin: 0.75rem 0;">
      <div style="display:flex; gap: 1rem; align-items:center;">
        <form method="post" use:enhance={enhanceWithForm} action="?/toggle" class="inline-flex items-center gap-2">
          <input type="hidden" name="id" value={t.id} />
          <input type="hidden" name="isDone" value={(!t.isDone).toString()} />
          <button class="btn" type="submit">{t.isDone ? '⬅️' : '✅'}</button>
        </form>
        <strong>{t.title}</strong>
        <span>({t.id})</span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.25rem 1rem; font-size: 0.9rem;">
        <div>State: <b>{t.taskState?.name}</b></div>
        <div>Priority: <b>{t.priority?.name ?? '—'}</b></div>
        <div>Done: <b>{t.isDone ? 'Yes' : 'No'}</b></div>
        <div>Active: <b>{t.isActive ? 'Yes' : 'No'}</b></div>
        <div>Due: <b>{new Date(t.dueDate).toLocaleString()}</b></div>
        <div>Start: <b>{t.startDate ? new Date(t.startDate).toLocaleString() : '—'}</b></div>
        <div>Actual hours: <b>{t.actualHours ?? '—'}</b></div>
        <div>Creator: <b>{t.creator?.email ?? '—'}</b></div>
        <div>Active user: <b>{t.user?.email ?? '—'}</b></div>
        <div>Parent: <b>{t.parent?.title ?? '—'}</b></div>
        <div>Project ID: <b>{t.projectId ?? '—'}</b></div>
        <div>SegGroupCircle: <b>{t.hasSegmentGroupCircle ? 'Yes' : 'No'} ({t.segmentGroupCircleId ?? '—'})</b></div>
        <div>IterSegmentId: <b>{t.iterationSegmentId ?? '—'}</b></div>
        <div>Last used: <b>{t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : '—'}</b></div>
        <div>Created: <b>{new Date(t.createdAt).toLocaleString()}</b></div>
        <div>Updated: <b>{new Date(t.updatedAt).toLocaleString()}</b></div>
        <div style="grid-column: 1 / -1;">Description: <b>{t.description ?? '—'}</b></div>
      </div>

      <div style="display:flex; gap: 0.5rem; flex-wrap: wrap; align-items:center;">
        <span>Tags:</span>
        {#if t.tags?.length}
          {#each t.tags as tag}
            <span style="border: 1px solid #ccc; padding: 0.1rem 0.4rem; border-radius: 4px;">{tag.name}</span>
          {/each}
        {:else}
          <span>—</span>
        {/if}
      </div>

      <form method="post" use:enhance={enhanceWithForm} action="?/tag" class="inline-flex items-center gap-2" style="flex-direction: row; width: 100%;">
        <input type="hidden" name="taskId" value={t.id} />
        <input class="input" name="tag" placeholder="Add tag" />
        <button class="btn" style="margin-left: auto;" type="submit">Add</button>
      </form>
    </li>
  {/each}
</ul>