<script lang="ts">
	import TrendingUpIcon from "@tabler/icons-svelte/icons/trending-up";
	import { AreaChart } from "layerchart";
	import { scaleUtc } from "d3-scale";
	import { curveNatural } from "d3-shape";

	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import type { TaskRowSchema } from "./schemas.js";

	type TimePoint = { date: Date | string; minutes: number };

	const isMobile = new IsMobile();

	let { item, timeSeriesDaily }: { item: TaskRowSchema; timeSeriesDaily?: TimePoint[] } = $props();


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

	let assignedProject = $state(item.assignedProject);
	let description = $state(item.description);
	let type = $state(item.type);
	let status = $state(item.status);
	let reviewer = $state(item.reviewer);
	const totalMinutes = $derived(seriesData.reduce((sum, d) => sum + d.minutes, 0));

	const totalFormatted = $derived.by(() => {
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;
		if (hours === 0) return `${mins}m`;
		if (mins === 0) return `${hours}h`;
		return `${hours}h ${mins}m`;
	});
	
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
		<div class="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
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
<!--						Showing total visitors for the last 6 months. This is just some random text-->
<!--						to test the layout. It spans multiple lines and should wrap around.-->
					</div>
				</div>
				<Separator />
			{/if}
			<form class="flex flex-col gap-4">
				<div class="flex flex-col gap-3">
					<Label for="header">Header</Label>
					<Input id="header" value={item.header} />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-3">
						<Label for="type">Type</Label>
						<Select.Root type="single" bind:value={type}>
							<Select.Trigger id="type" class="w-full">
								{type ?? "Select a type"}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Table of Contents"
									>Table of Contents</Select.Item
								>
								<Select.Item value="Executive Summary"
									>Executive Summary</Select.Item
								>
								<Select.Item value="Technical Approach">
									Technical Approach
								</Select.Item>
								<Select.Item value="Design">Design</Select.Item>
								<Select.Item value="Capabilities">Capabilities</Select.Item>
								<Select.Item value="Focus Documents">Focus Documents</Select.Item>
								<Select.Item value="Narrative">Narrative</Select.Item>
								<Select.Item value="Cover Page">Cover Page</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-3">
						<Label for="status">Status</Label>
						<Select.Root type="single" bind:value={status}>
							<Select.Trigger id="status" class="w-full">
								{status ?? "Select a status"}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Done">Done</Select.Item>
								<Select.Item value="In Progress">In Progress</Select.Item>
								<Select.Item value="Not Started">Not Started</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-3">
						<Label for="target">Target</Label>
						<Input id="target" value={item?.target ?? ''} />
					</div>
					<div class="flex flex-col gap-3">
						<Label for="limit">Limit</Label>
						<Input id="limit" value={item?.limit ?? ''} />
					</div>
				</div>
				<div class="flex flex-col gap-3">
					<Label for="reviewer">Reviewer</Label>
					<Select.Root type="single" bind:value={reviewer}>
						<Select.Trigger id="reviewer" class="w-full">
							{reviewer ?? "Select a reviewer"}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="Eddie Lake">Eddie Lake</Select.Item>
							<Select.Item value="Jamik Tashpulatov">Jamik Tashpulatov</Select.Item>
							<Select.Item value="Emily Whalen">Emily Whalen</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</form>
		</div>
		<Drawer.Footer>
			<Button>Submit</Button>
			<Drawer.Close>
				{#snippet child({ props })}
					<Button variant="outline" {...props}>Done</Button>
				{/snippet}
			</Drawer.Close>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
