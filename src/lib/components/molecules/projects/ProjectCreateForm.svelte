<script lang="ts">
    import { enhance } from '$app/forms';
    import { tick } from 'svelte';
    import type { SubmitFunction } from '@sveltejs/kit';
    import { getLocalTimeZone } from '@internationalized/date';
    import type { DateRange } from 'bits-ui';

    import * as Drawer from '$lib/components/ui/drawer/index.js';
    import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
    import DatePickerWithRange from '$lib/components/date-picker-with-range.svelte';
    import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Checkbox } from '$lib/components/ui/checkbox/index.js';
    import * as Select from '$lib/components/ui/select/index.js';
    import { Separator } from '$lib/components/ui/separator/index.js';
    import * as Avatar from '$lib/components/ui/avatar/index.js';
    import * as HoverCard from '$lib/components/ui/hover-card/index.js';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import { Alert } from '$lib/components/ui/alert/index.js';
    import {IconPlus} from "@tabler/icons-svelte";

    let {
        action,
        enhanceForm = true,
        enhanceCallback = null,
        priorities = [],
        states = [],
        riskLevels = [],
        users = [],
        ...restProps
    }: {
        action: string;
        enhanceForm?: boolean;
        enhanceCallback?: SubmitFunction | null;
        priorities?: Array<{ id: string; name: string }>;
        states?: Array<{ id: string; name: string }>;
        riskLevels?: Array<{ id: string; name: string }>;
        users?: Array<{ id: string; email: string; forename?: string | null; surname?: string | null; username?: string | null; avatarData?: string | null }>;
    } = $props();

    const isMobile = new IsMobile();

    function initials(of: { forename?: string | null; surname?: string | null; username?: string | null; email?: string }): string {
        const f = (of.forename ?? '').trim();
        const s = (of.surname ?? '').trim();
        if (f || s) return `${f[0] ?? ''}${s[0] ?? ''}`.toUpperCase();
        const un = (of.username ?? of.email ?? '').trim();
        const parts = un.split(/[^a-zA-Z0-9]+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return (un[0] ?? '?').toUpperCase();
    }

    // Form state (Svelte 5 runes)
    let form = $state<any>();
    let title = $state('');
    let description = $state('');

    // Required/known fields
    let projectStatusId = $state<string | ''>('');
    let priorityId = $state<string | ''>('');
    let riskLevelId = $state<string | ''>('');
    let mainResponsibleId = $state<string | null>(null);
    let assignedUserIds = $state<string[]>([]);
    let responsibleUserIds = $state<string[]>([]);
    let isDone = $state(false);
    let isActive = $state(true);

    // Budget and hours
    let estimatedBudget = $state<string>('');
    let actualCost = $state<string>('');
    let estimatedHours = $state<string>('');
    let actualHours = $state<string>('');
    let currentIterationNumber = $state<string>('0');
    let maxIterations = $state<string>('');
    let iterationWarnAt = $state<string>('');

    // Dates
    let dateRange = $state<DateRange | undefined>(undefined);
    let actualDateRange = $state<DateRange | undefined>(undefined);
    const startDateISO = $derived(dateRange?.start ? dateRange.start.toDate(getLocalTimeZone()).toISOString() : '');
    const endDateISO = $derived(dateRange?.end ? dateRange.end.toDate(getLocalTimeZone()).toISOString() : '');
    const actualStartDateISO = $derived(actualDateRange?.start ? actualDateRange.start.toDate(getLocalTimeZone()).toISOString() : '');
    const actualEndDateISO = $derived(actualDateRange?.end ? actualDateRange.end.toDate(getLocalTimeZone()).toISOString() : '');

    const enhanceWithForm = () => {
        return async ({ result, update }) => {
            form = result?.data;
            await update();

            if (result?.data?.success && enhanceCallback) {
                await tick();
                enhanceCallback({ result, update });

                title = '';
                description = '';
                projectStatusId = '';
                priorityId = '';
                riskLevelId = '';
                mainResponsibleId = null;
                assignedUserIds = [];
                responsibleUserIds = [];
                isDone = false;
                isActive = true;
                estimatedBudget = '';
                actualCost = '';
                estimatedHours = '';
                actualHours = '';
                currentIterationNumber = '0';
                maxIterations = '';
                iterationWarnAt = '';
                dateRange = undefined;
                actualDateRange = undefined;
            }
        };
    };

    // Guard: only submit on explicit submitter
    function handleFormSubmit(e: SubmitEvent) {
        const submitter = (e as any).submitter;
        if (!submitter || submitter.type !== 'submit') {
            e.preventDefault();
            return false;
        }
    }
</script>

<Drawer.Root direction={isMobile.current ? 'bottom' : 'right'}>
    <Drawer.Trigger>
        {#snippet child({ props })}
            <Button
                    type="button"
                    size="icon"
                    class="h-10 w-10 rounded-full shadow-lg"
                    {...props}
            >
                <IconPlus class="h-5 w-5" />
            </Button>
<!--            <Button type="button" variant="default" {...props}>New Project</Button>-->
        {/snippet}
    </Drawer.Trigger>

    <Drawer.Content>
        <Drawer.Header class="gap-1">
            <Drawer.Title>Create Project</Drawer.Title>
            <Drawer.Description>Fill in details for the new project</Drawer.Description>
        </Drawer.Header>

        <div class="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
            {#if form?.error}
                <Alert variant="destructive">{form.error}</Alert>
            {/if}

            <form
                    method="post"
                    use:enhance={enhanceForm ? enhanceWithForm : null}
                    action={action}
                    class="flex flex-col gap-4"
                    on:submit={handleFormSubmit}
            >
                <!-- Title/description -->
                <div class="flex flex-col gap-3">
                    <Label for="title">Title</Label>
                    <Input id="title" name="title" bind:value={title} required />
                </div>

                <div class="flex flex-col gap-3">
                    <Label for="description">Description</Label>
                    <Input id="description" name="description" bind:value={description} placeholder="Project overview" />
                </div>

                <!-- Status, Priority, Risk Level -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-3">
                        <Label for="status">Status</Label>
                        <Select.Root type="single" bind:value={projectStatusId} name="projectStatusId">
                            <Select.Trigger id="status" class="w-full">
                                {states.find((s) => s.id === projectStatusId)?.name ?? '(choose status)'}
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
                                {priorities.find((p) => p.id === priorityId)?.name ?? '(no priority)'}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="">(no priority)</Select.Item>
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
                            {riskLevels.find((r) => r.id === riskLevelId)?.name ?? '(no risk level)'}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="">(no risk level)</Select.Item>
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
                        <Input id="estimatedBudget" name="estimatedBudget" type="number" bind:value={estimatedBudget} placeholder="0" />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="actualCost">Actual Cost</Label>
                        <Input id="actualCost" name="actualCost" type="number" bind:value={actualCost} placeholder="0" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-3">
                        <Label for="estimatedHours">Estimated Hours</Label>
                        <Input id="estimatedHours" name="estimatedHours" type="number" bind:value={estimatedHours} placeholder="0" />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="actualHours">Actual Hours</Label>
                        <Input id="actualHours" name="actualHours" type="number" bind:value={actualHours} placeholder="0" />
                    </div>
                </div>

                <!-- Iteration fields -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="flex flex-col gap-3">
                        <Label for="currentIterationNumber">Current Iteration</Label>
                        <Input id="currentIterationNumber" name="currentIterationNumber" type="number" bind:value={currentIterationNumber} placeholder="0" />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="maxIterations">Max Iterations</Label>
                        <Input id="maxIterations" name="maxIterations" type="number" bind:value={maxIterations} placeholder="Optional" />
                    </div>
                    <div class="flex flex-col gap-3">
                        <Label for="iterationWarnAt">Warn At</Label>
                        <Input id="iterationWarnAt" name="iterationWarnAt" type="number" bind:value={iterationWarnAt} placeholder="Optional" />
                    </div>
                </div>

                <!-- Planned schedule -->
                <div class="flex flex-col gap-3">
                    <Label>Planned Schedule (Start - End)</Label>
                    <DatePickerWithRange bind:value={dateRange} />
                    <input type="hidden" name="startDate" value={startDateISO} />
                    <input type="hidden" name="endDate" value={endDateISO} />
                </div>

                <!-- Actual schedule -->
                <div class="flex flex-col gap-3">
                    <Label>Actual Schedule (Start - End)</Label>
                    <DatePickerWithRange bind:value={actualDateRange} />
                    <input type="hidden" name="actualStartDate" value={actualStartDateISO} />
                    <input type="hidden" name="actualEndDate" value={actualEndDateISO} />
                </div>

                <!-- Main responsible -->
                {#if users?.length}
                    <div class="flex flex-col gap-3">
                        <Label for="mainResponsible">Main Responsible</Label>
                        <div class="flex items-center gap-2">
                            {#if mainResponsibleId}
                                {#each users.filter((u)=>u.id===mainResponsibleId) as u}
                                    <HoverCard.Root>
                                        <HoverCard.Trigger asChild>
                                            <span class="inline-flex items-center gap-2">
                                                <Avatar.Root class="size-8">
                                                    <Avatar.Image src={u.avatarData} alt={u.email} />
                                                    <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                                </Avatar.Root>
                                                <span>
                                                    { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                                        ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                                        : (u.email ?? '') }
                                                </span>
                                            </span>
                                        </HoverCard.Trigger>
                                        <HoverCard.Content class="w-80">
                                            <div class="flex items-center gap-3">
                                                <Avatar.Root class="size-10">
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
                                            </div>
                                        </HoverCard.Content>
                                    </HoverCard.Root>
                                {/each}
                            {:else}
                                <span class="text-muted-foreground">No main responsible</span>
                            {/if}

                            <Dialog.Root>
                                <Dialog.Trigger asChild>
                                    <a
                                            href="#"
                                            role="button"
                                            class={buttonVariants({ variant: 'outline', size: 'sm' })}
                                            preventdefault:click
                                    >Change</a>
                                </Dialog.Trigger>
                                <Dialog.Content class="max-w-xl">
                                    <Dialog.Header>
                                        <Dialog.Title>Select Main Responsible</Dialog.Title>
                                    </Dialog.Header>

                                    <!-- Radio list with avatars + hovercards -->
                                    <div class="grid gap-2 max-h-[50vh] overflow-y-auto">
                                        <label class="flex items-center gap-3 p-2 rounded hover:bg-muted" >
                                            <input class="hidden" type="radio" name="responsible-radio" value="" bind:group={mainResponsibleId} />
                                            <span>(no main responsible)</span>
                                        </label>

                                        {#each users as u}
                                            <label class="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                                <input class="hidden" type="radio" name="responsible-radio" value={(u as any).id} bind:group={mainResponsibleId} />
                                                <HoverCard.Root>
                                                    <HoverCard.Trigger asChild>
                                                        <span class="inline-flex items-center gap-2">
                                                            <Avatar.Root class="size-7">
                                                                <Avatar.Image src={u.avatarData} alt={u.email} />
                                                                <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                                            </Avatar.Root>
                                                            <span>
                                                                { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                                                    ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                                                    : (u.email ?? '') }
                                                            </span>
                                                        </span>
                                                    </HoverCard.Trigger>
                                                    <HoverCard.Content class="w-80">
                                                        <div class="flex items-center gap-3">
                                                            <Avatar.Root class="size-10">
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
                                                        </div>
                                                    </HoverCard.Content>
                                                </HoverCard.Root>
                                            </label>
                                        {/each}
                                    </div>

                                    <Dialog.Footer>
                                        <Dialog.Close asChild>
                                            <a
                                                    href="#"
                                                    role="button"
                                                    class={buttonVariants({ variant: 'default' })}
                                                    preventdefault:click
                                            >Done</a>
                                        </Dialog.Close>
                                    </Dialog.Footer>
                                </Dialog.Content>
                            </Dialog.Root>
                        </div>
                        <input type="hidden" name="mainResponsibleId" value={mainResponsibleId ?? ''} />
                    </div>
                {/if}

                <!-- Assigned Users -->
                {#if users?.length}
                    <div class="flex flex-col gap-3">
                        <Label>Assigned Users</Label>
                        <div class="flex flex-wrap items-center gap-2">
                            {#each assignedUserIds as uid}
                                {#each users.filter(u => (u as any).id === uid) as u}
                                    <HoverCard.Root>
                                        <HoverCard.Trigger asChild>
                                            <span class="inline-flex items-center gap-2 rounded border px-2 py-0.5 text-xs">
                                                <Avatar.Root class="size-6">
                                                    <Avatar.Image src={u.avatarData} alt={u.email} />
                                                    <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                                </Avatar.Root>
                                                <span>
                                                    { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                                        ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                                        : (u.email ?? '') }
                                                </span>
                                            </span>
                                        </HoverCard.Trigger>
                                        <HoverCard.Content class="w-80">
                                            <div class="flex items-center gap-3">
                                                <Avatar.Root class="size-10">
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
                                            </div>
                                        </HoverCard.Content>
                                    </HoverCard.Root>
                                {/each}
                            {/each}

                            <Dialog.Root>
                                <Dialog.Trigger asChild>
                                    <a
                                            href="#"
                                            role="button"
                                            class={buttonVariants({ variant: 'outline', size: 'sm' })}
                                            preventdefault:click
                                    >Manage</a>
                                </Dialog.Trigger>
                                <Dialog.Content class="max-w-2xl">
                                    <Dialog.Header>
                                        <Dialog.Title>Assign Users</Dialog.Title>
                                    </Dialog.Header>

                                    <!-- Checkbox group with avatars + hovercards -->
                                    <div class="grid gap-2 max-h-[50vh] overflow-y-auto">
                                        {#each users as u}
                                            <label class="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                                <input  class="hidden"
                                                        type="checkbox"
                                                        value={(u as any).id}
                                                        bind:group={assignedUserIds}
                                                />
                                                <HoverCard.Root>
                                                    <HoverCard.Trigger asChild>
                                                        <span class="inline-flex items-center gap-2">
                                                            <Avatar.Root class="size-7">
                                                                <Avatar.Image src={u.avatarData} alt={u.email} />
                                                                <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                                            </Avatar.Root>
                                                            <span>
                                                                { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                                                    ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                                                    : (u.email ?? '') }
                                                            </span>
                                                        </span>
                                                    </HoverCard.Trigger>
                                                    <HoverCard.Content class="w-80">
                                                        <div class="flex items-center gap-3">
                                                            <Avatar.Root class="size-10">
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
                                                        </div>
                                                    </HoverCard.Content>
                                                </HoverCard.Root>
                                            </label>
                                        {/each}
                                    </div>

                                    <Dialog.Footer>
                                        <Dialog.Close asChild>
                                            <a
                                                    href="#"
                                                    role="button"
                                                    class={buttonVariants({ variant: 'default' })}
                                                    preventdefault:click
                                            >Done</a>
                                        </Dialog.Close>
                                    </Dialog.Footer>
                                </Dialog.Content>
                            </Dialog.Root>
                        </div>

                        {#each assignedUserIds as uid}
                            <input type="hidden" name="assignedUserIds" value={uid} />
                        {/each}
                    </div>
                {/if}

                <!-- Responsible Users -->
                {#if users?.length}
                    <div class="flex flex-col gap-3">
                        <Label>Responsible Users</Label>
                        <div class="flex flex-wrap items-center gap-2">
                            {#each responsibleUserIds as uid}
                                {#each users.filter(u => (u as any).id === uid) as u}
                                    <HoverCard.Root>
                                        <HoverCard.Trigger asChild>
                                            <span class="inline-flex items-center gap-2 rounded border px-2 py-0.5 text-xs">
                                                <Avatar.Root class="size-6">
                                                    <Avatar.Image src={u.avatarData} alt={u.email} />
                                                    <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                                </Avatar.Root>
                                                <span>
                                                    { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                                        ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                                        : (u.email ?? '') }
                                                </span>
                                            </span>
                                        </HoverCard.Trigger>
                                        <HoverCard.Content class="w-80">
                                            <div class="flex items-center gap-3">
                                                <Avatar.Root class="size-10">
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
                                            </div>
                                        </HoverCard.Content>
                                    </HoverCard.Root>
                                {/each}
                            {/each}

                            <Dialog.Root>
                                <Dialog.Trigger asChild>
                                    <a
                                            href="#"
                                            role="button"
                                            class={buttonVariants({ variant: 'outline', size: 'sm' })}
                                            preventdefault:click
                                    >Manage</a>
                                </Dialog.Trigger>
                                <Dialog.Content class="max-w-2xl">
                                    <Dialog.Header>
                                        <Dialog.Title>Assign Responsible Users</Dialog.Title>
                                    </Dialog.Header>

                                    <!-- Checkbox group with avatars + hovercards -->
                                    <div class="grid gap-2 max-h-[50vh] overflow-y-auto">
                                        {#each users as u}
                                            <label class="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                                <input  class="hidden"
                                                        type="checkbox"
                                                        value={(u as any).id}
                                                        bind:group={responsibleUserIds}
                                                />
                                                <HoverCard.Root>
                                                    <HoverCard.Trigger asChild>
                                                        <span class="inline-flex items-center gap-2">
                                                            <Avatar.Root class="size-7">
                                                                <Avatar.Image src={u.avatarData} alt={u.email} />
                                                                <Avatar.Fallback>{initials(u)}</Avatar.Fallback>
                                                            </Avatar.Root>
                                                            <span>
                                                                { ((u.forename ?? '').trim() || (u.surname ?? '').trim())
                                                                    ? `${(u.forename ?? '').trim()} ${(u.surname ?? '').trim()}`
                                                                    : (u.email ?? '') }
                                                            </span>
                                                        </span>
                                                    </HoverCard.Trigger>
                                                    <HoverCard.Content class="w-80">
                                                        <div class="flex items-center gap-3">
                                                            <Avatar.Root class="size-10">
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
                                                        </div>
                                                    </HoverCard.Content>
                                                </HoverCard.Root>
                                            </label>
                                        {/each}
                                    </div>

                                    <Dialog.Footer>
                                        <Dialog.Close asChild>
                                            <a
                                                    href="#"
                                                    role="button"
                                                    class={buttonVariants({ variant: 'default' })}
                                                    preventdefault:click
                                            >Done</a>
                                        </Dialog.Close>
                                    </Dialog.Footer>
                                </Dialog.Content>
                            </Dialog.Root>
                        </div>

                        {#each responsibleUserIds as uid}
                            <input type="hidden" name="responsibleUserIds" value={uid} />
                        {/each}
                    </div>
                {/if}

                <!-- Flags -->
                <div class="flex gap-4 items-center">
                    <Checkbox id="isDone-create" bind:checked={isDone} name="isDone" />
                    <Label for="isDone-create">Done</Label>

                    <Checkbox id="isActive-create" bind:checked={isActive} name="isActive" />
                    <Label for="isActive-create">Active</Label>
                </div>

                <Separator />

                <Drawer.Footer class="px-0">
                    <Button type="submit">Create Project</Button>
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
