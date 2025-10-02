<script lang="ts">
    import { DndContext, useSensors, useSensor, MouseSensor, type DragEndEvent, closestCenter } from '@dnd-kit-svelte/core';
    import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit-svelte/sortable';
    import { CSS } from '@dnd-kit-svelte/utilities';

    type Item = { id: number; label: string };
    let items: Item[] = $state([{ id: 1, label: 'Alpha' }, { id: 2, label: 'Beta' }]);
    const sensors = useSensors(useSensor(MouseSensor, {})); // Start with only MouseSensor

    function handleDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        console.log('dragEnd', { active: active?.id, over: over?.id });
        if (active && over && active.id !== over.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            items = arrayMove(items, oldIndex, newIndex);
        }
    }
</script>

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {#each items as item (item.id)}
            <Row {item} />
        {/each}
    </SortableContext>
</DndContext>

<!-- One useSortable per row -->
{#snippet Row({ item }: { item: Item })}
    {@const { attributes, listeners, transform, transition, isDragging, node } = useSortable({ id: () => item.id })}
    <div
            bind:this={node.current}
            style="transform: {CSS.Transform.toString(transform.current)}; transition: {transition.current};"
            class="row"
            data-dragging={isDragging.current}
    >
        <button class="handle" {...attributes.current} {...listeners.current} aria-label="drag handle">⠿</button>
        <span>{item.label}</span>
    </div>
{/snippet}

<style>
    .row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        margin: 8px 0;
        background: white;
    }
    .row[data-dragging="true"] { opacity: 0.8; z-index: 10; }
    .handle { cursor: grab; user-select: none; touch-action: none; }
</style>