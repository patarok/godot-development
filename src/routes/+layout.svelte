<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';
    import { Button } from "$lib/components/ui/button"
    import {
        Menubar,
        MenubarMenu,
        MenubarTrigger,
        MenubarContent,
        MenubarItem,
        MenubarSeparator
    } from "$lib/components/ui/menubar";

	// Svelte 5 way: get props via $props(), no $: and no $page
	let { data, children }: { data: LayoutData; children: any } = $props();
    const user = $derived(data.user);

	const theme = writable<'light' | 'dark'>('light');

	function setTheme(newTheme: 'light' | 'dark') {
		if (newTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else document.documentElement.classList.remove('dark');
		theme.set(newTheme);
	}

	function toggleTheme() {
		theme.update((currentTheme) => {
			const newTheme = currentTheme === 'light' ? 'dark' : 'light';
			setTheme(newTheme);
			return newTheme;
		});
	}

	async function accountToggle() {
		const currentUser = data.user;
		if (!browser) return;

		if (currentUser) {
			// Perform AJAX logout without redirecting to /logout
			try {
				const res = await fetch('/api/logout', { method: 'POST' });
				if (!res.ok) throw new Error('Logout failed');
				// Reload the page to refresh layout data (user from locals)
				window.location.reload();
			} catch (e) {
				console.error(e);
				window.location.reload();
			}
		} else {
			window.location.href = '/login';
		}
	}

    //menubar example on how we are gonna deal with bits-ui headless components
    // Menu action handlers
    function newFile() {
        console.log("New file clicked");
    }

    function openFile() {
        console.log("Open file clicked");
    }

    function saveFile() {
        console.log("Save file clicked");
    }

    function cut() {
        console.log("Cut clicked");
    }

    function copy() {
        console.log("Copy clicked");
    }

    function paste() {
        console.log("Paste clicked");
    }


    const sales = [
        { label: "Michael Scott", value: "michael" },
        { label: "Dwight Schrute", value: "dwight" },
        { label: "Jim Halpert", value: "jim" },
        { label: "Stanley Hudson", value: "stanley" },
        { label: "Phyllis Vance", value: "phyllis" },
        { label: "Pam Beesly", value: "pam" },
        { label: "Andy Bernard", value: "andy" },
    ];

    const hr = [
        { label: "Toby Flenderson", value: "toby" },
        { label: "Holly Flax", value: "holly" },
        { label: "Jan Levinson", value: "jan" },
    ];

    const accounting = [
        { label: "Angela Martin", value: "angela" },
        { label: "Kevin Malone", value: "kevin" },
        { label: "Oscar Martinez", value: "oscar" },
    ];

    const menubarMenus = [
        { title: "Sales", items: sales },
        { title: "HR", items: hr },
        { title: "Accounting", items: accounting },
        { title: "EMPTY", items: ['']}
    ];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if browser}
    {#if user}
    <Menubar class="px-2">
        {#each menubarMenus as { title, items }}
            <MenubarMenu>
                <MenubarTrigger class="px-3 py-2 font-medium">{title}</MenubarTrigger>
                <MenubarContent class="min-w-48">
                    {#each items as item, i}
                        <MenubarItem class="cursor-pointer">
                            {typeof item === 'string' ? item : item.label}
                        </MenubarItem>
                        {#if i < items.length - 1}
                            <MenubarSeparator />
                        {/if}
                    {/each}
                </MenubarContent>
            </MenubarMenu>
        {/each}
    </Menubar>
    {/if}

    {#if user}
	<Button
			onclick={accountToggle}
			style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; left: 0; margin: 1rem;"
	>
		🔒
	</Button>
    {:else}
    <Button
            onclick={accountToggle}
            style="aspect-ratio: 1 / 1; border: none; position: fixed; top: 0; right: 0; margin: 1rem;"
    >
        🔒
    </Button>
    {/if}

	<Button
			onclick={toggleTheme}
			style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; right: 0; margin: 1rem;"
	>
		🌙
	</Button>
{/if}

{@render children?.()}