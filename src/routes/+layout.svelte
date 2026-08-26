<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import '../app.css';
    import { browser } from '$app/environment';
    import type { LayoutData } from './$types';
    import { Button } from "$lib/components/ui/button"
    import { page } from '$app/state';
    import * as Menubar from "$lib/components/ui/menubar/index.js";
    import { appState } from '$lib/state.svelte.js';
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import AdminSidebar from "$lib/components/admin-sidebar.svelte";
    import AdminMenubar from "$lib/components/admin-menubar.svelte";
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.ts";
    import { Separator } from "$lib/components/ui/separator/index.ts";
    import * as Sidebar from "$lib/components/ui/sidebar/index.ts";

    let { data, children }: { data: LayoutData; children: any } = $props();
    const user = $derived(data.user);

    // Server-seitige Wahrheit (Cookie aus +layout.server.ts) als initiale Quelle.
    // `mode` ist SSR-korrekt, weil data.appState auch auf dem Server verfügbar ist
    // (im Gegensatz zu appState.current, das client-only ist und auf dem Server
    // immer 'landing' liefert — das war der Grund für das Masken-Flackern).
    let mode = $state<string>(data.appState ?? 'landing');

    // Nur EINMAL hydraten (beim Mount), sonst überschreibt ein re-run den
    // Client-State bei setMain/setAdmin mit dem stale data.appState zurück.
    $effect(() => {
        if (browser) {
            appState.hydrate(data.appState);
        }
    });

    // Reaktiv: `mode` folgt dem Client-State, damit SPA-Navigationen
    // (setMain/setAdmin/setLanding) die Maske umschalten, ohne dass
    // data.appState neu vom Server kommt.
    $effect(() => {
        if (browser) {
            mode = appState.current;
        }
    });

    // Route-Mapping
    const routeLabels: Record<string, string> = {
        '': 'Home',
        'dashboard': 'Dashboard',
        'users': 'Users',
        'settings': 'Settings'
    };

    const currentPath = $derived(page.url.pathname);
    const pathSegments = $derived(
        page.url.pathname.split('/').filter(Boolean)
    );
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

    function setTheme(newTheme: 'light' | 'dark') {
        appState.setTheme(newTheme);
    }

    function toggleTheme() {
        appState.toggleTheme();
    }

    async function accountToggle() {
        const currentUser = data.user;
        if (!browser) return;

        if (currentUser) {
            try {
                const res = await fetch('/api/logout', { method: 'POST' });
                if (!res.ok) throw new Error('Logout failed');
                appState.setLanding();
                window.location.reload();
            } catch (e) {
                console.error(e);
                window.location.reload();
            }
        } else {
            window.location.href = '/login';
        }
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
    {#if user}
        {#if mode === 'admin'}
            <!-- Admin Layout -->
            <Menubar class="px-2">
                {#each menubarMenus as { title, items }}
                    <Menubar.Menu>
                        <Menubar.Trigger class="px-3 py-2 font-medium">{title}</Menubar.Trigger>
                        <Menubar.Content class="min-w-48">
                            {#each items as item, i}
                                <Menubar.Item class="cursor-pointer">
                                    {typeof item === 'string' ? item : item.label}
                                </Menubar.Item>
                                {#if i < items.length - 1}
                                    <Menubar.Separator />
                                {/if}
                            {/each}
                        </Menubar.Content>
                    </Menubar.Menu>
                {/each}
            </Menubar>
            {@render children?.()}

        {:else if mode === 'main' && !currentPath.startsWith('/admin')}
            <!-- Main Layout with Sidebar -->
            <Sidebar.Provider>
                <AppSidebar />
                <Sidebar.Inset>
                    <header class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
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
                    <div class="m-8">{@render children?.()}</div>
                </Sidebar.Inset>
            </Sidebar.Provider>

        {:else}
            <!-- Fallback Layout -->
            <div class="[--header-height:calc(--spacing(14))]">
                <Sidebar.Provider class="flex flex-col">
                    <header class="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear fixed min-w-full z-50 bg-sidebar">
                        <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                            <Sidebar.Trigger class="-ml-1" />
                            <AdminMenubar />
                        </div>
                    </header>
                    <div class="flex flex-1">
                        <AdminSidebar />
                        <Sidebar.Inset>
                            <header class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
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
        <!-- Guest Layout -->
        <!-- TODO: delete if menubar double-checked -->
        <!-- <Button
                onclick={accountToggle}
                style="aspect-ratio: 1 / 1; border: none; position: fixed; top: 0; right: 0; margin: 1rem;"
        >
            🔒
        </Button>
        <Button
                onclick={toggleTheme}
                style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; right: 0; margin: 1rem;"
        >
            🌙
        </Button> -->
        {@render children?.()}
    {/if}
{:else}
    <!-- SSR Fallback -->
    {@render children?.()}
{/if}