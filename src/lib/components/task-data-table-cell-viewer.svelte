<script lang="ts">
	import { enhance } from '$app/forms';
	import TrendingUpIcon from "@tabler/icons-svelte/icons/trending-up";
	import { AreaChart } from "layerchart";
	import { scaleUtc } from "d3-scale";
	import { curveNatural } from "d3-shape";
	import { now, getLocalTimeZone } from '@internationalized/date';
	import { CalendarDate, parseDate } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import DatePickerWithRange from '$lib/components/date-picker-with-range.svelte';
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import type { TaskRowSchema } from "./schemas.js";

	type TimePoint = { date: Date | string; minutes: number };

	const isMobile = new IsMobile();

	// let { item, timeSeriesDaily, ...restProps }: { item: TaskRowSchema; timeSeriesDaily?: TimePoint[] } = $props();
	//
	// const { states, priorities, projects, users } = $derived(restProps);

	let {
		item,
		timeSeriesDaily,
		action = "?/update",
		priorities = [],
		states = [],
		users = [],
		projects = []
	}: {
		item: TaskRowSchema;
		timeSeriesDaily?: TimePoint[];
		action?: string;
		priorities?: Array<{ id: string; name: string }>;
		states?: Array<{ id: string; name: string }>;
		users?: Array<{ id: string; email: string }>;
		projects?: Array<{ id: string; name: string }>;
	} = $props();

	const seriesData = $derived(
			(timeSeriesDaily ?? []).map((d) => ({
				date: d.date instanceof Date ? d.date : new Date(d.date),
				minutes: d.minutes ?? 0,
			}))
	);

	const yMax = $derived(Math.max(60, ...(seriesData.length ? seriesData.map((d) => d.minutes) : [0])));

	function niceTop(v: number) {
		const step = v <= 60 ? 10 : v <= 180 ? 30 : 60;
		return Math.ceil((v * 1.1) / step) * step;
	}
	const yTop = $derived(niceTop(yMax));

	const chartConfig = {
		minutes: {
			label: "Logged minutes",
			color: "var(--primary)",
		},
	} satisfies Chart.ChartConfig;

	// Form state
	let header = $state(item.header);
	let type = $state(item.type);
	let description = $state(item.description);
	let status = $state(item.status);
	let priority = $state(item.priority);
	let assignedProject = $state(item.assignedProject);
	let mainAssignee = $state(item.mainAssignee);
	let isActive = $state(item.isActive);
	let reviewer = $state(item.reviewer);
	const totalMinutes = $derived(seriesData.reduce((sum, d) => sum + d.minutes, 0));

	const totalFormatted = $derived.by(() => {
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;
		if (hours === 0) return `${mins}m`;
		if (mins === 0) return `${hours}h`;
		return `${hours}h ${mins}m`;
	});

	// Handle assignedUsers array
	let assignedUsersStr = $state(
			Array.isArray(item.assignedUsers) ? item.assignedUsers.join(', ') : item.assignedUsers
	);

	// Handle tags array
	let tagsStr = $state(
			Array.isArray(item.tags) ? item.tags.join(', ') : item.tags
	);

	// Date range from plannedSchedule - convert to DateValue objects
	let dateRange = $state<DateRange | undefined>(
			item.plannedSchedule?.plannedStart && item.plannedSchedule?.plannedDue
					? {
						start: parseDate(new Date(item.plannedSchedule.plannedStart).toISOString().split('T')[0]),
						end: parseDate(new Date(item.plannedSchedule.plannedDue).toISOString().split('T')[0])
					}
					: undefined
	);

	const plannedStartISO = $derived.by(() => {
		const d = dateRange?.start;
		if (!d) return "";
		// DateValue objects have .toDate() method
		return d.toDate(getLocalTimeZone()).toISOString();
	});

	const dueDateISO = $derived.by(() => {
		const d = dateRange?.end;
		if (!d) return "";
		return d.toDate(getLocalTimeZone()).toISOString();
	});

	const typeOptions = [
		"Table of Contents",
		"Executive Summary",
		"Technical Approach",
		"Design",
		"Capabilities",
		"Focus Documents",
		"Narrative",
		"Cover Page"
	];
	
</script>

<Drawer.Root direction={isMobile.current ? "bottom" : "right"}>
	<Drawer.Trigger>
		{#snippet child({ props })}
			<Button variant="link" class="text-foreground w-fit px-0 text-left" {...props}>
				{item.header}
			</Button>
		{/snippet}
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="gap-1">
			<Drawer.Title>{item.header}</Drawer.Title>
			<Drawer.Description>Logged time over the last 60 days</Drawer.Description>
		</Drawer.Header>
		<div class="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
			{#if !isMobile.current}
				{#if seriesData.length}
					<Chart.Container config={chartConfig}>
						<AreaChart
								data={seriesData}
								x="date"
								xScale={scaleUtc()}
								yDomain={[0, yTop]}
								series={[
								{ key: "minutes", label: chartConfig.minutes.label, color: chartConfig.minutes.color },
							]}
								props={{
								area: {
									curve: curveNatural,
									"fill-opacity": 0.4,
									line: { class: "stroke-1" },
									motion: "tween",
								},
								xAxis: {
									format: (v) => v.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
								},
								yAxis: {},
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip
										labelFormatter={(v: Date) => v.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
										indicator="dot"
								/>
							{/snippet}
						</AreaChart>
					</Chart.Container>
				{:else}
					<div class="text-muted-foreground">No time entries in the last 60 days.</div>
				{/if}
				<Separator />
				<div class="grid gap-2">
					<div class="flex gap-2 font-medium leading-none">
						Time spent on task in TOTAL: {totalFormatted}
						<TrendingUpIcon class="size-4" />
					</div>
					<div class="text-muted-foreground">
						{description}
					</div>
				</div>
				<Separator />
			{/if}

			<form method="post" use:enhance action={action} class="flex flex-col gap-4">
				<!-- Hidden field for task ID -->
				<input type="hidden" name="id" value={item.id} />
				<input type="hidden" name="taskUuid" value={item.taskUuid} />

				<div class="flex flex-col gap-3">
					<Label for="header">Header</Label>
					<Input id="header" name="header" bind:value={header} required />
				</div>

				<div class="flex flex-col gap-3">
					<Label for="description">Description</Label>
					<Input id="description" name="description" bind:value={description} />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-3">
						<Label for="type">Type</Label>
						<Select.Root type="single" bind:value={type} name="type">
							<Select.Trigger id="type" class="w-full">
								{type ?? "Select a type"}
							</Select.Trigger>
							<Select.Content>
								{#each typeOptions as typeOpt}
									<Select.Item value={typeOpt}>{typeOpt}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-3">
						<Label for="status">Status</Label>
						<Select.Root type="single" bind:value={status} name="status">
							<Select.Trigger id="status" class="w-full">
								{status ?? "Select a status"}
							</Select.Trigger>
							<Select.Content>
								{#if states.length}
									{#each states as s}
										<Select.Item value={s.name}>{s.name}</Select.Item>
									{/each}
								{:else}
									<Select.Item value="Done">Done</Select.Item>
									<Select.Item value="In Progress">In Progress</Select.Item>
									<Select.Item value="Not Started">Not Started</Select.Item>
								{/if}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="flex flex-col gap-3">
					<Label for="priority">Priority</Label>
					<Select.Root type="single" bind:value={priority} name="priority">
						<Select.Trigger id="priority" class="w-full">
							{priority ?? "Select a priority"}
						</Select.Trigger>
						<Select.Content>
							{#if priorities.length}
								{#each priorities as p}
									<Select.Item value={p.name}>{p.name}</Select.Item>
								{/each}
							{:else}
								<Select.Item value="high prio">High Priority</Select.Item>
								<Select.Item value="medium prio">Medium Priority</Select.Item>
								<Select.Item value="low prio">Low Priority</Select.Item>
							{/if}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex flex-col gap-3">
					<Label for="assignedProject">Assigned Project</Label>
					{#if projects.length}
						<Select.Root type="single" bind:value={assignedProject} name="assignedProject">
							<Select.Trigger id="assignedProject" class="w-full">
								{assignedProject || "Select a project"}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">(no project)</Select.Item>
								{#each projects as proj}
									<Select.Item value={proj.id}>{proj.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{:else}
						<Input id="assignedProject" name="assignedProject" bind:value={assignedProject} />
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					<Label>Planned Schedule</Label>
					<DatePickerWithRange bind:value={dateRange} />
					<input type="hidden" name="plannedStart" value={plannedStartISO} />
					<input type="hidden" name="plannedDue" value={dueDateISO} />
				</div>

				<div class="flex flex-col gap-3">
					<Label for="mainAssignee">Main Assignee</Label>
					{#if users.length}
						<Select.Root type="single" bind:value={mainAssignee} name="mainAssignee">
							<Select.Trigger id="mainAssignee" class="w-full">
								{mainAssignee || "Select assignee"}
							</Select.Trigger>
							<Select.Content>
								{#each users as u}
									<Select.Item value={u.email}>{u.email}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{:else}
						<Input id="mainAssignee" name="mainAssignee" bind:value={mainAssignee} />
					{/if}
				</div>

				<div class="flex flex-col gap-3">
					<Label for="assignedUsers">Assigned Users (comma-separated)</Label>
					<Input id="assignedUsers" name="assignedUsers" bind:value={assignedUsersStr}
						   placeholder="user1@example.com, user2@example.com" />
				</div>

				<div class="flex gap-4 items-center">
					<Checkbox id="isActive" bind:checked={isActive} name="isActive" />
					<Label for="isActive">Active</Label>
				</div>

				<div class="flex flex-col gap-3">
					<Label for="tags">Tags (comma-separated)</Label>
					<Input id="tags" name="tags" bind:value={tagsStr}
						   placeholder="tag1, tag2, tag3" />
				</div>

				<Drawer.Footer class="px-0">
					<Button type="submit">Save Changes</Button>
					<Drawer.Close>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Cancel</Button>
						{/snippet}
					</Drawer.Close>
				</Drawer.Footer>
			</form>
		</div>
	</Drawer.Content>
</Drawer.Root>
