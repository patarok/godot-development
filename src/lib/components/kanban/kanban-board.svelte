<script lang="ts">
    import { DragDropProvider } from "@dnd-kit-svelte/svelte";
    import KanbanColumn from './kanban-board-column.svelte';
    import KanbanBoardProvider from './kanban-board-provider.svelte';
    import type { KanbanColumn as Column, KanbanCard } from './kanban-board-types';

    let {
        tasks = [],
        states = [],
        priorities = [],
        types = [],
        users = [],
        projects = [],
        groupBy = 'weekday',
        onCardMove,
        onCardUpdate,
        onCardAdd
    }: {
        tasks: any[];
        states: any[];
        priorities?: any[];
        types?: any[];
        users?: any[];
        projects?: any[];
        groupBy?: 'status' | 'weekday';
        onCardMove?: (cardId: string, columnId: string, index: number) => void;
        onCardUpdate?: (cardId: string, title: string) => void;
        onCardAdd?: (columnId: string, title: string) => void;
    } = $props();

    let scrollContainer: HTMLDivElement;

    function handleCardMove(e: any) {
        const { active, over } = e;
        if (!over) return;

        // Extract card ID and target column/position info
        const cardId = active.id as string;
        const activeData = active.data?.current;
        
        // Determine target column and index
        let targetColumnId: string;
        let targetIndex: number;

        // Check if we're dropping over a card or directly over a column
        if (over.data?.current?.type === 'card') {
            // Dropping over another card
            targetColumnId = over.data.current.columnId;
            
            // Find the target card's index in its column
            const targetColumn = columns.find(col => col.id === targetColumnId);
            if (targetColumn) {
                targetIndex = targetColumn.items.findIndex(card => card.id === over.id);
            } else {
                targetIndex = 0;
            }
        } else {
            // Dropping directly in a column (empty area or column itself)
            targetColumnId = over.id as string;
            targetIndex = 0; // Add to top if dropping in empty column
        }

        // Call the move handler
        onCardMove?.(cardId, targetColumnId, targetIndex);
    }

    // Helper functions
    function taskToCard(task: any): KanbanCard {
        return {
            id: task.taskUuid || task.id,
            title: task.header,
            description: task.description,
            priority: task.priority,
            status: task.status,
            dueDate: task.plannedSchedule?.plannedDue,
            assignees: task.availableUsers?.filter((u: any) =>
                task.assignedUserIds?.includes(u.id)
            ) || [],
            project: task.project,
            isDone: task.status === 'Done',
            isActive: task.isActive
        };
    }

    function mapStateToColor(state: any): 'blue' | 'yellow' | 'purple' | 'green' | 'red' | 'primary' {
        const colorMap: Record<string, 'blue' | 'yellow' | 'purple' | 'green' | 'red' | 'primary'> = {
            'Todo': 'blue',
            'In Progress': 'yellow',
            'Review': 'purple',
            'Done': 'green',
            'Blocked': 'red'
        };
        return colorMap[state.name] || 'primary';
    }

    function getWeekdayColor(day: number): 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'primary' {
        const colors: ('red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'primary')[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'primary'];
        return colors[day];
    }

    function isSameDay(d1: Date, d2: Date) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function formatWeekday(date: Date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
    }

    function buildWeekdayColumns(tasks: any[]) {
        const columns = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const dayTasks = tasks.filter(task => {
                if (!task.plannedSchedule?.plannedStart) return false;
                const taskDate = new Date(task.plannedSchedule.plannedStart);
                return isSameDay(taskDate, date);
            });

            columns.push({
                id: date.toISOString().split('T')[0],
                title: formatWeekday(date),
                weekday: date.getDay(),
                date: date,
                color: getWeekdayColor(date.getDay()),
                items: dayTasks.map(taskToCard)
            });
        }

        return columns;
    }


    const columns = $derived.by(() => {
        if (groupBy === 'status') {
            // Build columns from states
            return states.map(state => ({
                id: state.id,
                title: state.name,
                color: mapStateToColor(state),
                items: tasks.filter(task => task.status === state.name).map(taskToCard)
            }));
        } else {
            // Build columns from weekdays (next 7 days)
            return buildWeekdayColumns(tasks);
        }
    });
</script>
<style>
    /* just for starting out inline style classes, but it would be good to translate this to Tailwind */
    .kanban-board-container {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        height: 100%;
        padding: 1rem;
        scroll-behavior: smooth;
    }

    .kanban-board-container::-webkit-scrollbar {
        height: 8px;
    }

    .kanban-board-container::-webkit-scrollbar-thumb {
        background: hsl(var(--muted-foreground) / 0.3);
        border-radius: 4px;
    }

    .kanban-column {
        flex-shrink: 0;
        width: 320px;
        display: flex;
        flex-direction: column;
        max-height: 100%;
    }

    .kanban-card-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
    }
</style>

<KanbanBoardProvider>
    <div
            bind:this={scrollContainer}
            class="flex gap-4 overflow-x-auto min-h-[600px] p-4 kanban-board-container"
    >
        <DragDropProvider onDragEnd={handleCardMove}>
            {#if columns.length === 0}
                <div class="flex items-center justify-center w-full text-muted-foreground">
                    <div class="text-center">
                        <p class="text-lg">No columns to display</p>
                        <p class="text-sm">Adjust your filters or add some tasks</p>
                    </div>
                </div>
            {:else}
                {#each columns as column, colIndex (column.id)}
                    <KanbanColumn
                            {column}
                            columnIndex={colIndex}
                            {onCardUpdate}
                            {onCardAdd}
                    />
                {/each}
            {/if}
        </DragDropProvider>
    </div>
</KanbanBoardProvider>