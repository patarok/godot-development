<script lang="ts">
	import * as Menubar from "$lib/components/ui/menubar/index.js";

	let bookmarks = $state(false);
	let fullUrls = $state(true);
	let profileRadioValue = $state("benoit");
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
		<Menubar.Trigger class="opacity-50 grayscale">View</Menubar.Trigger>
		<Menubar.Content>
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
		<Menubar.Trigger class="opacity-50 grayscale">Profiles</Menubar.Trigger>
		<Menubar.Content>
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
			<Menubar.Item>
				<a class="btn" href="/admin/system">System</a>
			</Menubar.Item>
			<Menubar.Item>
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