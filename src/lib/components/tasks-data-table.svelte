<script lang="ts">
	import {
		createColumns,
		createColumnsFromData,
		staticColumns,
		type Columns,
		type StaticColumns
	} from "$lib/components/ui/data-table/data-table.svelte.js";
	import {
		getCoreRowModel,
		getFacetedRowModel,
		getFacetedUniqueValues,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type ColumnDef,
		type ColumnFiltersState,
		type PaginationState,
		type Row,
		type RowSelectionState,
		type SortingState,
		type VisibilityState,
	} from "@tanstack/table-core";
	import type { Schema, TaskRowSchema } from "./schemas.js";
	import {
		useSensors,
		MouseSensor,
		TouchSensor,
		KeyboardSensor,
		useSensor,
		type DragEndEvent,
		type UniqueIdentifier,
		DndContext,
		closestCenter,
	} from "@dnd-kit-svelte/core";
	import {
		arrayMove,
		SortableContext,
		useSortable,
		verticalListSortingStrategy,
	} from "@dnd-kit-svelte/sortable";
	import { restrictToVerticalAxis } from "@dnd-kit-svelte/modifiers";
	import { createSvelteTable } from "$lib/components/ui/data-table/data-table.svelte.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as HoverCard from "$lib/components/ui/hover-card/index.js";
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import {
		FlexRender,
		renderComponent,
		renderSnippet,
	} from "$lib/components/ui/data-table/index.js";
	import LayoutColumnsIcon from "@tabler/icons-svelte/icons/layout-columns";
	import GripVerticalIcon from "@tabler/icons-svelte/icons/grip-vertical";
	import ChevronDownIcon from "@tabler/icons-svelte/icons/chevron-down";
	import PlusIcon from "@tabler/icons-svelte/icons/plus";
	import ChevronsLeftIcon from "@tabler/icons-svelte/icons/chevrons-left";
	import ChevronLeftIcon from "@tabler/icons-svelte/icons/chevron-left";
	import ChevronRightIcon from "@tabler/icons-svelte/icons/chevron-right";
	import ChevronsRightIcon from "@tabler/icons-svelte/icons/chevrons-right";
	import CircleCheckFilledIcon from "@tabler/icons-svelte/icons/circle-check-filled";
	import LoaderIcon from "@tabler/icons-svelte/icons/loader";
	import DotsVerticalIcon from "@tabler/icons-svelte/icons/dots-vertical";
	import { toast } from "svelte-sonner";
	import { enhance } from '$app/forms';
	import DataTableCheckbox from "./data-table-checkbox.svelte";
	import TaskDataTableCellViewer from "./task-data-table-cell-viewer.svelte";
	import DataTableReviewer from "./data-table-reviewer.svelte";
	import { CSS } from "@dnd-kit-svelte/utilities";

	// let { data }: { data: Schema[] } = $props();
	let {
		data,
		states = [],
		priorities = [],
		users = [],
		projects = [],
		types = []
	}: {
		data: TaskRowSchema[];
		states?: Array<{ id: string; name: string }>;
		priorities?: Array<{ id: string; name: string }>;
		users?: Array<{ id: string; email: string }>;
		projects?: Array<{ 
			id: string; 
			title: string; 
			name?: string;
			avatarData?: string; 
			projectStatus?: { id: string; name: string } | null 
		}>;
		types?: Array<{ id: string; name: string }>;
	} = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({});

	const sortableId = $props.id();

	const sensors = useSensors(
			useSensor(MouseSensor, {}),
			useSensor(TouchSensor, {}),
			useSensor(KeyboardSensor, {})
	);

	const dataIds: UniqueIdentifier[] = $derived(data.map((item) => item.id));

	function projectInitials(title?: string | null): string {
		const t = (title ?? '').trim();
		if (!t) return '?';
		const parts = t.split(/\s+/).filter(Boolean);
		if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		return (parts[0][0] ?? '?').toUpperCase();
	}

	// Task-focused columns for rows shaped like genericTaskData
	export const columns: Columns = [
		{
			...staticColumns.drag,
			cell: ({ row }) => renderSnippet(DragHandle, { id: row.original.id }),
		},
		{
			...staticColumns.select,
			header: ({ table }) =>
					renderSnippet(CheckboxHeader, {
						table,
						label: 'Select'
					}),
			cell: ({ row }) =>
					renderComponent(DataTableCheckbox, {
						checked: row.getIsSelected(),
						onCheckedChange: (v) => row.toggleSelected(!!v),
					}),
		},
		{
			...staticColumns.header,

			// tell TanStack which field to sort on
			accessorKey: 'header',

			// clickable header to toggle sorting
			header: ({ column }) =>
					renderSnippet(SortableHeader, {
						column,
						label: 'Header'
					}),
			// keep the same cell viewer component; it already expects an object with at least `header`
			cell: ({ row }) =>
					renderComponent(TaskDataTableCellViewer, {
						item: row.original,
						timeSeriesDaily: (row.original as any).timeSeriesDaily,
						states,
						priorities,
						projects,
						users,
						types
					}),
		},

		// Type badge
		{
			accessorKey: "type",
			header: "Type",
			cell: ({ row }) => {
				const value = (row.original.type);
				return renderSnippet(RawHtml, { html: `<div class=\"w-20\"><span class=\"inline-block rounded border px-2 text-xs\">${value}</span></div>` });
			}, // reuses your existing snippet
		},

		// Main assignee
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => {
				const value = (row.original as any).description ?? "";
				return renderSnippet(RawHtml, { html: `<div class=\"truncate max-w-[10rem]\">${value}</div>` });
			},
		},

		// Status badge (done vs not done)
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => renderSnippet(DataTableStatus, { row }),
		},

		// Priority as simple text/badge
		{
			accessorKey: "priority",
			header: "Priority",
			cell: ({ row }) => {
				const value = (row.original as any).priority ?? "";
				return renderSnippet(RawHtml, { html: `<div class=\"w-20\"><span class=\"inline-block rounded border px-2 text-xs\">${value}</span></div>` });
			},
		},

		// Project avatar + hover card
		{
			accessorKey: "assignedProject",
			header: "Project",
			cell: ({ row }) => renderSnippet(ProjectCell, { row }),
		},

		// Planned schedule (plannedStart – plannedDue)
		{
			id: "planned",
			header: "Planned",
			cell: ({ row }) => {
				const ps = (row.original as any).plannedSchedule as { plannedStart?: Date; plannedDue?: Date } | undefined;
				const fmt = (d?: Date) => (d instanceof Date ? d.toLocaleDateString() : d ? new Date(d).toLocaleDateString() : "");
				const text = ps ? `${fmt(ps.plannedStart)} – ${fmt(ps.plannedDue)}` : "";
				return renderSnippet(RawHtml, { html: `<div class=\"whitespace-nowrap\">${text}</div>` });
			},
		},

		// Main assignee
		{
			accessorKey: "mainAssignee",
			header: "Assignee",
			cell: ({ row }) => {
				const value = (row.original as any).mainAssignee ?? "";
				return renderSnippet(RawHtml, { html: `<div class=\"truncate max-w-[10rem]\">${value}</div>` });
			},
		},

		// Assigned users chips
		{
			accessorKey: "assignedUsers",
			header: "Users",
			cell: ({ row }) => {
				const users: string[] = (row.original as any).assignedUsers ?? [];
				const chips = users
						.slice(0, 3)
						.map((u) => `<span class=\"inline-block rounded border px-2 py-0.5 text-xs mr-1\">${u}</span>`)
						.join("");
				const more = users.length > 3 ? `<span class=\"text-xs text-muted-foreground\">+${users.length - 3}</span>` : "";
				return renderSnippet(RawHtml, { html: `<div class=\"flex flex-wrap\">${chips}${more}</div>` });
			},
		},

		// Active state (boolean)
		{
			accessorKey: "isActive",
			header: "Active",
			cell: ({ row }) => {
				const value = (row.original as any).isActive;
				const truthy = typeof value === "string" ? value.toLowerCase() !== "false" : !!value;
				const label = truthy ? "Yes" : "No";
				return renderSnippet(RawHtml, { html: `<span class=\"inline-flex items-center gap-1\">${label}</span>` });
			},
		},

		// Created
		{
			accessorKey: "created",
			header: "Created",
			cell: ({ row }) => {
				const d = (row.original as any).created as Date | string | undefined;
				const text = d ? (d instanceof Date ? d : new Date(d)).toLocaleString() : "";
				return renderSnippet(RawHtml, { html: `<span class=\"whitespace-nowrap\">${text}</span>` });
			},
		},

		// Updated
		{
			accessorKey: "updated",
			header: "Updated",
			cell: ({ row }) => {
				const d = (row.original as any).updated as Date | string | undefined;
				const text = d ? (d instanceof Date ? d : new Date(d)).toLocaleString() : "";
				return renderSnippet(RawHtml, { html: `<span class=\"whitespace-nowrap\">${text}</span>` });
			},
		},

		// Tags badges
		{
			accessorKey: "tags",
			header: "Tags",
			cell: ({ row }) => {
				const tags: string[] = (row.original as any).tags ?? [];
				const chips = tags
						.slice(0, 4)
						.map((t) => `<span class=\"inline-block rounded border px-2 py-0.5 text-xs mr-1\">${t}</span>`)
						.join("");
				const more = tags.length > 4 ? `<span class=\"text-xs text-muted-foreground\">+${tags.length - 4}</span>` : "";
				return renderSnippet(RawHtml, { html: `<div class=\"flex flex-wrap\">${chips}${more}</div>` });
			},
		},

		// Row actions
		{
			id: "actions",
			header: "",
			cell: () => renderSnippet(DataTableActions),
			enableSorting: false,
			enableHiding: false,
			size: 60,
		},
	];


	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				return rowSelection;
			},
			get columnFilters() {
				return columnFilters;
			},
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === "function") {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === "function") {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === "function") {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === "function") {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === "function") {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
	});

	// Derive selected rows and their IDs for batch actions (Svelte 5 runes)
	let selectedRows = $derived(table.getSelectedRowModel().rows);
	let selectedIds = $derived(selectedRows.map((r) => r.original.id));

	// State for Move to Project dialog
	let moveDialogOpen = $state(false);
	let selectedProjectIdBatch = $state<string | null>(null);
	let exclusiveMove = $state(false);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			const oldIndex = dataIds.indexOf(active.id);
			const newIndex = dataIds.indexOf(over.id);
			data = arrayMove(data, oldIndex, newIndex);
		}
	}

	let views = [
		{
			id: "outline",
			label: "Outline",
			badge: 0,
		},
		{
			id: "past-performance",
			label: "Past Performance",
			badge: 3,
		},
		{
			id: "key-personnel",
			label: "Key Personnel",
			badge: 2,
		},
		{
			id: "focus-documents",
			label: "Focus Documents",
			badge: 0,
		},
	];

	let view = $state("outline");
	let viewLabel = $derived(views.find((v) => view === v.id)?.label ?? "Select a view");
	console.log('PROJECTS INSIDE TASK DATA TABLE! :', projects);
	console.log('DATA INSIDE TASK DATA TABLE! :', data);

</script>

{#snippet RawHtml({ html }: { html: string })}
	{@html html}
{/snippet}

{#snippet ProjectCell({ row })}
	{@const projId = (row.original).projectId}
	{@const proj = projects.find((p) => p.id === projId)}
	{#if proj}
		<HoverCard.Root>
			<HoverCard.Trigger asChild>
				<button type="button" class="inline-flex items-center gap-2" title={proj.title}>
					<Avatar.Root class="size-7">
						<Avatar.Image src={proj.avatarData} alt={proj.title} />
						<Avatar.Fallback>{projectInitials(proj.title)}</Avatar.Fallback>
					</Avatar.Root>
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
	{:else}
		<span class="text-muted-foreground">—</span>
	{/if}
{/snippet}

<Tabs.Root value="outline" class="w-full flex-col justify-start gap-6">
	<div class="flex items-center justify-between px-4 lg:px-6">
		<Label for="view-selector" class="sr-only">View</Label>
		<Select.Root type="single" bind:value={view}>
			<Select.Trigger class="@4xl/main:hidden flex w-fit" size="sm" id="view-selector">
				{viewLabel}
			</Select.Trigger>
			<Select.Content>
				{#each views as view (view.id)}
					<Select.Item value={view.id}>badum ts... {view.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<Tabs.List
				class="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex hidden"
		>
			{#each views as view (view.id)}
				<Tabs.Trigger value={view.id}>
					{view.label}
					{#if view.badge > 0}
						<Badge variant="secondary">{view.badge}</Badge>
					{/if}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
		<div class="flex items-center gap-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" {...props}>
							<LayoutColumnsIcon />
							<span class="hidden lg:inline">Customize Columns</span>
							<span class="lg:hidden">Columns</span>
							<ChevronDownIcon />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-56">
					{#each table
							.getAllColumns()
							.filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide()) as column (column.id)}
						<DropdownMenu.CheckboxItem
								class="capitalize"
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
						>
							{column.id}
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<Button variant="outline" size="sm">
				<PlusIcon />
				<span class="hidden lg:inline">Add Section</span>
			</Button>
		</div>
	</div>
	<Tabs.Content value="outline" class="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
		<div class="overflow-hidden rounded-lg border">
			<DndContext
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis]}
					onDragEnd={handleDragEnd}
					{sensors}
					id={sortableId}
			>
				<Table.Root>
					<Table.Header class="bg-muted sticky top-0 z-10">
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head colspan={header.colSpan}>
										{#if !header.isPlaceholder}
											<FlexRender
													content={header.column.columnDef.header}
													context={header.getContext()}
											/>
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body class="**:data-[slot=table-cell]:first:w-8">
						{#if table.getRowModel().rows?.length}
							<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
								{#each table.getRowModel().rows as row (row.id)}
									{@render DraggableRow({ row })}
								{/each}
							</SortableContext>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">
									No results.
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</DndContext>
		</div>
		<div class="flex items-center justify-between px-4">
			<div class="text-muted-foreground hidden flex-1 text-sm lg:flex">
				{table.getFilteredSelectedRowModel().rows.length} of
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div>
			<div class="flex w-full items-center gap-8 lg:w-fit">
				<div class="hidden items-center gap-2 lg:flex">
					<Label for="rows-per-page" class="text-sm font-medium">Rows per page</Label>
					<Select.Root
							type="single"
							bind:value={
							() => `${table.getState().pagination.pageSize}`,
							(v) => table.setPageSize(Number(v))
						}
					>
						<Select.Trigger size="sm" class="w-20" id="rows-per-page">
							{table.getState().pagination.pageSize}
						</Select.Trigger>
						<Select.Content side="top">
							{#each [10, 20, 30, 40, 50] as pageSize (pageSize)}
								<Select.Item value={pageSize.toString()}>
									{pageSize}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex w-fit items-center justify-center text-sm font-medium">
					Page {table.getState().pagination.pageIndex + 1} of
					{table.getPageCount()}
				</div>
				<div class="ml-auto flex items-center gap-2 lg:ml-0">
					<Button
							variant="outline"
							class="hidden h-8 w-8 p-0 lg:flex"
							onclick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
					>
						<span class="sr-only">Go to first page</span>
						<ChevronsLeftIcon />
					</Button>
					<Button
							variant="outline"
							class="size-8"
							size="icon"
							onclick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
					>
						<span class="sr-only">Go to previous page</span>
						<ChevronLeftIcon />
					</Button>
					<Button
							variant="outline"
							class="size-8"
							size="icon"
							onclick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
					>
						<span class="sr-only">Go to next page</span>
						<ChevronRightIcon />
					</Button>
					<Button
							variant="outline"
							class="hidden size-8 lg:flex"
							size="icon"
							onclick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
					>
						<span class="sr-only">Go to last page</span>
						<ChevronsRightIcon />
					</Button>
				</div>
			</div>
		</div>

		{#if selectedIds && selectedIds.length >= 2}
			<div class="mt-3 border-t pt-3 flex flex-wrap gap-3 items-start">
				<span class="text-sm text-muted-foreground">{selectedIds.length} selected</span>

				<Accordion.Root class="w-full">
					<Accordion.Item value="user-assignments">
						<Accordion.Trigger>User Assignments</Accordion.Trigger>
						<Accordion.Content>
							<div class="flex flex-wrap gap-3">
								<!-- Assign to Assigned Users (assignedUserLinks) -->
								<form method="POST" action="?/batch" class="flex items-center gap-2">
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="assign-user" />
									<input type="hidden" name="target" value="assigned" />
									<select name="userId" required class="border rounded px-2 py-1 text-sm">
										{#each users as u}
											<option value={u.id}>{u.email}</option>
										{/each}
									</select>
									<button type="submit" class="border rounded px-2 py-1 text-sm">Assign to Assigned Users</button>
								</form>

								<!-- Assign to Responsible Users (responsibleUserLinks) -->
								<form method="POST" action="?/batch" class="flex items-center gap-2">
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="assign-user" />
									<input type="hidden" name="target" value="responsible" />
									<select name="userId" required class="border rounded px-2 py-1 text-sm">
										{#each users as u}
											<option value={u.id}>{u.email}</option>
										{/each}
									</select>
									<button type="submit" class="border rounded px-2 py-1 text-sm">Assign to Responsible Users</button>
								</form>

								<!-- Set Active User (active_user_id) -->
								<form method="POST" action="?/batch" class="flex items-center gap-2">
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="assign-user" />
									<input type="hidden" name="target" value="current" />
									<select name="userId" required class="border rounded px-2 py-1 text-sm">
										{#each users as u}
											<option value={u.id}>{u.email}</option>
										{/each}
									</select>
									<button type="submit" class="border rounded px-2 py-1 text-sm">Set Active User</button>
								</form>
							</div>
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="task-properties">
						<Accordion.Trigger>Task Properties</Accordion.Trigger>
						<Accordion.Content>
							<div class="flex flex-wrap gap-3">
								<!-- Set Due Date -->
								<form method="POST" action="?/batch" class="flex items-center gap-2">
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="set-due" />
									<input type="date" name="dueDate" required class="border rounded px-2 py-1 text-sm" />
									<button type="submit" class="border rounded px-2 py-1 text-sm">Set Due Date</button>
								</form>

								<!-- Set Status -->
								<form method="POST" action="?/batch" class="flex items-center gap-2">
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="set-status" />
									<select name="statusId" required class="border rounded px-2 py-1 text-sm">
										{#each states as s}
											<option value={s.id}>{s.name}</option>
										{/each}
									</select>
									<button type="submit" class="border rounded px-2 py-1 text-sm">Set Status</button>
								</form>

								<!-- Add Tags -->
								<form method="POST" action="?/batch" class="flex items-center gap-2">
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="add-tags" />
									<input type="text" name="tags" placeholder="tag1, tag2" class="border rounded px-2 py-1 text-sm" />
									<button type="submit" class="border rounded px-2 py-1 text-sm">Add Tags</button>
								</form>
							</div>
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="project-activity">
						<Accordion.Trigger>Project & Activity</Accordion.Trigger>
						<Accordion.Content>
							<div class="flex flex-wrap gap-3">
								<!-- Move to Project Button -->
								<Button 
									variant="outline" 
									size="sm" 
									onclick={() => (moveDialogOpen = true)}
									disabled={selectedIds.length === 0}
								>
									Move to Project
								</Button>

								<!-- Set Non-Active -->
								<form 
									method="POST" 
									action="?/batch" 
									class="flex items-center gap-2"
									use:enhance={() => {
										return async ({ result }) => {
											if (result.type === 'success') {
												rowSelection = {};
											}
										};
									}}
								>
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="set-inactive" />
									<Button 
										type="submit" 
										variant="outline" 
										size="sm" 
										class="text-red-600"
										disabled={selectedIds.length === 0}
									>
										Set Non-Active
									</Button>
								</form>

								<!-- Set Active -->
								<form 
									method="POST" 
									action="?/batch" 
									class="flex items-center gap-2"
									use:enhance={() => {
										return async ({ result }) => {
											if (result.type === 'success') {
												rowSelection = {};
											}
										};
									}}
								>
									{#each selectedIds as id}
										<input type="hidden" name="taskIds[]" value={id} />
									{/each}
									<input type="hidden" name="op" value="set-active" />
									<Button 
										type="submit" 
										variant="outline" 
										size="sm" 
										class="text-green-600"
										disabled={selectedIds.length === 0}
									>
										Set Active
									</Button>
								</form>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</div>
		{/if}

	</Tabs.Content>
	<Tabs.Content value="past-performance" class="flex flex-col px-4 lg:px-6">
		<div class="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
	</Tabs.Content>
	<Tabs.Content value="key-personnel" class="flex flex-col px-4 lg:px-6">
		<div class="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
	</Tabs.Content>
	<Tabs.Content value="focus-documents" class="flex flex-col px-4 lg:px-6">
		<div class="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
	</Tabs.Content>
</Tabs.Root>

<!-- Move to Project Dialog -->
<Dialog.Root bind:open={moveDialogOpen}>
	<Dialog.Content class="max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Move {selectedIds.length} task(s) to a project</Dialog.Title>
			<Dialog.Description>
				Select a project by clicking its avatar, then confirm.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Selected tasks count -->
		<div class="text-sm text-muted-foreground mb-2">
			{selectedIds.length} task(s) selected from the table.
		</div>

		<!-- Project avatar grid -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto" role="radiogroup" aria-label="Select project">
			{#each projects as p}
				<HoverCard.Root>
					<HoverCard.Trigger asChild>
						<button
								type="button"
								class="flex flex-col items-center gap-2 rounded border p-3 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
								class:ring-2={selectedProjectIdBatch === p.id}
								class:ring-primary={selectedProjectIdBatch === p.id}
								onclick={() => (selectedProjectIdBatch = p.id)}
								aria-pressed={selectedProjectIdBatch === p.id}
								aria-label="Select project {p.title}"
								role="radio"
								aria-checked={selectedProjectIdBatch === p.id}
						>
							<Avatar.Root class="size-12">
								<Avatar.Image src={p.avatarData} alt={p.title} />
								<Avatar.Fallback>{projectInitials(p.title)}</Avatar.Fallback>
							</Avatar.Root>
							<span class="text-xs line-clamp-2 text-center">{p.title}</span>
						</button>
					</HoverCard.Trigger>
					<HoverCard.Content class="w-64">
						<div class="flex items-center gap-3">
							<Avatar.Root class="size-10">
								<Avatar.Image src={p.avatarData} alt={p.title} />
								<Avatar.Fallback>{projectInitials(p.title)}</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex flex-col">
								<span class="font-medium">{p.title}</span>
								<span class="text-xs text-muted-foreground">
									{p.projectStatus?.name ?? '—'}
								</span>
							</div>
						</div>
					</HoverCard.Content>
				</HoverCard.Root>
			{/each}
		</div>

		<!-- Confirm form -->
		<form 
			method="POST" 
			action="?/batch"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						moveDialogOpen = false;
						selectedProjectIdBatch = null;
						exclusiveMove = false;
						rowSelection = {};
					}
				};
			}}
		>
			{#each selectedIds as id}
				<input type="hidden" name="taskIds[]" value={id} />
			{/each}
			<input type="hidden" name="op" value="move-project" />
			<input type="hidden" name="projectId" value={selectedProjectIdBatch ?? ''} />
			<input type="hidden" name="exclusive" value={exclusiveMove ? 'true' : ''} />

			<div class="mt-4 flex items-center justify-between gap-3">
				<label class="inline-flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={exclusiveMove} />
					exclusive (remove from other projects)
				</label>
				<div class="ml-auto flex gap-2">
					<Dialog.Close asChild>
						<Button
								type="button"
								variant="outline"
						>
							Cancel
						</Button>
					</Dialog.Close>
					<Button
							type="submit"
							disabled={!selectedProjectIdBatch}
					>
						Confirm Move
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

{#snippet DataTableLimit({ row }: { row: Row<TaskRowSchema> })}
	<form
			onsubmit={(e) => {
			e.preventDefault();
			toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
				loading: `Saving ${row.original.header}`,
				success: "Done",
				error: "Error",
			});
		}}
	>
		<Label for="{row.original.id}-limit" class="sr-only">Limit</Label>
		<Input
				class="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
				value={row.original.limit}
				id="{row.original.id}-limit"
		/>
	</form>
{/snippet}

{#snippet DataTableTarget({ row }: { row: Row<TaskRowSchema> })}
	<form
			onsubmit={(e) => {
			e.preventDefault();
			toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
				loading: `Saving ${row.original.header}`,
				success: "Done",
				error: "Error",
			});
		}}
	>
		<Label for="{row.original.id}-target" class="sr-only">Target</Label>
		<Input
				class="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
				value={row.original.target}
				id="{row.original.id}-target"
		/>
	</form>
{/snippet}

{#snippet DataTableType({ row }: { row: Row<TaskRowSchema> })}
	<div class="w-32">
		<Badge variant="outline" class="text-muted-foreground px-1.5">
			{row.original.type}
		</Badge>
	</div>
{/snippet}

{#snippet DataTableStatus({ row }: { row: Row<TaskRowSchema> })}
	<Badge variant="outline" class="text-muted-foreground px-1.5">
		{#if row.original.status === "Done"}
			<CircleCheckFilledIcon class="fill-green-500 dark:fill-green-400" />
		{:else}
			<LoaderIcon />
		{/if}
		{row.original.status}
	</Badge>
{/snippet}

{#snippet DataTableActions()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="data-[state=open]:bg-muted text-muted-foreground flex size-8">
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" {...props}>
					<DotsVerticalIcon />
					<span class="sr-only">Open menu</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-32">
			<DropdownMenu.Item>Edit</DropdownMenu.Item>
			<DropdownMenu.Item>Make a copy</DropdownMenu.Item>
			<DropdownMenu.Item>Favorite</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet DraggableRow({ row }: { row: Row<TaskRowSchema> })}
	{@const { transform, transition, node, setNodeRef, isDragging } = useSortable({
		id: () => row.original.id,
	})}
	<!--{console.log(row.original)}-->

	<Table.Row
			data-state={row.getIsSelected() && "selected"}
			data-dragging={isDragging.current}
			bind:ref={node.current}
			class="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
			style="transition: {transition.current}; transform: {CSS.Transform.toString(
			transform.current
		)}"
	>
		{#each row.getVisibleCells() as cell (cell.id)}
			<Table.Cell>
				<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
			</Table.Cell>
		{/each}
	</Table.Row>
{/snippet}

{#snippet DragHandle({ id }: { id: number })}
	{@const { attributes, listeners } = useSortable({ id: () => id })}

	<Button
			{...attributes.current}
			{...listeners.current}
			variant="ghost"
			size="icon"
			class="text-muted-foreground size-7 hover:bg-transparent"
	>
		<GripVerticalIcon class="text-muted-foreground size-3" />
		<span class="sr-only">Drag to reorder</span>
	</Button>
{/snippet}

{#snippet CheckboxHeader({ table, label }: { table: any; label: string })}
	<!-- Select all on current page -->
	{#key table.getState().pagination.pageIndex}
		{#await Promise.resolve()}
			<!-- placeholder to force reactive update -->
		{/await}
	{/key}
	<DataTableCheckbox
			checked={table.getIsAllPageRowsSelected()}
			onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
	/>
{/snippet}

{#snippet SortableHeader({ column, label }: { column: any; label: string })}
	<button
			type="button"
			class="inline-flex items-center gap-1 select-none"
			onclick={column.getToggleSortingHandler()}
			title="Sort by header"
	>
		{label}
		{#if column.getIsSorted() === 'asc'}
			<span aria-hidden>▲</span>
		{:else if column.getIsSorted() === 'desc'}
			<span aria-hidden>▼</span>
		{:else}
			<span class="opacity-30" aria-hidden>↕</span>
		{/if}
	</button>
{/snippet}