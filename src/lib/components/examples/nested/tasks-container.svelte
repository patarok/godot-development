<script lang="ts" module>
	export type NestedItem = {
		id: string;
		title: string;
		description: string;
	};

	export type ContainerItem = {
		data: NestedItem;
		nesteds: NestedItem[];
	};

	interface ItemProps {
		children: Snippet<[isDragging: boolean]>;
		data: NestedItem;
		type: 'item' | 'container';
		class?: string;
		accepts: string[];
	}
</script>

<script lang="ts">
	import type {Snippet} from 'svelte';
	import {CSS, styleObjectToString} from '@dnd-kit-svelte/utilities';
	import {useSortable} from '@dnd-kit-svelte/sortable';

	let {data, children, type, accepts = [], class: className}: ItemProps = $props();

	const {attributes, listeners, node, activatorNode, transform, transition, isDragging, isSorting} = useSortable({
		id: data.id,
		data: {type, accepts},
	});

	const style = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(transform.current),
			transition: isSorting.current ? transition.current : undefined,
			zIndex: isDragging.current ? 1 : undefined,
		})
	);
</script>

<div class="relative" bind:this={node.current} {style}>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div class={["p-5 pt-6 bg-[#F9F9F9] rounded-3xl", className, { invisible: isDragging.current }]}>
		<div class="flex items-center justify-between text-[#9E9E9E]">
			<div class="pl-[22px]">
				<p class="text-lg font-bold relative flex items-start justify-start">
					<span class="w-[10px] h-[10px] bg-orange-500 rounded-full absolute -left-5"></span>
					{data.title}
				</p>
				<p class="text-sm font-medium">{data.description}</p>
			</div>

			<div
				class="cursor-pointer"
				bind:this={activatorNode.current}
				{...attributes.current}
				{...listeners.current}
			>
				<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
			</div>
		</div>

		<div class="grid gap-2 mt-3">
			{@render children(isDragging.current)}
		</div>
	</div>

	{#if isDragging.current}
		<div class="hidden md:block absolute inset-0 bg-orange-500/10 border border-dashed border-orange-500 rounded-3xl"></div>
	{/if}
</div>
