<script lang="ts">
    import { onMount } from 'svelte';
    import { invalidateAll } from '$app/navigation';
    import KanbanBoard from '$lib/components/kanban/kanban-board.svelte';
    import { kanbanStore } from '$lib/stores/kanban-store.svelte';
    import { Button } from "$lib/components/ui/button/index.js";
    import { toast } from "svelte-sonner";
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    // Initialize store with server data
    onMount(() => {
        kanbanStore.setColumns(data.columns);
    });

    // Watch for data changes and update store
    $effect(() => {
        kanbanStore.setColumns(data.columns);
    });

    async function handleCardMove(cardId: string, columnId: string, index: number) {
        // Optimistic update
        const rollback = kanbanStore.moveCard(cardId, columnId, index);
        
        try {
            const formData = new FormData();
            formData.append('cardId', cardId);
            formData.append('columnId', columnId);
            formData.append('index', String(index));

            const response = await fetch('?/moveCard', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result?.success && response.status !== 200) {
                throw new Error('Failed to move card');
            }

            // Clear history on success
            kanbanStore.clearHistory();
            
            // Refresh data from server
            await invalidateAll();
            
            toast.success('Task moved successfully');
        } catch (error) {
            // Rollback on failure
            rollback();
            toast.error('Failed to move task. Changes reverted.');
            console.error('Move card error:', error);
        }
    }

    async function handleCardUpdate(cardId: string, title: string) {
        // Optimistic update
        const rollback = kanbanStore.updateCard(cardId, { title });
        
        try {
            const formData = new FormData();
            formData.append('cardId', cardId);
            formData.append('title', title);

            const response = await fetch('?/updateCard', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result?.success && response.status !== 200) {
                throw new Error('Failed to update card');
            }

            kanbanStore.clearHistory();
            await invalidateAll();
            
            toast.success('Task updated successfully');
        } catch (error) {
            rollback();
            toast.error('Failed to update task. Changes reverted.');
            console.error('Update card error:', error);
        }
    }

    async function handleCardAdd(columnId: string, title: string) {
        // Create temporary card for optimistic update
        const tempCard = {
            id: `temp-${Date.now()}`,
            title,
            dueDate: columnId, // columnId is the date string
            isActive: true
        };

        const rollback = kanbanStore.addCard(columnId, tempCard);
        
        try {
            const formData = new FormData();
            formData.append('columnId', columnId);
            formData.append('title', title);

            const response = await fetch('?/addCard', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result?.success && response.status !== 200) {
                throw new Error('Failed to add card');
            }

            kanbanStore.clearHistory();
            await invalidateAll();
            
            toast.success('Task created successfully');
        } catch (error) {
            rollback();
            toast.error('Failed to create task. Changes reverted.');
            console.error('Add card error:', error);
        }
    }
</script>

<svelte:head>
    <title>Tasks - Kanban View</title>
</svelte:head>

<div class="flex flex-col h-screen">
    <div class="flex items-center justify-between p-4 border-b flex-shrink-0">
        <h1 class="text-2xl font-bold">Weekly Task Board</h1>
        <div class="flex gap-2">
            <Button variant="outline" size="sm" onclick={() => window.location.href = '/tasks'}>
                Table View
            </Button>
            <Button variant="default" size="sm">
                Kanban View
            </Button>
        </div>
    </div>

    <div class="flex-1 overflow-hidden">
        <KanbanBoard
                columns={kanbanStore.columns}
                onCardMove={handleCardMove}
                onCardUpdate={handleCardUpdate}
                onCardAdd={handleCardAdd}
        />
    </div>
</div>