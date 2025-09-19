<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';
    import { Button } from "$lib/components/ui/button"
    import { page } from '$app/state';
    import * as Menubar from "$lib/components/ui/menubar/index.js";
    // import {
    //     Menubar,
    //     MenubarMenu,
    //     MenubarTrigger,
    //     MenubarContent,
    //     MenubarItem,
    //     MenubarSeparator
    // } from "$lib/components/ui/menubar";
    import { appState } from '$lib/state.svelte.js';
    import { auth } from '$lib/stores/auth.svelte.js';
    import { setContext, onMount } from 'svelte';
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import AdminSidebar from "$lib/components/admin-sidebar.svelte";
    import AdminMenubar from "$lib/components/admin-menubar.svelte";
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.ts";
    import { breadcrumbStore } from '$lib/stores/breadcrumb.svelte.js';
    import { Separator } from "$lib/components/ui/separator/index.ts";
    import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
    import SiteHeader from "$lib/components/site-header.svelte";


    // Svelte 5 way: get props via $props(), no $: and no $page
	let { data, children }: { data: LayoutData; children: any } = $props();
    const user = $derived(data.user);


    onMount(() => {
        appState.init();
    });

    // Route-Mapping
    const routeLabels: Record<string, string> = {
        '': 'Home',
        'dashboard': 'Dashboard',
        'users': 'Users',
        'settings': 'Settings'
    };

    // current path
    const currentPath = $derived(page.url.pathname);


    // pathSegments derived directly from page
    const pathSegments = $derived(
        page.url.pathname.split('/').filter(Boolean)
    );

    // breadcrumbs also derived
    const breadcrumbs = $derived([
        { href: '/', label: routeLabels[''] ?? 'Home' },
        ...pathSegments.map((segment, index) => {
            const href = '/' + pathSegments.slice(0, index + 1).join('/');
            const label =
                routeLabels[segment] ??
                segment.charAt(0).toUpperCase() + segment.slice(1);
            return { href, label };
        })
    ]);

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
                appState.setLanding();
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

    let bookmarks = $state(false);
    let fullUrls = $state(true);
    let profileRadioValue = $state("benoit");
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if browser}
    <!-- debugging weird layout loading behaviour -->
<!--    <div style="position: fixed; top: 0; left: 50%; background: red; color: white; z-index: 9999; padding: 4px;">-->
<!--        LAYOUT LOADED - User: {user?.email || 'No user'}-->
<!--    </div>-->
    {#if user}
        <!--if user and appstate is currently 'admin'-->
        {#if appState.current === 'admin'}
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
            <!--no matter if admin or not show logout button in the bottom left-->
            <Button
                    onclick={accountToggle}
                    style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; left: 0; margin: 1rem;"
            >
                🔒
            </Button>
            <Button
                    onclick={toggleTheme}
                    style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; right: 0; margin: 1rem;"
            >
                🌙
            </Button>

            <!--do I really want the admin to have this sidebar dashboard setup ?-->
            {@render children?.()}
            <!--I don't know yet-->
        {:else if appState.current === 'main' && !currentPath.startsWith('/admin') }
            <!--no matter if admin or not show both buttons and account toggle bottom-->
            <Button
                    onclick={accountToggle}
                    style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; right: 0; margin: 1rem; z-index: 99;"
            >
                🔒
            </Button>
            <Button
                    onclick={toggleTheme}
                    style="aspect-ratio: 1 / 1; border: none; position: fixed; top: 0; right: 0; margin: 1rem; z-index: 99;"
            >
                🌙
            </Button>
            <Sidebar.Provider>
                <AppSidebar />
                <Sidebar.Inset>
                    <header
                            class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear"
                    >
                        <div class="flex items-center gap-2 px-4">
                            <Sidebar.Trigger class="-ml-1" />
                            <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
                            <Breadcrumb.Root>
                                {#each breadcrumbs as crumb, index}
                                    <Breadcrumb.Item>
                                        {#if index === breadcrumbs.length - 1}
                                            <span class="text-muted-foreground">{crumb.label}</span>
                                        {:else}
                                            <a href={crumb.href} class="hover:text-foreground transition-colors">
                                                {crumb.label}
                                            </a>
                                            <span class="text-muted-foreground mx-1">/&nbsp;</span>
                                        {/if}
                                    </Breadcrumb.Item>
                                {/each}
                            </Breadcrumb.Root>
                        </div>
                    </header>
                    <div class="p-8">{@render children?.()}</div>
                </Sidebar.Inset>
            </Sidebar.Provider>
        {:else}
            <Button
                    onclick={accountToggle}
                    style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; left: 0; margin: 1rem;"
            >
                🔒
            </Button>
            <Button
                    onclick={toggleTheme}
                    style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; right: 0; margin: 1rem;"
            >
                🌙
            </Button>
            <!--{@render children?.()}-->

            <div class="[--header-height:calc(--spacing(14))]">
                <Sidebar.Provider class="flex flex-col">
                    <header
                            class="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
                    >
                        <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                            <Sidebar.Trigger class="-ml-1" />
                            <AdminMenubar />
                        </div>
                    </header>
                    <div class="flex flex-1">
                        <AdminSidebar />
                        <Sidebar.Inset>
                            <header
                                    class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear"
                            >
                                <div class="flex items-center gap-2 px-4">

                                    <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
                                    <Breadcrumb.Root>
                                        {#each breadcrumbs as crumb, index}
                                            <Breadcrumb.Item>
                                                {#if index === breadcrumbs.length - 1}
                                                    <span class="text-muted-foreground">{crumb.label}</span>
                                                {:else}
                                                    <a href={crumb.href} class="hover:text-foreground transition-colors">
                                                        {crumb.label}
                                                    </a>
                                                    <span class="text-muted-foreground mx-1">/&nbsp;</span>
                                                {/if}
                                            </Breadcrumb.Item>
                                        {/each}
                                    </Breadcrumb.Root>
                                </div>
                            </header>
                            <div class="p-8">{@render children?.()}</div>
                        </Sidebar.Inset>
                    </div>
                </Sidebar.Provider>
            </div>
        {/if}
    {:else}
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
        {@render children?.()}
    {/if}
{:else}
    <!-- Fallback für Server-Side Rendering -->
    {@render children?.()}
{/if}

