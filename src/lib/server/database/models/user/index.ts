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
    type UserPermissions,
    type UserAuthData
} from './UserDomainQueryModel';

// Re-export for convenience (domain-specific aliases only)
export type {
    UserSearchFilters as UserFilters,
    UserAuthData as AuthenticatedUser
};