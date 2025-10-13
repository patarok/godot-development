<script lang="ts">
    import { flip } from 'svelte/animate';
    import KanbanCard from './kanban-board-card.svelte';
    import type { KanbanCard as Card, KanbanColumn } from './kanban-board-types';
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";

    let {
        column,
        columnIndex,
        onCardUpdate,
        onCardAdd,
        onColumnUpdate
    }: {
        column: KanbanColumn;
        columnIndex: number;
        onCardUpdate?: (cardId: string, title: string) => void;
        onCardAdd?: (columnId: string, title: string) => void;
        onColumnUpdate?: (columnId: string, title: string) => void;
    } = $props();

    let isAddingCard = $state(false);
    let newCardTitle = $state('');

    function handleAddCard(event: Event) {
        event.preventDefault();
        if (!newCardTitle.trim()) return;
        onCardAdd?.(column.id, newCardTitle);
        newCardTitle = '';
        isAddingCard = false;
    }

    // Check if column is today
    const isToday = $derived.by(() => {
        const today = new Date();
        const colDate = new Date(column.date);
        return (
            today.getFullYear() === colDate.getFullYear() &&
            today.getMonth() === colDate.getMonth() &&
            today.getDate() === colDate.getDate()
        );
    });
</script>

<div class="flex flex-col w-80 bg-muted/30 rounded-lg p-3 h-full min-h-0 flex-shrink-0"
     class:ring-2={isToday}
     class:ring-primary={isToday}>
    <!-- Column Header -->
    <div class="flex items-center justify-between mb-3 flex-shrink-0">
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: hsl(var(--{column.color}))"></div>
            <div class="flex flex-col">
                <h3 class="font-semibold text-sm leading-tight">{column.title}</h3>
                {#if isToday}
                    <span class="text-xs text-primary font-medium">Today</span>
                {/if}
            </div>
        </div>
        <span class="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
            {column.items.length}
        </span>
    </div>

    <!-- Card List - Scrollable -->
    <div class="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
        {#if column.items.length === 0}
            <div class="text-center text-muted-foreground text-sm py-8">
                No tasks for this day
            </div>
        {:else}
            {#each column.items as card, cardIndex (card.id)}
                <div animate:flip={{ duration: 200 }}>
                    <KanbanCard
                            {card}
                            {cardIndex}
                            columnId={column.id}
                            {onCardUpdate}
                    />
                </div>
            {/each}
        {/if}
    </div>

    <!-- Add Card Footer -->
    <div class="mt-3 flex-shrink-0">
        {#if isAddingCard}
            <form onsubmit={handleAddCard} class="space-y-2">
                <Input
                        bind:value={newCardTitle}
                        placeholder="Task title..."
                        class="text-sm"
                        autofocus
                />
                <div class="flex gap-2">
                    <Button type="submit" size="sm" class="flex-1">Add</Button>
                    <Button type="button" size="sm" variant="outline" onclick={() => { isAddingCard = false; newCardTitle = ''; }}>
                        Cancel
                    </Button>
                </div>
            </form>
        {:else}
            <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="w-full justify-start text-muted-foreground hover:text-foreground"
                    onclick={() => isAddingCard = true}
            >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add task
            </Button>
        {/if}
    </div>
</div>