<script lang="ts">
	import CirclePlusFilledIcon from "@tabler/icons-svelte/icons/circle-plus-filled";
	import MailIcon from "@tabler/icons-svelte/icons/mail";
	import CherryIcon from "@tabler/icons-svelte/icons/cherry";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { Icon } from "@tabler/icons-svelte";

	let { items }: { items: { title: string; url: string; icon?: Icon }[] } = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex items-center gap-2">
				<Sidebar.MenuButton
						class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
						tooltipContent="Quick create"
				>
					<CirclePlusFilledIcon />
					<span>Quick Create Task</span>
				</Sidebar.MenuButton>
				<Button
						size="icon"
						class="size-8 group-data-[collapsible=icon]:opacity-0"
						variant="outline"
				>
					<CherryIcon />
					<span class="sr-only">Inbox</span>
				</Button>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem class="flex items-center gap-2">
				<Sidebar.MenuButton
						class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
						tooltipContent="Quick create"
				>
					<CirclePlusFilledIcon />
					<span>Quick Create Mail</span>
				</Sidebar.MenuButton>
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
	</Sidebar.GroupContent>
</Sidebar.Group>
