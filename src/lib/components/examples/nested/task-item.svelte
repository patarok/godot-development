<script lang="ts" module>
	export type IData = {
		id: string;
		title: string;
		description: string;
	};

	interface ItemProps {
		data: IData;
		type: 'item' | 'container';
	}
</script>

<script lang="ts">
	import {CSS, styleObjectToString} from '@dnd-kit-svelte/utilities';
	import {useSortable} from '@dnd-kit-svelte/sortable';

	let {data, type}: ItemProps = $props();

	const {attributes, listeners, node, activatorNode, transform, transition, isDragging, isSorting, isOver} =
		useSortable({
			id: data.id,
			data: {type},
		});

	const style = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(transform.current),
			transition: isSorting.current ? transition.current : undefined,
			zIndex: isDragging.current ? 1 : undefined,
		})
	);
</script>

<div class="relative select-none" bind:this={node.current} {style}>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div class={["p-3 bg-white rounded-2xl flex items-center justify-between", { invisible: isDragging.current, 'bg-orange-500/5': isOver.current }]}>
		<div class="">
			<p class="text-lg font-bold">{data.title}</p>
			<p class="text-sm text-gray-500">{data.description}</p>
		</div>

		<div
			class="cursor-pointer"
			bind:this={activatorNode.current}
			{...attributes.current}
			{...listeners.current}
		>
			<svg class="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
		</div>
	</div>

	<!-- Drag placeholder -->
	{#if isDragging.current}
		<div class="flex items-center justify-center absolute inset-0">
			<!-- You can put any content here for the dragging state -->
			<div class="w-full h-full bg-orange-500/10 rounded-2xl border-2 border-orange-500 border-dashed flex items-center justify-center">
				<span class="text-orange-500">Moving: {data.title}</span>
			</div>
		</div>
	{/if}
</div>
