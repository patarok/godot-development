<script lang="ts">
    import { Card, CardHeader, CardAction, CardDescription, CardTitle, CardContent, CardFooter } from "$lib/components/ui/card";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "@sveltejs/kit";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as HoverCard from "$lib/components/ui/hover-card/index.js";
    import { formatCurrencyInt } from '$lib/utils/formatCurrency';
    import { clampToWordCount } from '$lib/utils/clampToX';
    import { dateMat } from '$lib/utils/dateMat';
    import { Badge } from "$lib/components/ui/badge/index.js";
    import TrendingUpIcon from "@tabler/icons-svelte/icons/trending-up";
    import { IconMoneybag } from "@tabler/icons-svelte";
    import { IconMoneybagMinus } from "@tabler/icons-svelte";
    import { IconHourglass } from "@tabler/icons-svelte";
    import { IconHourglassFilled } from "@tabler/icons-svelte";
    import { IconCalendarPlus } from "@tabler/icons-svelte";
    import { IconEyeBolt } from "@tabler/icons-svelte";
    import { IconCalendarOff } from "@tabler/icons-svelte";
    import { IconPlus } from "@tabler/icons-svelte";
    import ProjectDataViewer from './ProjectDataViewer.svelte';
    import TaskCreateForm from '$lib/components/molecules/tasks/TaskCreateForm.svelte';

    let {
        class: className,
        method = "POST",
        action,
        enhanceForm = false,
        enhanceCallback = undefined,
        project,
        priorities = [],
        states = [],
        riskLevels = [],
        users = [],
        taskStates = [],
        taskPriorities = [],
        taskTypes = [],
        metaTasks = [],
        activeProjectId = null,
        currentUserId = null
    }: {
        class?: string;
        method?: string;
        action?: string;
        enhanceForm?: boolean;
        enhanceCallback?: SubmitFunction;
        project: {
            id: string;
            creator: {
                id: string;
                email?: string;
                forename: string;
                surname?: string;
                username?: string;
                avatarData?: string;
            }
            avatarData?: string;
            title: string;
            description?: string;
            estimatedBudget?: number;
            estimatedHours?: number;
            actualHours?: number;
            actualCost?: number;
            startDate?: string;
            endDate?: string;
            actualStartDate?: string;
            actualEndDate?: string;
            involvedUsers?: Array<{
                id: string;
                email: string;
                username?: string | null;
                displayName?: string;
                avatarData?: string | null;
                flags: {
                    projectAssigned?: boolean;
                    projectResponsible?: boolean;
                    modifiedProject?: boolean;
                    modifiedTasksInProject?: boolean;
                    currentlyWorksOnTasksInProject?: boolean;
                    assignedToOpenTasksInProject?: boolean;
                };
            }>;
        };
        priorities?: Array<{ id: string; name: string }>;
        states?: Array<{ id: string; name: string }>;
        riskLevels?: Array<{ id: string; name: string }>;
        users?: Array<{ id: string; email: string; forename?: string | null; surname?: string | null; username?: string | null; avatarData?: string | null }>;
        taskStates?: Array<{ id: string; name: string }>;
        taskPriorities?: Array<{ id: string; name: string }>;
        taskTypes?: Array<{ id: string; name: string }>;
        metaTasks?: Array<{ id: string; title: string }>;
        activeProjectId?: string | null;
        currentUserId?: string | null;
    } = $props();

    const isCurrentlyActive = $derived(activeProjectId === project.id);
    const isUserInvolved = $derived(project.involvedUsers?.some(u => u.id === currentUserId) || project.creator?.id === currentUserId);

    const projectWorth = $derived(formatCurrencyInt((project.estimatedBudget * 1.2), 'en-US', 'USD'));
    const projectActualCost = $derived(formatCurrencyInt(project.actualCost, 'en-US', 'USD'));
    const projectDescription = $derived(clampToWordCount(project.description, 9));
    const projectStartDate = dateMat(project.startDate,'EUR');

    const whatIsIt = projectStartDate;


    </script>

<Card class={"w-full max-w-xl " + (className ?? "")}>
        <CardHeader>
            <CardTitle class="text-lg font-bold flex">
                <button type="button" class="inline-flex items-center gap-2" title={project.title}>
                    <Avatar.Root class="size-8 mr-2">
                        <Avatar.Image src={project.avatarData} alt={project.title} />
                        <Avatar.Fallback><span class="uppercase rounded-full border border-gray-400 p-2">{project.title[0]}{(project.creator?.surname?.[0] ?? project.creator?.forename?.[0] ?? '')}</span></Avatar.Fallback>
                    </Avatar.Root>

                </button>
                {project.title}
            </CardTitle>

            <CardDescription>{projectDescription}</CardDescription>
            <CardAction class="flex-col flex max-w-full">
                <Badge variant="outline" class="mx-auto">
                    <IconMoneybag />
                    {projectWorth}
                </Badge>
                <Badge variant="outline" class="mt-2 mx-auto">
                    <IconMoneybagMinus />
                    {projectActualCost}
                </Badge>
                <Badge class="mt-2 max-w-[6rem]  mx-auto" variant="outline">
                    <span class="flex-col flex m-2 max-w-full">
                    <Avatar.Root class="size-8 mr-2 mx-auto">

                        <Avatar.Image src={project.creator?.avatarData} alt={project.title} />
                        <Avatar.Fallback><span class="uppercase rounded-full border border-gray-400 p-2">{(project.creator?.forename?.[0] ?? '')}{(project.creator?.surname?.[0] ?? '')}</span></Avatar.Fallback>
                    </Avatar.Root>
                        <div class="whitespace-normal max-w-full">
                    {project.creator?.username ?? project.creator?.email ?? 'Unknown'}</div>
                    </span>
                </Badge>
            </CardAction>
        </CardHeader>

        <CardContent class="space-y-4 flex-col items-start gap-1.5 text-sm">
            {#if project.involvedUsers && project.involvedUsers.length}
            <CardDescription>
                <u>INVOLVED USERS</u>
            </CardDescription>
            <div class="mt-3 flex -space-x-2">
                {#each project.involvedUsers as u (u.id)}
                <div class="relative group inline-block">
                    <img
                    src={u.avatarData ? u.avatarData : '/fallback-avatar.svg'}
                    alt={u.displayName ?? u.email}
                    class="h-8 w-8 rounded-full ring-2 ring-background object-cover"
                    />
                    <div class="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                    <div class="font-semibold">{u.displayName ?? u.email}</div>
                    <ul class="mt-1">
                        {#if u.flags.projectAssigned}<li>Assigned to project</li>{/if}
                        {#if u.flags.projectResponsible}<li>Responsible for project</li>{/if}
                        {#if u.flags.modifiedProject}<li>Has modified project</li>{/if}
                        {#if u.flags.modifiedTasksInProject}<li>Has worked on tasks</li>{/if}
                        {#if u.flags.currentlyWorksOnTasksInProject}<li>Currently works on tasks</li>{/if}
                        {#if u.flags.assignedToOpenTasksInProject}<li>Assigned to open tasks</li>{/if}
                    </ul>
                    </div>
                </div>
                {/each}
            </div>
            {/if}
            <CardDescription>
                TODO: <br> - show No of open tasks <br> - show No of in progress tasks <br> - show No of closed tasks <br> - show No of blocked tasks
            </CardDescription>
            <CardAction>
            <Badge variant="outline">
                <IconHourglass />
                {project.estimatedHours}h
            </Badge>
            <Badge variant="outline">
                <IconHourglassFilled />
                {project.actualHours}h
            </Badge>
            </CardAction>
            <CardAction>
                <Badge variant="outline">
                    <IconCalendarPlus />
                    {dateMat(project.startDate, 'EUR')}
                </Badge>
                <Badge variant="outline">
                    <IconCalendarOff />
                    {dateMat(project.endDate, 'EUR')}
                </Badge>
            </CardAction>
        </CardContent>

        <CardFooter class="relative flex justify-between mt-4">
            {#if isUserInvolved}
                {#if isCurrentlyActive}
                    <Badge variant="default" class="h-10 px-4 gap-2">
                        <IconEyeBolt class="h-5 w-5" />
                        Active
                    </Badge>
                {:else}
                    <form method="POST" action="/projects?/setActiveProject" use:enhance>
                        <input type="hidden" name="projectId" value={project.id} />
                        <Button type="submit" size="sm" variant="outline" class="h-10 px-4 gap-2">
                            <IconEyeBolt class="h-5 w-5 text-muted-foreground" />
                            Set Active
                        </Button>
                    </form>
                {/if}
            {:else}
                <div class="w-10"></div> <!-- Placeholder to keep layout -->
            {/if}

            <div class="">
            <ProjectDataViewer
                {project}
                action={action ?? "?/update"}
                {priorities}
                {states}
                {riskLevels}
                {users}
            />
            </div>
            <div class="">
                <TaskCreateForm
                    action="/tasks?/create"
                    enhanceForm={true}
                    {enhanceCallback}
                    states={taskStates}
                    priorities={taskPriorities}
                    {users}
                    tasks={metaTasks}
                    projects={[{ id: project.id, title: project.title, description: project.description, avatarData: project.avatarData }]}
                    types={taskTypes}
                    prefilledProjectId={project.id}
                >
                    {#snippet trigger(props)}
                        <Button
                            type="button"
                            size="icon"
                            class="h-10 w-10 rounded-full shadow-lg"
                            {...props}
                        >
                            <IconPlus class="h-5 w-5" />
                        </Button>
                    {/snippet}
                </TaskCreateForm>
            </div>
        </CardFooter>

</Card>
