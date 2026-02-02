<script lang="ts">
	import * as Menubar from "$lib/components/ui/menubar/index.js";
	import { page } from "$app/state";
	import { browser } from "$app/environment";
	import { appState } from "$lib/state.svelte.js";

	let bookmarks = $state(false);
	let fullUrls = $state(true);
	let profileRadioValue = $state("benoit");

	const user = $derived(page.data.user);
	const isAdmin = $derived(user?.isAdmin);
	const profileLabel = $derived(isAdmin ? "Profiles" : "Profile");

	function toggleTheme() {
		appState.toggleTheme();
	}

	async function handleAccountAction(action: 'logout' | 'login', redirectTo: string = '/') {
		if (!browser) return;
		if (action === 'logout') {
			try {
				const res = await fetch('/api/logout', { method: 'POST' });
				if (!res.ok) throw new Error('Logout failed');
				appState.setLanding();
				window.location.href = redirectTo;
			} catch (e) {
				console.error(e);
				window.location.href = redirectTo;
			}
		} else {
			window.location.href = '/login';
		}
	}
</script>

<Menubar.Root>
	<Menubar.Menu>
		<Menubar.Trigger class="opacity-50 grayscale">File</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item disabled>
				New Tab <Menubar.Shortcut>⌘T</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item disabled>
				New Window <Menubar.Shortcut>⌘N</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item disabled>New Incognito Window</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger disabled>Share</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item disabled>Email link</Menubar.Item>
					<Menubar.Item disabled>Messages</Menubar.Item>
					<Menubar.Item disabled>Notes</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
			<Menubar.Separator />
			<Menubar.Item disabled>
				Print... <Menubar.Shortcut>⌘P</Menubar.Shortcut>
			</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger class="opacity-50 grayscale">Edit</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item disabled>
				Undo <Menubar.Shortcut>⌘Z</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item disabled>
				Redo <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger disabled>Find</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item disabled>Search the web</Menubar.Item>
					<Menubar.Separator />
					<Menubar.Item disabled>Find...</Menubar.Item>
					<Menubar.Item disabled>Find Next</Menubar.Item>
					<Menubar.Item disabled>Find Previous</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
			<Menubar.Separator />
			<Menubar.Item disabled>Cut</Menubar.Item>
			<Menubar.Item disabled>Copy</Menubar.Item>
			<Menubar.Item disabled>Paste</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>View</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item onclick={toggleTheme}>
				Toggle Dark Mode
			</Menubar.Item>
			<Menubar.Item onclick={() => handleAccountAction(user ? 'logout' : 'login', '/')}>
				{user ? 'Lock Session' : 'Login'}
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.CheckboxItem bind:checked={bookmarks} disabled
			>Always Show Bookmarks Bar</Menubar.CheckboxItem
			>
			<Menubar.CheckboxItem bind:checked={fullUrls} disabled>
				Always Show Full URLs
			</Menubar.CheckboxItem>
			<Menubar.Separator />
			<Menubar.Item inset disabled>
				Reload <Menubar.Shortcut>⌘R</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item inset disabled>
				Force Reload <Menubar.Shortcut>⇧⌘R</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item inset disabled>Toggle Fullscreen</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item inset disabled>Hide Sidebar</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>{profileLabel}</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item disabled={!isAdmin}>
				<a class="btn" href="/admin">Admin Dashboard</a>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item onclick={() => handleAccountAction('logout', '/login')}>
				Switch Profile
			</Menubar.Item>
			<Menubar.Separator />
			{#if user}
				<Menubar.Item onclick={() => handleAccountAction('logout', '/')}>
					Log out
				</Menubar.Item>
			{:else}
				<Menubar.Item href="/login">
					Log in
				</Menubar.Item>
			{/if}
			<Menubar.Separator />
			<Menubar.RadioGroup bind:value={profileRadioValue}>
				<Menubar.RadioItem value="andy" disabled>Andy</Menubar.RadioItem>
				<Menubar.RadioItem value="benoit" disabled>Benoit</Menubar.RadioItem>
				<Menubar.RadioItem value="Luis" disabled>Luis</Menubar.RadioItem>
			</Menubar.RadioGroup>
			<Menubar.Separator />
			<Menubar.Item inset disabled>Edit...</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item inset disabled>Add Profile...</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>App-Settings</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item disabled={!isAdmin}>
				<a class="btn" href="/admin/system">System</a>
			</Menubar.Item>
			<Menubar.Item disabled={!isAdmin}>
				<a class="btn" href="/admin/users/list">User MGMT</a>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger><a class="btn" href="/admin/mail">Mail</a></Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.Item>list Mails</Menubar.Item>
					<Menubar.Item>mail 2 User</Menubar.Item>
					<Menubar.Item>Circulars</Menubar.Item>
				</Menubar.SubContent>
			</Menubar.Sub>
			<Menubar.Separator />
			<Menubar.Item>
				List all... <Menubar.Shortcut>⌘L</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item disabled class="opacity-50 grayscale">
				<a class="btn" href="/admin/documents">Documents</a>
			</Menubar.Item>
			<Menubar.Item disabled class="opacity-50 grayscale">
				<a class="btn" href="/admin/projects">Projects</a>
			</Menubar.Item>
			<Menubar.Item disabled class="opacity-50 grayscale">
				<a class="btn" href="/admin/log">Logs</a>
			</Menubar.Item>
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>