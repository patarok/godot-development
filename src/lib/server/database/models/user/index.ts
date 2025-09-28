/**
 * User Domain Models Export
 *
 * This file exports both the UserDomainModel and UserDomainQueryModel
 * for clean imports throughout the application.
 */

export { UserDomainModel } from './UserDomainModel';
export {
    UserDomainQueryModel,
    type UserSearchFilters,
    type PaginationOptions,
    type PaginatedResult,
    type UserPermissions,
    type UserAuthData
} from './UserDomainQueryModel';

// Re-export for convenience
export type {
    UserSearchFilters as UserFilters,
    PaginatedResult as PaginatedUsers,
    UserAuthData as AuthenticatedUser
};