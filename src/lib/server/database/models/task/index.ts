/**
 * Task Domain Models Export
 *
 * This file exports both the TaskDomainModel and TaskDomainQueryModel
 * for clean imports throughout the application.
 */

export { TaskDomainModel } from './TaskDomainModel';
export {
    TaskDomainQueryModel,
    type TaskSearchFilters,
    type TaskDataShort,
} from './TaskDomainQueryModel';

// Re-export for convenience
export type {
    TaskSearchFilters as TaskFilters,
    TaskDataShort as TaskListItem,
};
