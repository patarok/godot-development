<script lang="ts">
    import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "$lib/components/ui/card";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "@sveltejs/kit";
    import {Checkbox} from "$lib/components/ui/checkbox";

    // Props
    let {
        class: className,
        method = "POST",
        action = "?/create",
        enhanceForm = false,
        enhanceCallback = undefined,
        states = [],
        priorities = [],
        riskLevels = [],
        users = []
    }: {
        class?: string;
        method?: string;
        action?: string;
        enhanceForm?: boolean;
        enhanceCallback?: SubmitFunction;
        states?: any[];
        priorities?: any[];
        riskLevels?: any[];
        users?: any[];
    } = $props();

    // Rune states
    let projectStateId = $state<string | null>(null);
    let title = $state("");
    let description = $state("");
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
    let startDate = $state("");
    let endDate = $state("");
    let actualStartDate = $state("");
    let actualEndDate = $state("");
    let riskLevelId = $state<string | null>(null);
    let mainResponsibleId = $state<string | null>(null);

    // Responsible / Assigned users
    let selectedResponsibleIds = $state<string[]>([]);
    let selectedAssignedIds = $state<string[]>([]);
    let responsiblePicker = $state<string | null>(null);
    let assignedPicker = $state<string | null>(null);

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
        if (id === mainResponsibleId) return;
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

    const availableResponsible = $derived(users.filter((u: any) => !selectedResponsibleIds.includes(u.id)));
    const availableAssigned = $derived(users.filter((u: any) => !selectedAssignedIds.includes(u.id)));
</script>

<Card class={"w-full max-w-2xl " + (className ?? "")}>
    <form
            method={method}
            action={action}
            use:enhance={enhanceForm ? (enhanceCallback ?? enhance) : undefined}
            class="space-y-4"
    >

        <CardContent class="space-y-4">
            <!-- Title -->
            <div class="flex flex-col gap-2">
                <Label for="title">Title</Label>
                <Input id="title" name="title" bind:value={title} required />
            </div>

            <!-- Description -->
            <div class="flex flex-col gap-2">
                <Label for="description">Description</Label>
                <Input id="description" name="description" bind:value={description} />
            </div>

            <!-- State -->
            <div class="flex flex-col gap-2">
                <Label for="projectStateId">Project State</Label>
                <select id="projectStateId" name="projectStateId" bind:value={projectStateId} required class="input">
                    <option value="" disabled selected>(choose state)</option>
                    {#each states as s}
                        <option value={s.id}>{s.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Priority -->
            <div class="flex flex-col gap-2">
                <Label for="priorityId">Priority</Label>
                <select id="priorityId" name="priorityId" bind:value={priorityId} class="input">
                    <option value="">(no priority)</option>
                    {#each priorities as p}
                        <option value={p.id}>{p.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Checkboxes -->
            <div class="flex gap-4">
                <Checkbox id="isDone-projectCreateForm" bind:checked={isDone} name="isDone"/>
                <Label for="isDone-projectCreateForm">Done</Label>
                <Checkbox id="isActive-projectCreateForm" bind:checked={isActive} name="isActive"/>
                <Label for="isActive-projectCreateForm">Active</Label>
            </div>

            <!-- Iteration fields -->
            <div class="grid grid-cols-2 gap-4">
                <Input type="number" name="currentIterationNumber" placeholder="Current iteration" bind:value={currentIterationNumber} />
                <Input type="number" name="iterationWarnAt" placeholder="Iteration warn at" bind:value={iterationWarnAt} />
                <Input type="number" name="maxIterations" placeholder="Max iterations" bind:value={maxIterations} />
            </div>

            <!-- Budget & hours -->
            <div class="grid grid-cols-2 gap-4">
                <Input type="number" step="0.01" name="estimatedBudget" placeholder="Estimated budget" bind:value={estimatedBudget} />
                <Input type="number" step="0.01" name="actualCost" placeholder="Actual cost" bind:value={actualCost} />
                <Input type="number" name="estimatedHours" placeholder="Estimated hours" bind:value={estimatedHours} />
                <Input type="number" name="actualHours" placeholder="Actual hours" bind:value={actualHours} />
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-4">
                <Input type="datetime-local" name="startDate" bind:value={startDate} />
                <Input type="datetime-local" name="endDate" bind:value={endDate} />
                <Input type="datetime-local" name="actualStartDate" bind:value={actualStartDate} />
                <Input type="datetime-local" name="actualEndDate" bind:value={actualEndDate} />
            </div>

            <!-- Risk level -->
            <div class="flex flex-col gap-2">
                <Label for="riskLevelId">Risk level</Label>
                <select id="riskLevelId" name="riskLevelId" bind:value={riskLevelId} class="input">
                    <option value="">(none)</option>
                    {#each riskLevels as r}
                        <option value={r.id}>{r.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Main responsible -->
            <div class="flex flex-col gap-2">
                <Label for="mainResponsibleId">Main responsible</Label>
                <select id="mainResponsibleId" name="mainResponsibleId" bind:value={mainResponsibleId} class="input">
                    <option value="">(default to creator)</option>
                    {#each users as u}
                        <option value={u.id}>{u.email}</option>
                    {/each}
                </select>
            </div>

            <!-- Responsible users -->
            <div class="flex flex-col gap-2">
                <Label>Responsible users</Label>
                <div class="flex gap-2">
                    <select bind:value={responsiblePicker} class="input">
                        <option value={null} disabled selected>(select user)</option>
                        {#each availableResponsible as u}
                            <option value={u.id}>{u.email}</option>
                        {/each}
                    </select>
                    <Button type="button" on:click={addResponsible}>Add</Button>
                </div>
                <div class="flex flex-wrap gap-2">
                    {#each selectedResponsibleIds as id}
            <span class="border px-2 py-1 rounded flex gap-2 items-center">
              {(users.find((x: any) => x.id === id))?.email ?? id}
                <button type="button" on:click={() => removeResponsible(id)} disabled={id === mainResponsibleId}>×</button>
            </span>
                    {/each}
                </div>
                {#each selectedResponsibleIds as id}
                    <input type="hidden" name="responsibleUserIds" value={id} />
                {/each}
            </div>

            <!-- Assigned users -->
            <div class="flex flex-col gap-2">
                <Label>Assigned users</Label>
                <div class="flex gap-2">
                    <select bind:value={assignedPicker} class="input">
                        <option value={null} disabled selected>(select user)</option>
                        {#each availableAssigned as u}
                            <option value={u.id}>{u.email}</option>
                        {/each}
                    </select>
                    <Button type="button" on:click={addAssigned}>Add</Button>
                </div>
                <div class="flex flex-wrap gap-2">
                    {#each selectedAssignedIds as id}
            <span class="border px-2 py-1 rounded flex gap-2 items-center">
              {(users.find((x: any) => x.id === id))?.email ?? id}
                <button type="button" on:click={() => removeAssigned(id)}>×</button>
            </span>
                    {/each}
                </div>
                {#each selectedAssignedIds as id}
                    <input type="hidden" name="assignedUserIds" value={id} />
                {/each}
            </div>
        </CardContent>

        <CardFooter>
            <Button type="submit">Create</Button>
        </CardFooter>
    </form>
</Card>
