<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { tick } from 'svelte';

  let { data }: { data: PageData } = $props();
  const { priorities, states, riskLevels, users, tasks } = data as any;

  const projects = $derived($page.data.projects);

  let form = $state();
  let projectStateId = $state<string | null>(null);
  let title = $state('');
  let description = $state('');
  let priorityId = $state<string | null>(null);
  let isActive = $state(true);
  let isDone = $state(false);
  let currentIterationNumber = $state<number | null>(null);
  let iterationWarnAt = $state<number | null>(null);
  let maxIterations = $state<number | null>(null);
  let estimatedBudget = $state<number | null>(null);
  let actualCost = $state<number | null>(null);
  let estimatedHours = $state<number | null>(null);
  let actualHours = $state<number | null>(null);
  let startDate = $state('');
  let endDate = $state('');
  let actualStartDate = $state('');
  let actualEndDate = $state('');
  let riskLevelId = $state<string | null>(null);
  let mainResponsibleId = $state<string | null>(null);

  // NEW: client-side pick-lists for create (no submit until Create)
  let selectedResponsibleIds = $state<string[]>([]);
  let selectedAssignedIds = $state<string[]>([]);
  let responsiblePicker = $state<string | null>(null);
  let assignedPicker = $state<string | null>(null);

  // Make sure mainResponsible is also in Responsible users
  $effect(() => {
    if (mainResponsibleId && !selectedResponsibleIds.includes(mainResponsibleId)) {
      selectedResponsibleIds = [...selectedResponsibleIds, mainResponsibleId];
    }
  });

  function addResponsible() {
    if (responsiblePicker && !selectedResponsibleIds.includes(responsiblePicker)) {
      selectedResponsibleIds = [...selectedResponsibleIds, responsiblePicker];
      responsiblePicker = null;
    }
  }
  function removeResponsible(id: string) {
    if (id === mainResponsibleId) return; // keep mainResponsible
    selectedResponsibleIds = selectedResponsibleIds.filter((x) => x !== id);
  }

  function addAssigned() {
    if (assignedPicker && !selectedAssignedIds.includes(assignedPicker)) {
      selectedAssignedIds = [...selectedAssignedIds, assignedPicker];
      assignedPicker = null;
    }
  }
  function removeAssigned(id: string) {
    selectedAssignedIds = selectedAssignedIds.filter((x) => x !== id);
  }

  // Helper lists: available users for each picker (exclude already picked)
  const availableResponsible = $derived(users.filter((u: any) => !selectedResponsibleIds.includes(u.id)));
  const availableAssigned = $derived(users.filter((u: any) => !selectedAssignedIds.includes(u.id)));

  // Reusable enhance function
  const enhanceWithForm = () => {
    return async ({ result, update }) => {
      form = result?.data;
      await update();

      if (result?.data?.success) {
        await tick(); // Wait for DOM to update
        invalidateAll();
        await tick(); // Wait for invalidation to complete

        // Now clear the fields
        projectStateId = null;
        title = '';
        description = '';
        priorityId = null;
        isActive = true;
        isDone = false;
        currentIterationNumber = null;
        iterationWarnAt = null;
        maxIterations = null;
        estimatedBudget = null;
        actualCost = null;
        estimatedHours = null;
        actualHours = null;
        startDate = '';
        endDate = '';
        actualStartDate = '';
        actualEndDate = '';
        riskLevelId = null;
        mainResponsibleId = null;
        selectedResponsibleIds = [];
        selectedAssignedIds = [];
        responsiblePicker = null;
        assignedPicker = null;
      }
    };
  };
</script>

<svelte:head>
  <title>Projects</title>
</svelte:head>

<hr />
<h1>Create Project</h1>
<hr style="margin-bottom: 2rem;" />
<form method="post" use:enhance={enhanceWithForm} action="?/create">
  <div class="mb-2"><label>Title<br /><input class="input" bind:value={title} name="title" placeholder="Title" required /></label></div>
  <div class="mb-2"><label>Description<br /><textarea class="input" bind:value={description} name="description" placeholder="Description"></textarea></label></div>
  <div class="mb-2">
    <label>Project state<br />
      <select class="input" name="projectStateId" bind:value={projectStateId} required>
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
  <div class="mb-2"><label><input type="checkbox" bind:checked={isDone} name="isDone" /> Done</label></div>
  <div class="mb-2"><label><input type="checkbox" bind:checked={isActive} name="isActive" /> Active</label></div>

  <div class="mb-2"><label>Current iteration number<br /><input class="input" name="currentIterationNumber" type="number" bind:value={currentIterationNumber} /></label></div>
  <div class="mb-2"><label>Iteration warn at<br /><input class="input" name="iterationWarnAt" type="number" bind:value={iterationWarnAt} /></label></div>
  <div class="mb-2"><label>Max iterations<br /><input class="input" name="maxIterations" type="number" bind:value={maxIterations} /></label></div>

  <div class="mb-2"><label>Estimated budget<br /><input class="input" name="estimatedBudget" type="number" step="0.01" bind:value={estimatedBudget} /></label></div>
  <div class="mb-2"><label>Actual cost<br /><input class="input" name="actualCost" type="number" step="0.01" bind:value={actualCost} /></label></div>
  <div class="mb-2"><label>Estimated hours<br /><input class="input" name="estimatedHours" type="number" bind:value={estimatedHours} /></label></div>
  <div class="mb-2"><label>Actual hours<br /><input class="input" name="actualHours" type="number" bind:value={actualHours} /></label></div>

  <div class="mb-2"><label>Start date<br /><input class="input" type="datetime-local" name="startDate" bind:value={startDate} /></label></div>
  <div class="mb-2"><label>End date<br /><input class="input" type="datetime-local" name="endDate" bind:value={endDate} /></label></div>
  <div class="mb-2"><label>Actual start date<br /><input class="input" type="datetime-local" name="actualStartDate" bind:value={actualStartDate} /></label></div>
  <div class="mb-2"><label>Actual end date<br /><input class="input" type="datetime-local" name="actualEndDate" bind:value={actualEndDate} /></label></div>

  <div class="mb-2"><label>Risk level<br />
    <select class="input" name="riskLevelId" bind:value={riskLevelId}>
      <option value="">(none)</option>
      {#each riskLevels as r}
        <option value={r.id}>{r.name}</option>
      {/each}
    </select>
  </label></div>

  <div class="mb-2"><label>Main responsible<br />
    <select class="input" name="mainResponsibleId" bind:value={mainResponsibleId}>
      <option value="">(default to creator)</option>
      {#each users as u}
        <option value={u.id}>{u.email}</option>
      {/each}
    </select>
  </label></div>

  <!-- Responsible users pick-list (no submit) -->
  <div class="mb-2">
    <label>Responsible users</label>
    <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
      <select class="input" bind:value={responsiblePicker}>
        <option value={null} disabled selected>(select user)</option>
        {#each availableResponsible as u}
          <option value={u.id}>{u.email}</option>
        {/each}
      </select>
      <button class="btn" type="button" on:click={addResponsible}>Add</button>
    </div>
    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
      {#each selectedResponsibleIds as id}
        <span style="border:1px solid #ccc; padding:2px 6px; border-radius:4px; display:inline-flex; gap:6px; align-items:center;">
          {(users.find((x: any) => x.id === id))?.email ?? id}
          <button class="btn" type="button" title="Remove" on:click={() => removeResponsible(id)} disabled={id === mainResponsibleId}>×</button>
        </span>
      {/each}
    </div>
    <!-- Hidden inputs to submit on Create -->
    {#each selectedResponsibleIds as id}
      <input type="hidden" name="responsibleUserIds" value={id} />
    {/each}
  </div>

  <!-- Assigned users pick-list (no submit) -->
  <div class="mb-2">
    <label>Assigned users</label>
    <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
      <select class="input" bind:value={assignedPicker}>
        <option value={null} disabled selected>(select user)</option>
        {#each availableAssigned as u}
          <option value={u.id}>{u.email}</option>
        {/each}
      </select>
      <button class="btn" type="button" on:click={addAssigned}>Add</button>
    </div>
    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
      {#each selectedAssignedIds as id}
        <span style="border:1px solid #ccc; padding:2px 6px; border-radius:4px; display:inline-flex; gap:6px; align-items:center;">
          {(users.find((x: any) => x.id === id))?.email ?? id}
          <button class="btn" type="button" title="Remove" on:click={() => removeAssigned(id)}>×</button>
        </span>
      {/each}
    </div>
    <!-- Hidden inputs to submit on Create -->
    {#each selectedAssignedIds as id}
      <input type="hidden" name="assignedUserIds" value={id} />
    {/each}
  </div>


  <button class="btn" type="submit">Create</button>
</form>

<hr style="margin-top: 2rem;" />
<h2>Existing Projects</h2>
<hr />
<ul>
  {#each projects as p}
    <li class="mb-2" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; margin: 0.75rem 0;">
      <div style="display:flex; gap: 1rem; align-items:center;">
        <strong>{p.title}</strong>
        <span>({p.id})</span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.25rem 1rem; font-size: 0.9rem;">
        <div>State: <b>{p.projectState?.name}</b></div>
        <div>Priority: <b>{p.priority?.name ?? '—'}</b></div>
        <div>Done: <b>{p.isDone ? 'Yes' : 'No'}</b></div>
        <div>Active: <b>{p.isActive ? 'Yes' : 'No'}</b></div>
        <div>Current Iteration: <b>{p.currentIterationNumber}</b></div>
        <div>Warn at: <b>{p.iterationWarnAt}</b></div>
        <div>Max Iterations: <b>{p.maxIterations ?? '—'}</b></div>
        <div>Est. Budget: <b>{p.estimatedBudget ?? '—'}</b></div>
        <div>Actual Cost: <b>{p.actualCost ?? '—'}</b></div>
        <div>Est. Hours: <b>{p.estimatedHours ?? '—'}</b></div>
        <div>Actual Hours: <b>{p.actualHours ?? '—'}</b></div>
        <div>Start: <b>{p.startDate ? new Date(p.startDate).toLocaleString() : '—'}</b></div>
        <div>End: <b>{p.endDate ? new Date(p.endDate).toLocaleString() : '—'}</b></div>
        <div>Actual Start: <b>{p.actualStartDate ? new Date(p.actualStartDate).toLocaleString() : '—'}</b></div>
        <div>Actual End: <b>{p.actualEndDate ? new Date(p.actualEndDate).toLocaleString() : '—'}</b></div>
        <div>Risk: <b>{p.riskLevel?.name ?? '—'}</b></div>
        <div>Main responsible: <b>{p.mainResponsible?.email ?? '—'}</b></div>
        <div>Active user: <b>{p.activeUser?.email ?? '—'}</b></div>
        <div>Creator: <b>{p.creator?.email ?? '—'}</b></div>
        <div>Created: <b>{new Date(p.createdAt).toLocaleString()}</b></div>
        <div>Updated: <b>{new Date(p.updatedAt).toLocaleString()}</b></div>
        <div style="grid-column: 1 / -1;">Description: <b>{p.description ?? '—'}</b></div>
      </div>

      <div style="display:flex; gap: 0.5rem; flex-wrap: wrap; align-items:center;">
        <span>Tasks:</span>
        {#if p.tasks?.length}
          <ul style="margin: 0; padding-left: 1rem;">
            {#each p.tasks as t}
              <li style="display:flex; align-items:center; gap: 0.5rem;">
                <span>{t.title}</span>
                <form method="post" use:enhance={enhanceWithForm} action="?/removeTask" >
                  <input type="hidden" name="taskId" value={t.id} />
                  <button class="btn" type="submit" title="Remove from project">✖</button>
                </form>
              </li>
            {/each}
          </ul>
        {:else}
          <span>—</span>
        {/if}
      </div>

      <div style="display:flex; gap: 0.5rem; flex-wrap: wrap; align-items:center;">
        <span>Assigned users:</span>
        {#if p.assignedUsers?.length}
          <ul style="margin: 0; padding-left: 1rem;">
            {#each p.assignedUsers as u}
              <li style="display:flex; align-items:center; gap: 0.5rem;">
                <span>{u.email}</span>
                <form method="post" use:enhance={enhanceWithForm} action="?/removeAssignedUser">
                  <input type="hidden" name="projectId" value={p.id} />
                  <input type="hidden" name="userId" value={u.id} />
                  <button class="btn" type="submit" title="Remove user">✖</button>
                </form>
              </li>
            {/each}
          </ul>
        {:else}
          <span>—</span>
        {/if}
      </div>

      <form method="post" use:enhance={enhanceWithForm} action="?/addAssignedUser">
        <input type="hidden" name="projectId" value={p.id} />
        <select class="input" name="userId">
          {#each users as u}
            <option value={u.id}>{u.email}</option>
          {/each}
        </select>
        <button class="btn" style="margin-left: auto;" type="submit">Add Assigned</button>
      </form>

      <div style="display:flex; gap: 0.5rem; flex-wrap: wrap; align-items:center;">
        <span>Responsible users:</span>
        {#if p.responsibleUsers?.length}
          <ul style="margin: 0; padding-left: 1rem;">
            {#each p.responsibleUsers as u}
              <li style="display:flex; align-items:center; gap: 0.5rem;">
                <span>{u.email}</span>
                <form method="post" use:enhance={enhanceWithForm} action="?/removeResponsibleUser">
                  <input type="hidden" name="projectId" value={p.id} />
                  <input type="hidden" name="userId" value={u.id} />
                  <button class="btn" type="submit" title="Remove user">✖</button>
                </form>
              </li>
            {/each}
          </ul>
        {:else}
          <span>—</span>
        {/if}
      </div>

      <form method="post" use:enhance={enhanceWithForm} action="?/addResponsibleUser">
        <input type="hidden" name="projectId" value={p.id} />
        <select class="input" name="userId">
          {#each users as u}
            <option value={u.id}>{u.email}</option>
          {/each}
        </select>
        <button class="btn" style="margin-left: auto;" type="submit">Add Responsible</button>
      </form>

      <form method="post" use:enhance={enhanceWithForm} action="?/setMainResponsible">
        <input type="hidden" name="projectId" value={p.id} />
        <select class="input" name="userId">
          <option value="">(unset)</option>
          {#each users as u}
            <option value={u.id}>{u.email}</option>
          {/each}
        </select>
        <button class="btn" style="margin-left: auto;" type="submit">Set Main Responsible</button>
      </form>


      <!-- Add existing task to this project -->
      <form method="post" use:enhance={enhanceWithForm} action="?/addTask">
        <input type="hidden" name="projectId" value={p.id} />
        <select class="input" name="taskId">
          {#each tasks as t}
            <option value={t.id}>{t.title}</option>
          {/each}
        </select>
        <button class="btn" style="margin-left: auto;" type="submit">Add Task</button>
      </form>
    </li>
  {/each}
</ul>
