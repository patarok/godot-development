<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import DataTable from '$lib/components/data-table.svelte';
  import TasksDataTable from '$lib/components/tasks-data-table.svelte';
  import TaskCreateForm from '$lib/components/molecules/tasks/TaskCreateForm.svelte';
  import KanbanBoard from '$lib/components/kanban/kanban-board.svelte';
  import { onMount } from 'svelte';
  import Section from '$lib/components/section.svelte';
  import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import TableIcon from '@tabler/icons-svelte/icons/table';
  import LayoutKanbanIcon from '@tabler/icons-svelte/icons/layout-kanban';
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
    <NavigationMenu.Root>
        <NavigationMenu.List>
            <NavigationMenu.Item>
                <NavigationMenu.Link
                        href="#"
                        class={`flex items-center gap-2 ${view === 'table' ? 'font-semibold text-primary' : ''}`}
                        onclick={(e) => {
                            e.preventDefault();
                            view = 'table';
                        }}
                >
                    <TableIcon class="w-4 h-4" />
                    Table View
                </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
                <NavigationMenu.Link
                        href="#"
                        class={`flex items-center gap-2 ${view === 'kanban' ? 'font-semibold text-primary' : ''}`}
                        onclick={(e) => {
                            e.preventDefault();
                            view = 'kanban';
                        }}
                >
                    <LayoutKanbanIcon class="w-4 h-4" />
                    Kanban View
                </NavigationMenu.Link>
            </NavigationMenu.Item>
        </NavigationMenu.List>
    </NavigationMenu.Root>
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
          <div class="flex items-center gap-3 mb-4 p-4 bg-muted/30 rounded-lg w-fit">
              <Label for="view-mode-switch" class="text-sm font-medium">
                  View Mode:
              </Label>
              <span class="text-sm" class:text-primary={kanbanGroupBy === 'weekday'} class:font-semibold={kanbanGroupBy === 'weekday'}>
                  By Week
              </span>
              <Switch
                      id="view-mode-switch"
                      checked={kanbanGroupBy === 'status'}
                      onCheckedChange={(checked) => {
                          kanbanGroupBy = checked ? 'status' : 'weekday';
                      }}
              />
              <span class="text-sm" class:text-primary={kanbanGroupBy === 'status'} class:font-semibold={kanbanGroupBy === 'status'}>
                  By Status
              </span>
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
