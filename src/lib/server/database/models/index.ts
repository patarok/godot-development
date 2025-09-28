/** **** **** **** **/
/**   USER START   **/
/** **** **** **** **/

import {
    UserDomainModel,
    UserDomainQueryModel,
    type UserSearchFilters,
    type PaginationOptions,
    type PaginatedResult,
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
    PaginationOptions,
    PaginatedResult,
    UserPermissions,
    UserAuthData
} from './user';

// Alternative named exports (if you prefer direct imports)
export {
    UserDomainModel,
    UserDomainQueryModel
} from './user';

// Future model namespaces can follow the same pattern:
// export const Project = {
//     Domain: ProjectDomainModel,
//     Query: ProjectDomainQueryModel
// } as const;

// export const Task = {
//     Domain: TaskDomainModel,
//     Query: TaskDomainQueryModel
// } as const;

/** **** **** **** **/
/**   USER  END    **/
/** **** **** **** **/