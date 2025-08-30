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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if browser}
	<button
			onclick={toggleTheme}
			style="aspect-ratio: 1 / 1; border: none; position: absolute; bottom: 0; right: 0; margin: 1rem;"
	>
		🌙
	</button>
{/if}

{@render children?.()}