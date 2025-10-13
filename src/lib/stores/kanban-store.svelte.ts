import { writable } from 'svelte/store';
import type { KanbanColumn, KanbanCard } from '$lib/components/kanban/kanban-board-types';

type KanbanState = {
    columns: KanbanColumn[];
    isLoading: boolean;
    error: string | null;
};

type HistoryEntry = {
    columns: KanbanColumn[];
    timestamp: number;
};

class KanbanStore {
    private state = $state<KanbanState>({
        columns: [],
        isLoading: false,
        error: null
    });

    private history: HistoryEntry[] = [];
    private maxHistorySize = 10;

    get columns() {
        return this.state.columns;
    }

    get isLoading() {
        return this.state.isLoading;
    }

    get error() {
        return this.state.error;
    }

    // Initialize columns from server data
    setColumns(columns: KanbanColumn[]) {
        this.state.columns = columns;
        this.state.error = null;
    }

    // Save current state to history (for rollback)
    private saveToHistory() {
        this.history.push({
            columns: JSON.parse(JSON.stringify(this.state.columns)),
            timestamp: Date.now()
        });

        // Keep history size limited
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    // Rollback to previous state
    rollback() {
        const previous = this.history.pop();
        if (previous) {
            this.state.columns = previous.columns;
            this.state.error = null;
        }
    }

    // Optimistically move a card between columns/positions
    moveCard(cardId: string, targetColumnId: string, targetIndex: number): () => void {
        this.saveToHistory();

        // Find the card in current columns
        let sourceCard: KanbanCard | null = null;
        let sourceColumnIndex = -1;
        let sourceCardIndex = -1;

        for (let i = 0; i < this.state.columns.length; i++) {
            const cardIndex = this.state.columns[i].items.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                sourceCard = this.state.columns[i].items[cardIndex];
                sourceColumnIndex = i;
                sourceCardIndex = cardIndex;
                break;
            }
        }

        if (!sourceCard) {
            return () => {}; // Card not found, nothing to rollback
        }

        // Remove card from source column
        this.state.columns[sourceColumnIndex].items = this.state.columns[sourceColumnIndex].items.filter(
            c => c.id !== cardId
        );

        // Find target column and insert card
        const targetColumnIndex = this.state.columns.findIndex(c => c.id === targetColumnId);
        if (targetColumnIndex !== -1) {
            // Update card's dueDate to match the target column's date
            const updatedCard = {
                ...sourceCard,
                dueDate: this.state.columns[targetColumnIndex].date
            };

            const targetItems = [...this.state.columns[targetColumnIndex].items];
            targetItems.splice(targetIndex, 0, updatedCard);
            this.state.columns[targetColumnIndex].items = targetItems;
        }

        // Return rollback function
        return () => this.rollback();
    }

    // Optimistically update a card's title
    updateCard(cardId: string, updates: Partial<KanbanCard>): () => void {
        this.saveToHistory();

        for (let i = 0; i < this.state.columns.length; i++) {
            const cardIndex = this.state.columns[i].items.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                this.state.columns[i].items[cardIndex] = {
                    ...this.state.columns[i].items[cardIndex],
                    ...updates
                };
                break;
            }
        }

        return () => this.rollback();
    }

    // Optimistically add a new card
    addCard(columnId: string, card: KanbanCard): () => void {
        this.saveToHistory();

        const columnIndex = this.state.columns.findIndex(c => c.id === columnId);
        if (columnIndex !== -1) {
            this.state.columns[columnIndex].items = [
                ...this.state.columns[columnIndex].items,
                card
            ];
        }

        return () => this.rollback();
    }

    // Optimistically delete a card
    deleteCard(cardId: string): () => void {
        this.saveToHistory();

        for (let i = 0; i < this.state.columns.length; i++) {
            const cardIndex = this.state.columns[i].items.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                this.state.columns[i].items = this.state.columns[i].items.filter(
                    c => c.id !== cardId
                );
                break;
            }
        }

        return () => this.rollback();
    }

    // Set loading state
    setLoading(loading: boolean) {
        this.state.isLoading = loading;
    }

    // Set error state
    setError(error: string | null) {
        this.state.error = error;
    }

    // Clear history (e.g., after successful backend confirmation)
    clearHistory() {
        this.history = [];
    }
}

export const kanbanStore = new KanbanStore();
