<script lang="ts" module>
	import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
	import UsersIcon from "@tabler/icons-svelte/icons/users";
	import SettingsIcon from "@tabler/icons-svelte/icons/settings";
	import MailIcon from "@tabler/icons-svelte/icons/mail";
	import FileDescriptionIcon from "@tabler/icons-svelte/icons/file-description";
	import FolderIcon from "@tabler/icons-svelte/icons/folder";
	import ReportIcon from "@tabler/icons-svelte/icons/report";
	import HelpIcon from "@tabler/icons-svelte/icons/help";
	import SearchIcon from "@tabler/icons-svelte/icons/search";
	import CommandIcon from "@tabler/icons-svelte/icons/command";

	// This is sample data.
	const data = {
		user: {
			name: "Admin",
			email: "admin@example.com",
			avatar: "/avatars/admin.jpg",
		},
		teams: [
			{
				name: "Acme Inc",
				logo: CommandIcon,
				plan: "Enterprise",
			}
		],
		navMain: [
			{
				title: "Admin Dashboard",
				url: "/admin",
				icon: DashboardIcon,
				status: 'working' as const
			},
			{
				title: "User Management",
				url: "/admin/users/list",
				icon: UsersIcon,
				status: 'working' as const
			},
			{
				title: "System Settings",
				url: "/admin/system",
				icon: SettingsIcon,
				status: 'working' as const
			},
			{
				title: "Mail",
				url: "/admin/mail",
				icon: MailIcon,
				status: 'stub' as const
			},
			{
				title: "Documents",
				url: "/admin/documents",
				icon: FileDescriptionIcon,
				status: 'stub' as const
			},
			{
				title: "Projects",
				url: "/admin/projects",
				icon: FolderIcon,
				status: 'stub' as const
			},
			{
				title: "Logs",
				url: "/admin/log",
				icon: ReportIcon,
				status: 'stub' as const
			},
		],
		navSecondary: [
			{
				title: "Settings",
				url: "/admin/system",
				icon: SettingsIcon,
				status: 'working' as const
			},
			{
				title: "Get Help",
				url: "#",
				icon: HelpIcon,
				status: 'stub' as const
			},
			{
				title: "Search",
				url: "#",
				icon: SearchIcon,
				status: 'stub' as const
			},
		],
		projects: [],
	};
</script>
<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavProjects from "./nav-projects.svelte";
	import NavUser from "./nav-user.svelte";
	import NavSecondary from "./nav-secondary.svelte";
	import TeamSwitcher from "./team-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	// let {
	// 	ref = $bindable(null),
	// 	collapsible = "icon",
	// 	...restProps
	// }: ComponentProps<typeof Sidebar.Root> = $props();

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

</script>
<Sidebar.Root class="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="##" {...props}>
							<div
									class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								<CommandIcon class="size-4" />
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">Acme Inc</span>
								<span class="truncate text-xs">Enterprise</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavProjects projects={data.projects} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>