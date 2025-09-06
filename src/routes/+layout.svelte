<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';

	// Svelte 5 way: get props via $props(), no $: and no $page
	let { data, children }: { data: LayoutData; children: any } = $props();
	const user = data.user; // { username } | null

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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if browser}


	<button
			onclick={accountToggle}
			style="aspect-ratio: 1 / 1; border: none; position: fixed; top: 0; right: 0; margin: 1rem;"
	>
		🔒
	</button>
	<button
			onclick={toggleTheme}
			style="aspect-ratio: 1 / 1; border: none; position: fixed; bottom: 0; right: 0; margin: 1rem;"
	>
		🌙
	</button>
{/if}

{@render children?.()}