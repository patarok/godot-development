<script lang="ts">
	import CirclePlusFilledIcon from "@tabler/icons-svelte/icons/circle-plus-filled";
	import MailIcon from "@tabler/icons-svelte/icons/mail";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { Icon } from "@tabler/icons-svelte";
	import TaskCreateForm from "$lib/components/molecules/tasks/TaskCreateForm.svelte";
	import { page } from "$app/state";
	import { invalidateAll } from "$app/navigation";

	let { items }: { items: { title: string; url: string; icon?: Icon; status?: 'working' | 'stub' | 'missing' }[] } = $props();

	const data = $derived(page.data);

	const enhanceCallback = async ({ result }) => {
		if (result?.data?.success) {
			await invalidateAll();
		}
	};
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex items-center gap-2">
				<TaskCreateForm
					action="/tasks?/create"
					enhanceForm={true}
					{enhanceCallback}
					states={data.states}
					priorities={data.priorities}
					users={data.users}
					tasks={data.metaTasks}
					projects={data.projects}
					types={data.types}
					prefilledProjectId={data.user?.activeProjectId}
				>
					{#snippet trigger(props)}
						<Sidebar.MenuButton
							class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
							tooltipContent="Quick create"
							{...props}
						>
							<CirclePlusFilledIcon />
							<span>Quick Create</span>
						</Sidebar.MenuButton>
					{/snippet}
				</TaskCreateForm>
				<Button
					size="icon"
					class="size-8 group-data-[collapsible=icon]:opacity-0"
					variant="outline"
				>
					<MailIcon />
					<span class="sr-only">Inbox</span>
				</Button>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						tooltipContent={item.title}
						class="{item.status === 'stub' || item.status === 'missing' ? 'opacity-50 grayscale' : ''}"
					>
						{#snippet child({ props })}
							<a href={item.url} {...props}>
								{#if item.icon}
									<item.icon />
								{/if}
								<span>{item.title}</span>
								{#if item.status === 'stub'}
									<span class="ml-auto text-[10px]">🚧</span>
								{:else if item.status === 'missing'}
									<span class="ml-auto text-[10px]">❓</span>
								{/if}
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
