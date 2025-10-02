I <script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { useDndContext, useDndMonitor, type DragStartEvent, type DragMoveEvent, type DragOverEvent, type DragEndEvent, type DragCancelEvent } from '@dnd-kit-svelte/core';

    let { log = false, name = 'DndMonitor' } = $props();

    let isDragging = $state(false);
    let active = $state<DragStartEvent['active'] | null>(null);
    let over = $state<DragOverEvent['over'] | null>(null);
    let lastEvent = $state<'dragStart' | 'dragMove' | 'dragOver' | 'dragEnd' | 'dragCancel' | null>(null);

    // New: expose droppables snapshot
    type DroppableInfo = {
        id: string | number;
        disabled?: boolean;
        hasNode: boolean;
        rect: null | { x: number; y: number; w: number; h: number };
    };
    let droppables = $state<DroppableInfo[]>([]);

    const ctx = useDndContext();

    function maybeLog(type: string, payload: any) {
        if (!log) return;
        const a = payload?.active?.id ?? null;
        const o = payload?.over?.id ?? null;
        console.log(`🧲 ${name}:${type}`, { active: a, over: o, raw: payload });
        // Also log the current droppables snapshot
        logDroppables(type);
    }

    function readDroppables(): DroppableInfo[] {
        const enabled = ctx.droppableContainers.getEnabled?.() ?? [];
        return enabled.map((c: any) => ({
            id: c.id,
            disabled: c.disabled ?? false,
            hasNode: !!c.node,
            rect: c.rect ? { x: c.rect.left, y: c.rect.top, w: c.rect.width, h: c.rect.height } : null,
        }));
    }

    function measure(ids?: Array<string | number>) {
        try { ctx.measureDroppableContainers?.(ids); } catch {}
    }

    function refreshDroppables() {
        droppables = readDroppables();
    }

    function logDroppables(label: string = 'droppables') {
        if (!log) return;
        const list = droppables.map((d) => ({
            id: d.id,
            disabled: d.disabled ?? false,
            hasNode: d.hasNode,
            rect: d.rect,
        }));
        console.log(`📦 ${name}:${label} (${list.length})`, list);
    }

    const dispatch = createEventDispatcher();

    useDndMonitor({
        onDragStart(e: DragStartEvent) {
            isDragging = true; active = e.active; over = null; lastEvent = 'dragStart';
            measure(); refreshDroppables();
            dispatch('dragStart', e); dispatch('update', { type: 'dragStart', isDragging, active, over });
            maybeLog('dragStart', e);
        },
        onDragMove(e: DragMoveEvent) {
            over = e.over ?? null; lastEvent = 'dragMove'; refreshDroppables();
            dispatch('dragMove', e); dispatch('update', { type: 'dragMove', isDragging, active, over });
            maybeLog('dragMove', e);
        },
        onDragOver(e: DragOverEvent) {
            over = e.over ?? null; lastEvent = 'dragOver'; refreshDroppables();
            dispatch('dragOver', e); dispatch('update', { type: 'dragOver', isDragging, active, over });
            maybeLog('dragOver', e);
        },
        onDragEnd(e: DragEndEvent) {
            over = e.over ?? null; lastEvent = 'dragEnd'; refreshDroppables();
            dispatch('dragEnd', e); dispatch('update', { type: 'dragEnd', isDragging, active, over });
            maybeLog('dragEnd', e);
            isDragging = false; active = null; over = null;
        },
        onDragCancel(e: DragCancelEvent) {
            lastEvent = 'dragCancel'; refreshDroppables();
            dispatch('dragCancel', e); dispatch('update', { type: 'dragCancel', isDragging, active, over });
            maybeLog('dragCancel', e);
            isDragging = false; active = null; over = null;
        },
    });

    onMount(() => {
        // Force a measurement so rects are available even before dragging
        try {
            const ids = ctx.droppableContainers.getEnabled?.().map((c: any) => c.id) ?? [];
            measure(ids);
        } catch {}
        queueMicrotask(() => {
            refreshDroppables();
            logDroppables('mount');
        });
    });

    // Expose state to parent
    export { isDragging, active, over, lastEvent, droppables };
</script>