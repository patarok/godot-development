<script lang="ts">
    import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
    import type { Attachment } from "svelte/attachments";
    import type { KanbanCard } from './kanban-board-types';
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";

    let {
        card,
        cardIndex,
        columnId,
        onCardUpdate
    }: {
        card: KanbanCard;
        cardIndex: number;
        columnId: string;
        onCardUpdate?: (cardId: string, title: string) => void;
    } = $props();

    const { ref, handleRef, isDragging } = useSortable({
        id: card.id,
        index: () => cardIndex,
        data: { type: 'card', columnId }
    });

    let isEditing = $state(false);
    let editTitle = $state(card.title);

    function handleSave() {
        if (editTitle.trim() && editTitle !== card.title) {
            onCardUpdate?.(card.id, editTitle);
        }
        isEditing = false;
    }

    function projectInitials(title?: string): string {
        if (!title) return '?';
        const parts = title.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return (parts[0]?.[0] ?? '?').toUpperCase();
    }

    function userInitials(user: { email: string; forename?: string | null; surname?: string | null }): string {
        const f = (user.forename ?? '').trim();
        const s = (user.surname ?? '').trim();
        if (f || s) return `${f[0] ?? ''}${s[0] ?? ''}`.toUpperCase();
        return (user.email[0] ?? '?').toUpperCase();
    }
</script>

<div
        {@attach ref}
        class="bg-card rounded-lg p-3 shadow-sm border hover:border-primary/50 transition-colors"
        class:opacity-50={isDragging.current}
        class:border-primary={isDragging.current}
        ondblclick={() => isEditing = true}
>
    {#if isEditing}
    <textarea
            bind:value={editTitle}
            class="w-full resize-none border-none focus:outline-none bg-transparent"
            rows="3"
            onblur={handleSave}
            onkeydown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'Escape') {
          isEditing = false;
          editTitle = card.title;
        }
      }}
            autofocus
    />
    {:else}
        <div class="flex items-start gap-2 mb-2">
            <!-- Project Avatar -->
            {#if card.project}
                <Avatar.Root class="size-6 flex-shrink-0">
                    <Avatar.Image src={card.project.avatarData} alt={card.project.title} />
                    <Avatar.Fallback class="text-xs">{projectInitials(card.project.title)}</Avatar.Fallback>
                </Avatar.Root>
            {/if}
            
            <!-- Task Title -->
            <p class="text-sm font-medium flex-1 line-clamp-2">{card.title}</p>
            
            <!-- Drag Handle -->
            <button
                    {@attach handleRef}
                    type="button"
                    class="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing flex-shrink-0"
            >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="5" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/>
                    <circle cx="9" cy="19" r="1.5"/>
                    <circle cx="15" cy="5" r="1.5"/>
                    <circle cx="15" cy="12" r="1.5"/>
                    <circle cx="15" cy="19" r="1.5"/>
                </svg>
            </button>
        </div>

        <!-- Description -->
        {#if card.description}
            <p class="text-xs text-muted-foreground mb-2 line-clamp-2">{card.description}</p>
        {/if}

        <!-- Metadata Row -->
        <div class="flex items-center justify-between gap-2 mt-2">
            <!-- Priority Badge -->
            {#if card.priority}
                <Badge variant="outline" class="text-xs px-1.5 py-0">
                    {card.priority}
                </Badge>
            {/if}

            <div class="flex-1"></div>

            <!-- Assignees -->
            {#if card.assignees && card.assignees.length > 0}
                <div class="flex -space-x-2">
                    {#each card.assignees.slice(0, 3) as assignee}
                        <Avatar.Root class="size-6 border-2 border-card">
                            <Avatar.Fallback class="text-xs bg-primary text-primary-foreground">
                                {userInitials(assignee)}
                            </Avatar.Fallback>
                        </Avatar.Root>
                    {/each}
                    {#if card.assignees.length > 3}
                        <div class="size-6 rounded-full bg-muted text-xs flex items-center justify-center border-2 border-card font-medium">
                            +{card.assignees.length - 3}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>