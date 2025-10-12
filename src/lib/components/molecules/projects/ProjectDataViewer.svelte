<script lang="ts">
    import { enhance } from '$app/forms';
    import { getLocalTimeZone } from '@internationalized/date';
    import { parseDate } from '@internationalized/date';
    import type { DateRange } from 'bits-ui';

    import * as Drawer from "$lib/components/ui/drawer/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import DatePickerWithRange from '$lib/components/date-picker-with-range.svelte';
    import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";

    const isMobile = new IsMobile();

    let {
        project,
        action = "?/update",
        priorities = [],
        states = [],
        riskLevels = [],
        users = []
    }: {
        project: any;
        action?: string;
        priorities?: Array<{ id: string; name: string }>;
        states?: Array<{ id: string; name: string }>;
        riskLevels?: Array<{ id: string; name: string }>;
        users?: Array<{ id: string; email: string; forename?: string | null; surname?: string | null; username?: string | null; avatarData?: string | null }>;
    } = $props();

    // Helpers
    function initials(of: { forename?: string | null; surname?: string | null; username?: string | null; email?: string }): string {
        const f = (of.forename ?? '').trim();
        const s = (of.surname ?? '').trim();
        if (f || s) return `${f[0] ?? ''}${s[0] ?? ''}`.toUpperCase();
        const un = (of.username ?? of.email ?? '').trim();
        const parts = un.split(/[^a-zA-Z0-9]+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return (un[0] ?? '?').toUpperCase();
    }

    // Form state
    let title = $state(project.title ?? '');
    let description = $state(project.description ?? '');
    let projectStatusId = $state(project.projectStatus?.id ?? '');
    let priorityId = $state(project.priority?.id ?? '');
    let riskLevelId = $state(project.riskLevel?.id ?? '');
    let isActive = $state(project.isActive ?? true);
    let isDone = $state(project.isDone ?? false);

    // Budget and hours
    let estimatedBudget = $state(String(project.estimatedBudget ?? ''));
    let actualCost = $state(String(project.actualCost ?? ''));
    let estimatedHours = $state(String(project.estimatedHours ?? ''));
    let actualHours = $state(String(project.actualHours ?? ''));
    let currentIterationNumber = $state(String(project.currentIterationNumber ?? 0));
    let maxIterations = $state(String(project.maxIterations ?? ''));
    let iterationWarnAt = $state(String(project.iterationWarnAt ?? ''));

    // Main responsible
    let mainResponsibleId = $state(project.mainResponsible?.id ?? null);

    // Date range from project dates
    let dateRange = $state<DateRange | undefined>(
        project.startDate && project.endDate
            ? {
                start: parseDate(new Date(project.startDate).toISOString().split('T')[0]),
                end: parseDate(new Date(project.endDate).toISOString().split('T')[0])
            }
            : undefined
    );

    let actualDateRange = $state<DateRange | undefined>(
        project.actualStartDate && project.actualEndDate
            ? {
                start: parseDate(new Date(project.actualStartDate).toISOString().split('T')[0]),
                end: parseDate(new Date(project.actualEndDate).toISOString().split('T')[0])
            }
            : undefined
    );

    const startDateISO = $derived.by(() => {
        const d = dateRange?.start;
        if (!d) return "";
        return d.toDate(getLocalTimeZone()).toISOString();
    });

    const endDateISO = $derived.by(() => {
        const d = dateRange?.end;
        if (!d) return "";
        return d.toDate(getLocalTimeZone()).toISOString();
    });

    const actualStartDateISO = $derived.by(() => {
        const d = actualDateRange?.start;
        if (!d) return "";
        return d.toDate(getLocalTimeZone()).toISOString();
    });

    const actualEndDateISO = $derived.by(() => {
        const d = actualDateRange?.end;
        if (!d) return "";
        return d.toDate(getLocalTimeZone()).toISOString();
    });
</script>

<Drawer.Root direction={isMobile.current ? "bottom" : "right"}>
    <Drawer.Trigger>
        {#snippet child({ props })}
            <Button class="mx-auto" type="button" {...props}>Edit</Button>
        {/snippet}
    </Drawer.Trigger>
    <Drawer.Content>
        <Drawer.Header class="gap-1">
            <Drawer.Title>{project.title}</Drawer.Title>
            <Drawer.Description>Edit project details</Drawer.Description>
        </Drawer.Header>
        <div class="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
            <form method="post" use:enhance action={action} class="flex flex-col gap-4">
                <!-- Hidden field for project ID -->
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="id" value={project.id} />

                <div class="flex flex-col gap-3">
                    <Label for="title">Title</Label>
                    <Input id="title" name="title" bind:value={title} required />
                </div>

                <div class="flex flex-col gap-3">
                    <Label for="description">Description</Label>
                    <Input id="description" name="description" bind:value={description} />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-3">
                        <Label for="status">Status</Label>
                        <Select.Root type="single" bind:value={projectStatusId} name="projectStatusId">
                            <Select.Trigger id="status" class="w-full">
                                {states.find((s) => s.id === projectStatusId)?.name ?? "Select status"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each states as s}
                                    <Select.Item value={s.id}>{s.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="priority">Priority</Label>
                        <Select.Root type="single" bind:value={priorityId} name="priorityId">
                            <Select.Trigger id="priority" class="w-full">
                                {priorities.find((p) => p.id === priorityId)?.name ?? "Select priority"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each priorities as p}
                                    <Select.Item value={p.id}>{p.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <Label for="riskLevel">Risk Level</Label>
                    <Select.Root type="single" bind:value={riskLevelId} name="riskLevelId">
                        <Select.Trigger id="riskLevel" class="w-full">
                            {riskLevels.find((r) => r.id === riskLevelId)?.name ?? "Select risk level"}
                        </Select.Trigger>
                        <Select.Content>
                            {#each riskLevels as r}
                                <Select.Item value={r.id}>{r.name}</Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>

                <!-- Budget and Hours -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-3">
                        <Label for="estimatedBudget">Estimated Budget</Label>
                        <Input id="estimatedBudget" name="estimatedBudget" type="number" bind:value={estimatedBudget} />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="actualCost">Actual Cost</Label>
                        <Input id="actualCost" name="actualCost" type="number" bind:value={actualCost} />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-3">
                        <Label for="estimatedHours">Estimated Hours</Label>
                        <Input id="estimatedHours" name="estimatedHours" type="number" bind:value={estimatedHours} />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="actualHours">Actual Hours</Label>
                        <Input id="actualHours" name="actualHours" type="number" bind:value={actualHours} />
                    </div>
                </div>

                <!-- Iteration fields -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="flex flex-col gap-3">
                        <Label for="currentIterationNumber">Current Iteration</Label>
                        <Input id="currentIterationNumber" name="currentIterationNumber" type="number" bind:value={currentIterationNumber} />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="maxIterations">Max Iterations</Label>
                        <Input id="maxIterations" name="maxIterations" type="number" bind:value={maxIterations} />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="iterationWarnAt">Warn At</Label>
                        <Input id="iterationWarnAt" name="iterationWarnAt" type="number" bind:value={iterationWarnAt} />
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <Label>Planned Schedule (Start - End)</Label>
                    <DatePickerWithRange bind:value={dateRange} />
                    <input type="hidden" name="startDate" value={startDateISO} />
                    <input type="hidden" name="endDate" value={endDateISO} />
                </div>

                <div class="flex flex-col gap-3">
                    <Label>Actual Schedule (Start - End)</Label>
                    <DatePickerWithRange bind:value={actualDateRange} />
                    <input type="hidden" name="actualStartDate" value={actualStartDateISO} />
                    <input type="hidden" name="actualEndDate" value={actualEndDateISO} />
                </div>

                <div class="flex flex-col gap-3">
                    <Label for="mainResponsible">Main Responsible</Label>
                    <div class="flex items-center gap-2">
                        {#if mainResponsibleId}
                            {#each users.filter((u)=>u.id===mainResponsibleId) as u}
                                <Avatar.Root class="size-8">
                                    <Avatar.Image src={u.avatarData} alt={u.email} />
                                    <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                </Avatar.Root>
                                <span>
                                    { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                        ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                        : (u.email ?? '') }
                                </span>
                            {/each}
                        {:else}
                            <span class="text-muted-foreground">No main responsible</span>
                        {/if}
                        <Dialog.Root>
                            <Dialog.Trigger asChild>
                                <Button variant="outline" size="sm">Change</Button>
                            </Dialog.Trigger>
                            <Dialog.Content class="max-w-xl">
                                <Dialog.Header>
                                    <Dialog.Title>Select Main Responsible</Dialog.Title>
                                </Dialog.Header>
                                <div class="grid gap-2 max-h-[50vh] overflow-y-auto">
                                    <button type="button" class="flex items-center gap-3 p-2 rounded hover:bg-muted text-left"
                                        on:click={() => { mainResponsibleId = null; }}>
                                        <div class="size-8 rounded-full grid place-items-center bg-muted text-xs font-medium">–</div>
                                        <span>(no main responsible)</span>
                                    </button>
                                    {#each users as u}
                                        <button type="button" class="flex items-center gap-3 p-2 rounded hover:bg-muted text-left"
                                            on:click={() => { mainResponsibleId = u.id; }}>
                                            <Avatar.Root class="size-8">
                                                <Avatar.Image src={u.avatarData} alt={u.email} />
                                                <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                            </Avatar.Root>
                                            <div class="flex flex-col">
                                                <span class="font-medium">
                                                    { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                                        ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                                        : (u.email ?? '') }
                                                </span>
                                                <span class="text-xs text-muted-foreground">{u.email}</span>
                                            </div>
                                        </button>
                                    {/each}
                                </div>
                                <Dialog.Footer>
                                    <Dialog.Close asChild>
                                        <Button type="button" variant="default">Done</Button>
                                    </Dialog.Close>
                                </Dialog.Footer>
                            </Dialog.Content>
                        </Dialog.Root>
                    </div>
                    <input type="hidden" name="mainResponsibleId" value={mainResponsibleId ?? ''} />
                </div>

                <div class="flex gap-4 items-center">
                    <Checkbox id="isActive" bind:checked={isActive} name="isActive" />
                    <Label for="isActive">Active</Label>

                    <Checkbox id="isDone" bind:checked={isDone} name="isDone" />
                    <Label for="isDone">Done</Label>
                </div>

                <Drawer.Footer class="px-0">
                    <Button type="submit">Save Changes</Button>
                    <Drawer.Close>
                        {#snippet child({ props })}
                            <Button type="button" variant="outline" {...props}>Cancel</Button>
                        {/snippet}
                    </Drawer.Close>
                </Drawer.Footer>
            </form>
        </div>
    </Drawer.Content>
</Drawer.Root>
