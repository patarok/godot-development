<script lang="ts">
    import { setContext } from 'svelte';
    import type { Snippet } from 'svelte';

    let {
        children
    }: {
        children: Snippet;
    } = $props();

    // Simple context for future accessibility features
    let activeCardId = $state('');
    const kanbanContext = {
        get activeCardId() { return activeCardId; },
        set activeCardId(value) { activeCardId = value; },
        draggableDescribedById: 'kanban-instructions',
    };

    setContext('kanban-board', kanbanContext);
</script>

<!-- Screen reader instructions -->
<div id="kanban-instructions" class="sr-only">
    Use arrow keys to move cards between columns and positions.
    Press Space to pick up or drop a card.
    Press Escape to cancel.
</div>

<!-- Render children -->
{@render children()}

<style>
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
</style>
