<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Chart from "$lib/components/ui/chart";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import Textarea from "$lib/components/ui/textarea/textarea.svelte";
    import * as Select from "$lib/components/ui/select";
    import { RangeCalendar } from "$lib/components/ui/range-calendar";
    import ProjectMetaCard from "$lib/components/molecules/projects/ProjectMetaCard.svelte";
    import { Minus as MinusIcon, Plus as PlusIcon } from "@lucide/svelte";
    import { CalendarDate } from "@internationalized/date";
    import { enhance } from "$app/forms";
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    const { 
        project, 
        contributions, 
        revenueData,
        priorities,
        states,
        riskLevels,
        users,
        taskStates,
        taskPriorities,
        taskTypes,
        metaTasks
    } = data;

    // Daily activity goal state
    let dailyGoal = $state(data.dailyGoal ?? 4); 
    function adjustGoal(amount: number) {
        dailyGoal = Math.max(0, Math.min(24, dailyGoal + amount));
    }

    // Severity Levels for Reporting
    const levels = [
        { label: "Severity 1 (Highest)", value: "1" },
        { label: "Severity 2", value: "2" },
        { label: "Severity 3", value: "3" },
        { label: "Severity 4 (Lowest)", value: "4" },
    ];
    let selectedSeverity = $state("2");
    const severityLabel = $derived(levels.find(l => l.value === selectedSeverity)?.label ?? "Select Level");

    // Project range for calendar
    const start = project.startDate ? new Date(project.startDate) : new Date();
    const end = project.endDate ? new Date(project.endDate) : new Date();
    let projectRange = $state({
        start: new CalendarDate(start.getFullYear(), start.getMonth() + 1, start.getDate()),
        end: new CalendarDate(end.getFullYear(), end.getMonth() + 1, end.getDate())
    });

</script>

<div class="flex flex-col gap-6 p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- Project Overview (Meta Card) -->
        <div class="lg:col-span-2">
            <ProjectMetaCard 
                {project} 
                activeProjectId={project.id} 
                currentUserId={data.user?.id}
                {priorities}
                {states}
                {riskLevels}
                {users}
                {taskStates}
                {taskPriorities}
                {taskTypes}
                {metaTasks}
            />
        </div>

        <!-- Schedule / Calendar -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Project Schedule</Card.Title>
                <Card.Description>Expected duration and deadlines</Card.Description>
            </Card.Header>
            <Card.Content class="flex justify-center">
                <RangeCalendar bind:value={projectRange} readonly />
            </Card.Content>
        </Card.Root>

        <!-- Revenue / Budget Tracking -->
        <Card.Root class="lg:col-span-1">
            <Card.Header>
                <Card.Title>Budget Tracking</Card.Title>
                <Card.Description>Estimated vs Actual Costs</Card.Description>
            </Card.Header>
            <Card.Content class="h-[250px]">
                 <!-- Using a simple bar representation if Chart is not fully available/complex -->
                 <div class="flex flex-col gap-4">
                    {#each revenueData as item}
                        <div class="space-y-1">
                            <div class="flex justify-between text-sm">
                                <span>{item.name}</span>
                                <span class="font-bold">${item.value.toLocaleString()}</span>
                            </div>
                            <div class="w-full bg-secondary h-4 rounded-full overflow-hidden">
                                <div 
                                    class="bg-primary h-full transition-all" 
                                    style="width: {Math.min(100, (item.value / (project.estimatedBudget || 1)) * 100)}%"
                                ></div>
                            </div>
                        </div>
                    {/each}
                 </div>
            </Card.Content>
        </Card.Root>

        <!-- Contribution Chart (Hours spent last 30 days) -->
        <Card.Root class="md:col-span-2">
            <Card.Header>
                <Card.Title>Contributions</Card.Title>
                <Card.Description>Hours spent over the last 30 days</Card.Description>
            </Card.Header>
            <Card.Content class="h-[300px]">
                {#if contributions.length > 0}
                    <div class="flex items-end gap-1 h-full w-full">
                        {#each contributions as entry}
                            <div 
                                class="bg-primary/60 hover:bg-primary transition-colors flex-1 rounded-t"
                                style="height: {(entry.hours / Math.max(...contributions.map(c => c.hours), 1)) * 100}%"
                                title="{entry.date}: {entry.hours.toFixed(1)}h"
                            ></div>
                        {/each}
                    </div>
                {:else}
                    <div class="flex items-center justify-center h-full text-muted-foreground">
                        No contribution data for the last 30 days.
                    </div>
                {/if}
            </Card.Content>
        </Card.Root>

        <!-- Daily Activity Goal -->
        <Card.Root>
            <Card.Header>
                <Card.Title>Daily Activity Goal</Card.Title>
                <Card.Description>Target hours for this project today</Card.Description>
            </Card.Header>
            <Card.Content>
                <form method="POST" action="?/updateDailyGoal" use:enhance>
                    <input type="hidden" name="dailyGoal" value={dailyGoal} />
                    <div class="flex items-center justify-center gap-6">
                        <Button variant="outline" size="icon" type="button" onclick={() => adjustGoal(-0.5)} disabled={dailyGoal <= 0}>
                            <MinusIcon class="h-4 w-4" />
                        </Button>
                        <div class="text-center">
                            <div class="text-5xl font-bold tabular-nums">{dailyGoal}</div>
                            <div class="text-xs uppercase text-muted-foreground">Hours / Day</div>
                        </div>
                        <Button variant="outline" size="icon" type="button" onclick={() => adjustGoal(0.5)} disabled={dailyGoal >= 24}>
                            <PlusIcon class="h-4 w-4" />
                        </Button>
                    </div>
                    <Card.Footer class="px-0 pt-6">
                        <Button type="submit" class="w-full" variant="secondary">Update Goal</Button>
                    </Card.Footer>
                </form>
            </Card.Content>
        </Card.Root>

        <!-- Report Issue Card -->
        <Card.Root class="lg:col-span-2">
            <Card.Header>
                <Card.Title>Report an Issue</Card.Title>
                <Card.Description>Encountered a problem with the project?</Card.Description>
            </Card.Header>
            <Card.Content>
                <form method="POST" action="?/reportIssue" class="flex flex-col gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label for="area">Area</Label>
                            <Input id="area" name="area" placeholder="e.g. Design, Backend, API" required />
                        </div>
                        <div class="space-y-2">
                            <Label for="severity">Severity Level</Label>
                            <Select.Root type="single" bind:value={selectedSeverity} name="severity">
                                <Select.Trigger class="w-full">
                                    {severityLabel}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each levels as level}
                                        <Select.Item value={level.value}>{level.label}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label for="subject">Subject</Label>
                        <Input id="subject" name="subject" placeholder="Summary of the issue" required />
                    </div>
                    <div class="space-y-2">
                        <Label for="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Detailed details..." required />
                    </div>
                    <div class="flex justify-end gap-2">
                        <Button type="submit">Submit Report</Button>
                    </div>
                </form>
            </Card.Content>
        </Card.Root>

    </div>
</div>
