// User type for assignees
export type KanbanUser = {
    id: string;
    email: string;
    forename?: string | null;
    surname?: string | null;
    username?: string | null;
};

// Project type for card display
export type KanbanProject = {
    id: string;
    title: string;
    avatarData?: string | null;
};

// Card representing a task
export type KanbanCard = {
    id: string;
    title: string;
    description?: string | null;
    priority?: string | null;
    priorityId?: string | null;
    status?: string | null;
    statusId?: string | null;
    dueDate?: Date | string | null;
    assignees?: KanbanUser[];
    project?: KanbanProject | null;
    isDone?: boolean;
    isActive?: boolean;
};

// Color options for column circles
export type KanbanCircleColor =
    | 'primary'
    | 'blue'
    | 'red'
    | 'yellow'
    | 'green'
    | 'purple'
    | 'orange';

// Column representing a weekday
export type KanbanColumn = {
    id: string;           // weekday identifier (e.g., 'monday', '2025-01-13')
    title: string;        // weekday name (e.g., 'Monday', 'Jan 13')
    weekday: number;      // 0-6 (Sunday-Saturday)
    date: Date;           // actual date for the column
    color: KanbanCircleColor;
    items: KanbanCard[];
};

// Drop direction for DND
export type KanbanDropDirection = 'top' | 'bottom';