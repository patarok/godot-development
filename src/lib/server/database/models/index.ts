// Shared pagination generics (single canonical export)
export type { PaginationOptions, PaginatedResult, SortOrder } from './pagination';

/********************/
/**   USER START   **/
/********************/

import {
    UserDomainModel,
    UserDomainQueryModel,
    type UserSearchFilters,
    type UserPermissions,
    type UserAuthData
} from './user';

// User namespace export
export const User = {
    Domain: UserDomainModel,
    Query: UserDomainQueryModel
} as const;

// Export types for convenience
export type {
    UserSearchFilters,
    UserPermissions,
    UserAuthData
} from './user';

// Alternative named exports (if you prefer direct imports)
export {
    UserDomainModel,
    UserDomainQueryModel
} from './user';

/********************/
/**   USER  END    **/
/********************/

/********************/
/**   TASK START   **/
/********************/

import {
    TaskDomainModel,
    TaskDomainQueryModel,
    type TaskSearchFilters,
    type TaskDataShort,
} from './task';

// Task namespace export
export const Task = {
    Domain: TaskDomainModel,
    Query: TaskDomainQueryModel
} as const;

// Export types for convenience
export type {
    TaskSearchFilters,
    TaskDataShort,
} from './task';

// Alternative named exports (if you prefer direct imports)
export {
    TaskDomainModel,
    TaskDomainQueryModel
} from './task';

/********************/
/**    TASK END    **/
/********************/

// Future model namespaces can follow the same pattern:
// export const Project = {
//     Domain: ProjectDomainModel,
//     Query: ProjectDomainQueryModel
// } as const;