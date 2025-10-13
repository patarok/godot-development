<script lang="ts">
	import type {Snippet} from 'svelte';

	interface SectionProps {
		id: string;
		title: string;
		link: string;
		children: Snippet;
	}

	let {id, title, link, children}: SectionProps = $props();
</script>

<section {id} class="container-base flex|col gap-5">
	<div class="flex|col gap-4 md:(flex-row flex-s-between) mb-4">
		<h2 class="text-2xl font-bold tracking--3%">{title}</h2>

	</div>

	<div class="droppable-container">
		{@render children()}
	</div>
</section>
