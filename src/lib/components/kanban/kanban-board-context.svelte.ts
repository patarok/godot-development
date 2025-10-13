import { getContext, setContext } from 'svelte';

type KanbanContextValue = {
    activeCardId: string;
    draggableDescribedById: string;
    registerMonitor: (monitor: DndMonitor) => void;
    unregisterMonitor: (monitor: DndMonitor) => void;
    announce: (message: string) => void;
};

const KANBAN_KEY = Symbol('kanban-board');

export function setKanbanContext(value: KanbanContextValue) {
    setContext(KANBAN_KEY, value);
}

export function getKanbanContext(): KanbanContextValue {
    return getContext(KANBAN_KEY);
}