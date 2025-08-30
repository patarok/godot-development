<script lang="ts">

	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import {writable} from "svelte/store";
	import {browser} from "$app/environment";



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

	let { children } = $props();

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!--	<link rel="stylesheet" href="/reset.css">-->
</svelte:head>

{#if browser}
	<button
		onclick={toggleTheme}
		style="	aspect-ratio: 1 / 1;
				border: none;
				position: absolute;
				bottom: 0;
				right: 0;"
			  >
		🌙
	</button>
{/if}

{@render children?.()}
