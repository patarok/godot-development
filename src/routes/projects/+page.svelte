<script lang="ts">

  //projects: plainProjects,
  //        priorities: toPlainArray(priorities),
  //        states: toPlainArray(states),
  //        users: toPlainArray(users),
  //        tasks: toPlainArray(allTasks),
  //        user: locals.user
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { PageData } from './$types';
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

  <div class="mb-2"><label>Responsible users<br />
    <select class="input" name="responsibleUserIds" multiple size="5">
      {#each users as u}
        <option value={u.id}>{u.email}</option>
      {/each}
    </select>
  </label></div>

  <div class="mb-2"><label>Assigned users<br />
    <select class="input" name="assignedUserIds" multiple size="5">
      {#each users as u}
        <option value={u.id}>{u.email}</option>
      {/each}
    </select>
  </label></div>


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
