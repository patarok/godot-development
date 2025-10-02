<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { useDndContext } from '@dnd-kit-svelte/core';
    const ctx = useDndContext();
    function snapshot(label='Droppable snapshot') {
        const enabled = ctx.droppableContainers.getEnabled?.() ?? [];
        const list = enabled.map((c) => ({
            id: c.id,
            hasNode: !!c.node,
            rect: c.rect ? { x: c.rect.left, y: c.rect.top, w: c.rect.width, h: c.rect.height } : null,
        }));
        console.log(`📦 ${label}: enabled=${enabled.length}`, list);
    }
    onMount(() => {
        // Give refs time to bind; then force a measure so rects & nodes are read
        setTimeout(() => {
            const ids = ctx.droppableContainers.getEnabled?.().map(c => c.id) ?? [];
            ctx.measureDroppableContainers?.(ids);
            setTimeout(() => snapshot('after measure'), 0);
        }, 0);
    });
</script>