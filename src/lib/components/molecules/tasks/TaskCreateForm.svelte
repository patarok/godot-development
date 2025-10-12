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

    let {
        action,
        enhanceForm = true,
        enhanceCallback = null,
        priorities = [],
        states = [],
        users = [],
        tasks = [],
        projects = [],
        types = [],
        prefilledProjectId = null,
        trigger,
        ...restProps
    }: {
        action: string;
        enhanceForm?: boolean;
        enhanceCallback?: SubmitFunction | null;
        priorities?: Array<{ id: string; name: string }>;
        states?: Array<{ id: string; name: string }>;
        users?: Array<{ id: string; email: string; forename?: string | null; surname?: string | null; username?: string | null; avatarData?: string | null }>;
        tasks?: Array<{ id: string; title: string }>;
        projects?: Array<{ id: string; title: string; avatarData?: string }>;
        types?: Array<{ id: string; name: string }>;
        prefilledProjectId?: string | null;
        trigger?: any;
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

    function projectInitials(title?: string | null): string {
        const t = (title ?? '').trim();
        if (!t) return '?';
        const parts = t.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return (parts[0][0] ?? '?').toUpperCase();
    }

    // Form state (Svelte 5 runes)
    let form = $state<any>();
    let header = $state('');
    let description = $state('');

    // Optional type
    let typeId = $state<string | null>(null);
    const selectedTypeName = $derived(types?.find(t => t.id === typeId)?.name ?? null);

    // Required/known fields
    let taskStatusId = $state<string | ''>('');
    let priorityId = $state<string | ''>('');
    let projectId = $state<string | null>(prefilledProjectId ?? null);
    let mainAssigneeId = $state<string | null>(null);
    let assignedUserIds = $state<string[]>([]);
    let isDone = $state(false);
    let isActive = $state(true);
    let isMeta = $state(false);
    let parentTaskId = $state<string | ''>('');
    let tagsCSV = $state('');

    // Dates
    let dateRange = $state<DateRange | undefined>(undefined);
    const plannedStartISO = $derived(dateRange?.start ? dateRange.start.toDate(getLocalTimeZone()).toISOString() : '');
    const dueDateISO = $derived(dateRange?.end ? dateRange.end.toDate(getLocalTimeZone()).toISOString() : '');

    const enhanceWithForm = () => {
        return async ({ result, update }) => {
            form = result?.data;
            await update();

            if (result?.data?.success && enhanceCallback) {
                await tick();
                enhanceCallback({ result, update });

                header = '';
                description = '';
                typeId = null;
                taskStatusId = '';
                priorityId = '';
                projectId = null;
                mainAssigneeId = null;
                assignedUserIds = [];
                isDone = false;
                isActive = true;
                isMeta = false;
                parentTaskId = '';
                tagsCSV = '';
                dateRange = undefined;
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
            {#if trigger}
                {@render trigger(props)}
            {:else}
                <Button type="button" variant="default" {...props}>New Task</Button>
            {/if}
        {/snippet}
    </Drawer.Trigger>

    <Drawer.Content>
        <Drawer.Header class="gap-1">
            <Drawer.Title>Create Task</Drawer.Title>
            <Drawer.Description>Fill in details for the new task</Drawer.Description>
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
                    <Label for="header">Title</Label>
                    <Input id="header" name="title" bind:value={header} required />
                </div>

                <div class="flex flex-col gap-3">
                    <Label for="description">Description</Label>
                    <Input id="description" name="description" bind:value={description} placeholder="What should be done?" />
                </div>

                <!-- Type (optional), Status -->
                <div class="grid grid-cols-2 gap-4">
                    {#if types?.length}
                        <div class="flex flex-col gap-3">
                            <Label for="type">Type</Label>
                            <Select.Root type="single" bind:value={typeId} name="typeId">
                                <Select.Trigger id="type" class="w-full">
                                    {selectedTypeName ?? 'Select a type'}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each types as t}
                                        <Select.Item value={t.id}>{t.name}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    {/if}

                    <div class="flex flex-col gap-3">
                        <Label for="status">State</Label>
                        <Select.Root type="single" bind:value={taskStatusId} name="taskStatusId">
                            <Select.Trigger id="status" class="w-full">
                                {states.find((s) => s.id === taskStatusId)?.name ?? '(choose state)'}
                            </Select.Trigger>
                            <Select.Content>
                                {#each states as s}
                                    <Select.Item value={s.id}>{s.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>

                <!-- Priority -->
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

                <!-- Project -->
                {#if projects?.length}
                    <div class="flex flex-col gap-3">
                        <Label for="assignedProject">Assigned Project</Label>
                        <div class="flex items-center gap-2">
                            {#if projectId}
                                {#each projects.filter((p)=>p.id===projectId) as proj}
                                    <HoverCard.Root>
                                        <HoverCard.Trigger asChild>
                                            <button type="button" class="inline-flex items-center gap-2" title={proj.title}>
                                                <Avatar.Root class="size-8">
                                                    <Avatar.Image src={proj.avatarData} alt={proj.title} />
                                                    <Avatar.Fallback>{projectInitials(proj.title)}</Avatar.Fallback>
                                                </Avatar.Root>
                                                <span>{proj.title}</span>
                                            </button>
                                        </HoverCard.Trigger>
                                        <HoverCard.Content class="w-80">
                                            <div class="flex items-center gap-3">
                                                <Avatar.Root class="size-10">
                                                    <Avatar.Image src={proj.avatarData} alt={proj.title} />
                                                    <Avatar.Fallback>{projectInitials(proj.title)}</Avatar.Fallback>
                                                </Avatar.Root>
                                                <div class="flex flex-col">
                                                    <span class="font-medium">{proj.title}</span>
                                                </div>
                                            </div>
                                        </HoverCard.Content>
                                    </HoverCard.Root>
                                {/each}
                            {:else}
                                <span class="text-muted-foreground">No project</span>
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
                                        <Dialog.Title>Select Project</Dialog.Title>
                                    </Dialog.Header>

                                    <!-- Radio list with avatars + hovercards -->
                                    <div class="grid gap-2 max-h-[50vh] overflow-y-auto">
                                        <label class="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                            <input class="hidden" type="radio" name="project-radio" value="" bind:group={projectId} />
                                            <span>(no project)</span>
                                        </label>
                                        {#each projects as proj}
                                            <label class="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                                <input class="hidden" type="radio" name="project-radio" value={proj.id} bind:group={projectId} />
                                                <HoverCard.Root>
                                                    <HoverCard.Trigger asChild>
                                                        <span class="inline-flex items-center gap-2">
                                                            <Avatar.Root class="size-7">
                                                                <Avatar.Image src={proj.avatarData} alt={proj.title} />
                                                                <Avatar.Fallback>{projectInitials(proj.title)}</Avatar.Fallback>
                                                            </Avatar.Root>
                                                            <span class="truncate">{proj.title}</span>
                                                        </span>
                                                    </HoverCard.Trigger>
                                                    <HoverCard.Content class="w-80">
                                                        <div class="flex items-center gap-3">
                                                            <Avatar.Root class="size-10">
                                                                <Avatar.Image src={proj.avatarData} alt={proj.title} />
                                                                <Avatar.Fallback>{projectInitials(proj.title)}</Avatar.Fallback>
                                                            </Avatar.Root>
                                                            <div class="flex flex-col">
                                                                <span class="font-medium">{proj.title}</span>
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
                        <input type="hidden" name="projectId" value={projectId ?? ''} />
                    </div>
                {/if}

                <!-- Planned schedule -->
                <div class="flex flex-col gap-3">
                    <Label>Planned Schedule</Label>
                    <DatePickerWithRange bind:value={dateRange} />
                    <input type="hidden" name="plannedStartDate" value={plannedStartISO} />
                    <input type="hidden" name="dueDate" value={dueDateISO} />
                </div>

                <!-- Main assignee -->
                {#if users?.length}
                    <div class="flex flex-col gap-3">
                        <Label for="mainAssignee">Main Assignee</Label>
                        <div class="flex items-center gap-2">
                            {#if mainAssigneeId}
                                {#each users.filter((u)=>u.id===mainAssigneeId) as u}
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
                                <span class="text-muted-foreground">No assignee</span>
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
                                        <Dialog.Title>Select Main Assignee</Dialog.Title>
                                    </Dialog.Header>

                                    <!-- Radio list with avatars + hovercards -->
                                    <div class="grid gap-2 max-h-[50vh] overflow-y-auto">
                                        <label class="flex items-center gap-3 p-2 rounded hover:bg-muted" >
                                            <input class="hidden" type="radio" name="assignee-radio" value="" bind:group={mainAssigneeId} />
                                            <span>(no assignee)</span>
                                        </label>

                                        {#each users as u}
                                            <label class="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                                <input class="hidden" type="radio" name="assignee-radio" value={(u as any).id} bind:group={mainAssigneeId} />
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
                        <input type="hidden" name="mainAssigneeId" value={mainAssigneeId ?? ''} />
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
                            <input type="hidden" name="assignedUserIds[]" value={uid} />
                        {/each}
                    </div>
                {/if}

                <!-- Flags and parent -->
                <div class="flex gap-4 items-center">
                    <Checkbox id="isDone-create" bind:checked={isDone} name="isDone" />
                    <Label for="isDone-create">Done</Label>

                    <Checkbox id="isActive-create" bind:checked={isActive} name="isActive" />
                    <Label for="isActive-create">Active</Label>

                    <Checkbox id="isMeta-create" bind:checked={isMeta} name="isMeta" />
                    <Label for="isMeta-create">Meta task</Label>
                </div>

                {#if tasks?.length}
                    <div class="flex flex-col gap-3">
                        <Label for="parentTaskId">Parent task</Label>
                        <Select.Root type="single" name="parentTaskId" bind:value={parentTaskId}>
                            <Select.Trigger id="parentTaskId" class="w-full">
                                {tasks.find((t) => t.id === parentTaskId)?.title ?? '(no parent)'}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value="">(no parent)</Select.Item>
                                {#each tasks as t}
                                    <Select.Item value={t.id}>{t.title}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                {/if}

                <!-- Tags -->
                <div class="flex flex-col gap-3">
                    <Label for="tags">Tags (comma-separated)</Label>
                    <Input id="tags" name="tags" bind:value={tagsCSV} placeholder="tag1, tag2, tag3" />
                </div>

                <Separator />

                <Drawer.Footer class="px-0">
                    <Button type="submit">Create Task</Button>
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