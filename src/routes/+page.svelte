<script lang="ts">
    import type { PageData } from './$types';
    import { css } from '$lib/styled-system/css';
    import { Menubar, MenubarRoot } from '$lib/components';

    let { data }: { data: PageData } = $props();
    const user = data.user;
    const username = user?.username ?? 'guest';
</script>
<h1>Menubar Demo</h1>

<MenubarRoot>

    <!-- File Menu -->
    <Menubar.Menu>
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
            <Menubar.Item on:click={newFile}>
                New File
                <span>Ctrl+N</span>
            </Menubar.Item>

            <Menubar.Item on:click={openFile}>
                Open File
                <span>Ctrl+O</span>
            </Menubar.Item>

            <Menubar.Separator />

            <Menubar.Item on:click={saveFile}>
                Save
                <span>Ctrl+S</span>
            </Menubar.Item>

            <Menubar.Separator />

            <Menubar.Item>Exit</Menubar.Item>
        </Menubar.Content>
    </Menubar.Menu>

    <!-- Edit Menu -->
    <Menubar.Menu>
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
            <Menubar.Item on:click={cut}>
                Cut
                <span>Ctrl+X</span>
            </Menubar.Item>

            <Menubar.Item on:click={copy}>
                Copy
                <span>Ctrl+C</span>
            </Menubar.Item>

            <Menubar.Item on:click={paste}>
                Paste
                <span>Ctrl+V</span>
            </Menubar.Item>

            <Menubar.Separator />

            <Menubar.Item>
                Select All
                <span>Ctrl+A</span>
            </Menubar.Item>
        </Menubar.Content>
    </Menubar.Menu>

    <!-- View Menu -->
    <Menubar.Menu>
        <Menubar.Trigger>View</Menubar.Trigger>
        <Menubar.Content>
            <Menubar.CheckboxItem checked={true}>
                <Menubar.CheckboxIndicator>✓</Menubar.CheckboxIndicator>
                Show Sidebar
            </Menubar.CheckboxItem>

            <Menubar.CheckboxItem checked={false}>
                <Menubar.CheckboxIndicator>✓</Menubar.CheckboxIndicator>
                Show Toolbar
            </Menubar.CheckboxItem>

            <Menubar.Separator />

            <Menubar.Sub>
                <Menubar.SubTrigger>
                    Zoom
                    <span>›</span>
                </Menubar.SubTrigger>
                <Menubar.SubContent>
                    <Menubar.Item>Zoom In</Menubar.Item>
                    <Menubar.Item>Zoom Out</Menubar.Item>
                    <Menubar.Item>Reset Zoom</Menubar.Item>
                </Menubar.SubContent>
            </Menubar.Sub>
        </Menubar.Content>
    </Menubar.Menu>

    <!-- Help Menu -->
    <Menubar.Menu>
        <Menubar.Trigger>Help</Menubar.Trigger>
        <Menubar.Content>
            <Menubar.Item>Documentation</Menubar.Item>
            <Menubar.Item>Keyboard Shortcuts</Menubar.Item>
            <Menubar.Separator />
            <Menubar.Item>About</Menubar.Item>
        </Menubar.Content>
    </Menubar.Menu>

</MenubarRoot>
<h1>Welcome to SvelteKit, {username}</h1>
{#if user}
<p>
    Email: {user.email}
    {#if user.forename || user.surname}
        <br />Name: {user.forename ?? ''} {user.surname ?? ''}
        <br />Role: {user.role ?? ''}
    {/if}
</p>
{/if}

<p class={css({ maxWidth: '20em', margin: '0 auto' })}>
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>