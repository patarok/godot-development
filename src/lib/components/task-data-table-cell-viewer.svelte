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
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as HoverCard from "$lib/components/ui/hover-card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import type { TaskRowSchema } from "./schemas.js";

	type TimePoint = { date: Date | string; minutes: number };

	const isMobile = new IsMobile();

	let {
		item,
		timeSeriesDaily,
		action = "?/update",
		priorities = [],
		states = [],
		users = [],
		projects = [],
		types = []
	}: {
		item: TaskRowSchema;
		timeSeriesDaily?: TimePoint[];
		action?: string;
		priorities?: Array<{ id: string; name: string }>;
		states?: Array<{ id: string; name: string }>;
		users?: Array<{ id: string; email: string }>;
		projects?: Array<{ id: string; title: string; avatarData?: string }>;
		types?: Array<{ id: string; name: string }>;
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

	function projectInitials(title?: string | null): string {
		const t = (title ?? '').trim();
		if (!t) return '?';
		const parts = t.split(/\s+/).filter(Boolean);
		if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		return (parts[0][0] ?? '?').toUpperCase();
	}

	// Form state
	let header = $state(item.header);
	let type = $state(item.type);
	let typeId = $state<string | null>(types?.find(t => t.name === item.type)?.id ?? null);
	const selectedTypeName = $derived(types?.find(t => t.id === typeId)?.name ?? null);
	let description = $state(item.description);
	let status = $state(item.status);
	let priority = $state(item.priority);
	let projectId = $state(item.projectId ?? null);
	let assignedProject = $state(item.assignedProject);
	let mainAssignee = $state(item.mainAssignee);
	let mainAssigneeId = $state(item.mainAssigneeId ?? null);
	let assignedUserIds = $state<string[]>(Array.isArray((item as any).assignedUserIds) ? (item as any).assignedUserIds : []);
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

	// Available users for this task (from server projection)
	const availableUsers = $derived((item as any).availableUsers ?? []);

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

	const defaultTypeOptions = [
		"Table of Contents",
		"Executive Summary",
		"Technical Approach",
		"Design",
		"Capabilities",
		"Focus Documents",
		"Narrative",
		"Cover Page"
	];
	const typeOptions = $derived(types?.length ? types.map(t => t.name) : defaultTypeOptions);
	console.log('PROJECTS INSIDE CELL VIEWER! :', projects);
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
 					<Select.Root type="single" bind:value={typeId} name="typeId">
 						<Select.Trigger id="type" class="w-full">
 							{selectedTypeName ?? "Select a type"}
 						</Select.Trigger>
 						<Select.Content>
 							{#each types as t}
 								<Select.Item value={t.id}>{t.name}</Select.Item>
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
								<Button variant="outline" size="sm">Change</Button>
							</Dialog.Trigger>
							<Dialog.Content class="max-w-xl">
								<Dialog.Header>
									<Dialog.Title>Select Project</Dialog.Title>
								</Dialog.Header>
								<div class="grid gap-2 max-h-[50vh] overflow-y-auto">
									<button type="button" class="flex items-center gap-3 p-2 rounded hover:bg-muted"
										on:click={() => { projectId = null; assignedProject = ''; }}>
										<div class="size-8 rounded-full grid place-items-center bg-muted text-xs font-medium">–</div>
										<div class="flex flex-col text-left">
											<span class="font-medium">(no project)</span>
										</div>
									</button>
									{#each projects as proj}
										<button type="button" class="flex items-center gap-3 p-2 rounded hover:bg-muted"
											on:click={() => { projectId = proj.id; assignedProject = proj.title; }}>
											<Avatar.Root class="size-8">
												<Avatar.Image src={proj.avatarData} alt={proj.title} />
												<Avatar.Fallback>{projectInitials(proj.title)}</Avatar.Fallback>
											</Avatar.Root>
											<div class="flex flex-col text-left">
												<span class="font-medium">{proj.title}</span>
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
					<input type="hidden" name="projectId" value={projectId ?? ''} />
				</div>

				<div class="flex flex-col gap-3">
					<Label>Planned Schedule</Label>
					<DatePickerWithRange bind:value={dateRange} />
					<input type="hidden" name="plannedStart" value={plannedStartISO} />
					<input type="hidden" name="plannedDue" value={dueDateISO} />
				</div>

				<div class="flex flex-col gap-3">
					<Label for="mainAssignee">Main Assignee</Label>
					<div class="flex items-center gap-2">
						{#if mainAssigneeId}
							{#each availableUsers.filter((u)=>u.id===mainAssigneeId) as u}
								<Avatar.Root class="size-8">
									<Avatar.Image src={u.avatarData} alt={u.fullName} />
									<Avatar.Fallback>{initials(u)}</Avatar.Fallback>
								</Avatar.Root>
								<span>{u.fullName}</span>
							{/each}
						{:else}
							<span class="text-muted-foreground">No assignee</span>
						{/if}
						<Dialog.Root>
							<Dialog.Trigger asChild>
								<Button variant="outline" size="sm">Change</Button>
							</Dialog.Trigger>
							<Dialog.Content class="max-w-xl">
								<Dialog.Header>
									<Dialog.Title>Select Main Assignee</Dialog.Title>
								</Dialog.Header>
								<div class="grid gap-2 max-h-[50vh] overflow-y-auto">
									{#each availableUsers as u}
										<button type="button" class="flex items-center gap-3 p-2 rounded hover:bg-muted"
											on:click={() => { mainAssigneeId = u.id; mainAssignee = u.fullName; }}>
											<Avatar.Root class="size-8">
												<Avatar.Image src={u.avatarData} alt={u.fullName} />
												<Avatar.Fallback>{initials(u)}</Avatar.Fallback>
											</Avatar.Root>
											<div class="flex flex-col text-left">
												<span class="font-medium">{u.fullName}</span>
												<span class="text-xs text-muted-foreground">{u.email} • {u.roleName} {u.subroles?.length ? `• ${u.subroles.join(', ')}` : ''}</span>
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
					<!-- hidden field for ID -->
					<input type="hidden" name="mainAssigneeId" value={mainAssigneeId ?? ''} />
				</div>

				<div class="flex flex-col gap-3">
					<Label>Assigned Users</Label>
					<div class="flex flex-wrap items-center gap-2">
						{#each assignedUserIds as uid}
							{#each availableUsers.filter(u => u.id === uid) as u}
								<HoverCard.Root>
									<HoverCard.Trigger asChild>
										<button type="button" class="relative" title={u.fullName} on:click={() => { assignedUserIds = assignedUserIds.filter(id => id !== uid); }}>
											<Avatar.Root class="size-8">
												<Avatar.Image src={u.avatarData} alt={u.fullName} />
												<Avatar.Fallback>{initials(u)}</Avatar.Fallback>
											</Avatar.Root>
											<span class="sr-only">Remove {u.fullName}</span>
										</button>
									</HoverCard.Trigger>
									<HoverCard.Content class="w-80">
										<div class="flex items-center gap-3">
											<Avatar.Root class="size-10">
												<Avatar.Image src={u.avatarData} alt={u.fullName} />
												<Avatar.Fallback>{initials(u)}</Avatar.Fallback>
											</Avatar.Root>
											<div class="flex flex-col">
												<span class="font-medium">{u.fullName}</span>
												<span class="text-xs text-muted-foreground">{u.email}</span>
												<span class="text-xs text-muted-foreground">{u.roleName} {u.subroles?.length ? `• ${u.subroles.join(', ')}` : ''}</span>
											</div>
										</div>
									</HoverCard.Content>
								</HoverCard.Root>
							{/each}
						{/each}
						<Dialog.Root>
							<Dialog.Trigger asChild>
								<Button variant="outline" size="sm">Manage</Button>
							</Dialog.Trigger>
							<Dialog.Content class="max-w-2xl">
								<Dialog.Header>
									<Dialog.Title>Assign Users</Dialog.Title>
								</Dialog.Header>
								<div class="flex flex-wrap items-center gap-2 border-b pb-3 mb-3">
									{#each assignedUserIds as uid}
										{#each availableUsers.filter(u => u.id === uid) as u}
											<Avatar.Root class="size-8">
												<Avatar.Image src={u.avatarData} alt={u.fullName} />
												<Avatar.Fallback>{initials(u)}</Avatar.Fallback>
											</Avatar.Root>
										{/each}
									{/each}
								</div>
								<div class="grid gap-2 max-h-[50vh] overflow-y-auto">
									{#each availableUsers.filter(u => !assignedUserIds.includes(u.id)) as u}
										<button type="button" class="flex items-center gap-3 p-2 rounded hover:bg-muted"
											on:click={() => { if (!assignedUserIds.includes(u.id)) assignedUserIds = [...assignedUserIds, u.id]; }}>
											<Avatar.Root class="size-8">
												<Avatar.Image src={u.avatarData} alt={u.fullName} />
												<Avatar.Fallback>{initials(u)}</Avatar.Fallback>
											</Avatar.Root>
											<div class="flex flex-col text-left">
												<span class="font-medium">{u.fullName}</span>
												<span class="text-xs text-muted-foreground">{u.email} • {u.roleName} {u.subroles?.length ? `• ${u.subroles.join(', ')}` : ''}</span>
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
					<!-- Hidden fields for assigned user IDs -->
					{#each assignedUserIds as uid}
						<input type="hidden" name="assignedUserIds[]" value={uid} />
					{/each}
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
