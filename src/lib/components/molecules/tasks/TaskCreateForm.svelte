<script lang="ts">
    import { enhance } from '$app/forms';
    import { tick } from 'svelte';
    import type { SubmitFunction } from '@sveltejs/kit';

    import { Card } from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import { Select, SelectItem } from '$lib/components/ui/select';
    import { Alert } from '$lib/components/ui/alert';

    // Props via $props() für Runes Mode
    let {
        action,
        enhanceForm = true,
        enhanceCallback = null,
        priorities = [],
        states = [],
        users = [],
        tasks = [],
        ...restProps
    }: {
        action: string;
        enhanceForm?: boolean;
        enhanceCallback?: SubmitFunction | null;
        priorities?: Array<{ id: string; name: string }>;
        states?: Array<{ id: string; name: string }>;
        users?: Array<{ id: string; email: string }>;
        tasks?: Array<{ id: string; title: string }>;
    } = $props();

    // Form State (initialisiert alles, keine null Arrays/Strings)
    let title = $state('');
    let description = $state('');
    let dueDate = $state('');
    let startDate = $state('');
    let isDone = $state(false);
    let isActive = $state(true);
    let priorityId = $state<string | ''>('');
    let userId = $state<string | ''>('');
    let parentTaskId = $state<string | ''>('');
    let taskStateId = $state<string | ''>('');
    let projectId = $state('');
    let actualHours = $state<number | null>(null);
    let hasSegmentGroupCircle = $state(true);
    let tagsCSV = $state('');

    let form = $state();

    // Reusable enhance function
    const enhanceWithForm = () => {
        return async ({ result, update }) => {
            form = result.data;
            await update();

            if (result?.data?.success && enhanceCallback) {
                await tick();
                enhanceCallback({ result, update });

                // Reset Fields
                title = '';
                description = '';
                dueDate = '';
                startDate = '';
                isDone = false;
                isActive = true;
                priorityId = '';
                userId = '';
                parentTaskId = '';
                projectId = '';
                actualHours = null;
                tagsCSV = '';
                hasSegmentGroupCircle = true;
            }
        };
    };
</script>




<Card class="p-6 space-y-4">
    {#if form?.error}
        <Alert variant="destructive">{form.error}</Alert>
    {/if}

    <form method="post" use:enhance={enhanceForm ? enhanceWithForm : null} action={action} class="space-y-4">
        <div class="flex flex-col gap-2">
            <Label for="title">Title</Label>
            <Input id="title" name="title" bind:value={title} required />
        </div>

        <div class="flex flex-col gap-2">
            <Label>Description</Label>
            <Input placeholder="Task description" name="description" bind:value={description} />
        </div>

        <div class="flex flex-col gap-2">
            <Label>Due date</Label>
            <Input type="datetime-local" name="dueDate" bind:value={dueDate} required />
        </div>

        <div class="flex flex-col gap-2">
            <Label>Start date</Label>
            <Input type="datetime-local" name="startDate" bind:value={startDate} />
        </div>

        <div class="flex gap-4">
            <Checkbox id="isDone-taskCreateForm" bind:checked={isDone} name="isDone"/>
            <Label for="isDone-taskCreateForm">Done</Label>
            <Checkbox id="isActive-taskCreateForm" bind:checked={isActive} name="isActive"/>
            <Label for="isActive-taskCreateForm">Active</Label>
        </div>

        <div>
            <Label>State</Label>
            <Select name="taskStateId" bind:value={taskStateId} required>
                <SelectItem value="">(choose state)</SelectItem>
                {#each states as s}
                    <SelectItem value={s.id}>{s.name}</SelectItem>
                {/each}
            </Select>
        </div>

        <div>
            <Label>Priority</Label>
            <Select name="priorityId" bind:value={priorityId}>
                <SelectItem value="">(no priority)</SelectItem>
                {#each priorities as p}
                    <SelectItem value={p.id}>{p.name}</SelectItem>
                {/each}
            </Select>
        </div>

        <div>
            <Label>Active user</Label>
            <Select name="userId" bind:value={userId}>
                <SelectItem value="">(no active user)</SelectItem>
                {#each users as u}
                    <SelectItem value={u.id}>{u.email}</SelectItem>
                {/each}
            </Select>
        </div>

        <div>
            <Label>Parent task</Label>
            <Select name="parentTaskId" bind:value={parentTaskId}>
                <SelectItem value="">(no parent)</SelectItem>
                {#each tasks as t}
                    <SelectItem value={t.id}>{t.title}</SelectItem>
                {/each}
            </Select>
        </div>

        <div class="flex flex-col gap-2">
            <Label>Project ID</Label>
            <Input placeholder="Project ID (uuid)" name="projectId" bind:value={projectId} />
        </div>

        <div class="flex flex-col gap-2">
            <Label>Actual hours</Label>
            <Input type="number" placeholder="Actual hours" name="actualHours" bind:value={actualHours} />
        </div>

        <div class="flex gap-4">
            <Checkbox id="hasSegmentGroupCircle-taskCreateForm" bind:checked={hasSegmentGroupCircle} name="hasSegmentGroupCircle"/>
            <Label for="hasSegmentGroupCircle-taskCreateForm">Has segment-group circle</Label>
        </div>


        <div class="flex flex-col gap-2">
            <Label>Tags</Label>
            <Input placeholder="Comma separated tags" name="tags" bind:value={tagsCSV} />
        </div>

        <Button type="submit">Create Task</Button>
    </form>
</Card>
