import { Repository, DataSource, SelectQueryBuilder, In } from 'typeorm';
import bcrypt from 'bcrypt';
import {
    User,
    Role,
    UserSubRole,
    SubRoleCfg,
    Permission,
    RolePermission,
    SubRolePermission,
    SubRolePermissionPermission,
    Session
} from '../entities';

/**
 * Interface for user search filters
 */
export interface UserSearchFilters {
    email?: string;
    username?: string;
    forename?: string;
    surname?: string;
    isActive?: boolean;
    roleId?: string;
    roleName?: string;
    hasSubRole?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

/**
 * Interface for pagination options
 */
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: 'email' | 'username' | 'forename' | 'surname' | 'createdAt' | 'updatedAt';
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Interface for paginated results
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * Interface for user permissions aggregated from roles and sub-roles
 */
export interface UserPermissions {
    userId: string;
    rolePermissions: Permission[];
    subRolePermissions: SubRolePermission[];
    allPermissionNames: string[];
}

/**
 * Interface for user authentication data
 */
export interface UserAuthData {
    user: User;
    permissions: string[];
    roles: {
        mainRole: Role;
        subRoles: SubRoleCfg[];
    };
}

/**
 * Domain query model for User read operations and queries.
 * This model is optimized for data retrieval, page loads, and reporting.
 *
 * Separation Note: This model operates independently and does NOT import UserDomainModel
 * to maintain clean separation and avoid circular dependencies.
 */
export class UserDomainQueryModel {
    private userRepository: Repository<User>;
    private roleRepository: Repository<Role>;
    private userSubRoleRepository: Repository<UserSubRole>;
    private subRoleCfgRepository: Repository<SubRoleCfg>;
    private permissionRepository: Repository<Permission>;
    private rolePermissionRepository: Repository<RolePermission>;
    private subRolePermissionRepository: Repository<SubRolePermission>;
    private subRolePermissionPermissionRepository: Repository<SubRolePermissionPermission>;
    private sessionRepository: Repository<Session>;

    constructor(private dataSource: DataSource) {
        this.userRepository = dataSource.getRepository(User);
        this.roleRepository = dataSource.getRepository(Role);
        this.userSubRoleRepository = dataSource.getRepository(UserSubRole);
        this.subRoleCfgRepository = dataSource.getRepository(SubRoleCfg);
        this.permissionRepository = dataSource.getRepository(Permission);
        this.rolePermissionRepository = dataSource.getRepository(RolePermission);
        this.subRolePermissionRepository = dataSource.getRepository(SubRolePermission);
        this.subRolePermissionPermissionRepository = dataSource.getRepository(SubRolePermissionPermission);
        this.sessionRepository = dataSource.getRepository(Session);
    }

    // ========================================
    // USER LOOKUP OPERATIONS
    // ========================================

    /**
     * Finds a user by their unique ID with optional relation loading.
     *
     * @param userId - UUID of the user to find
     * @param includeRelations - Whether to include role and sub-role relations (defaults to true)
     *
     * @returns Promise<User | null> - The found user or null if not found
     */
    async findUserById(userId: string, includeRelations: boolean = true): Promise<User | null> {
        const relations = includeRelations ? [
            'role',
            'subRoles',
            'subRoles.subRoleCfg'
        ] : [];

        return await this.userRepository.findOne({
            where: { id: userId },
            relations
        });
    }

    /**
     * Finds a user by their email address with optional relation loading.
     *
     * @param email - Email address to search for
     * @param includeRelations - Whether to include role and sub-role relations (defaults to true)
     *
     * @returns Promise<User | null> - The found user or null if not found
     */
    async findUserByEmail(email: string, includeRelations: boolean = true): Promise<User | null> {
        const relations = includeRelations ? [
            'role',
            'subRoles',
            'subRoles.subRoleCfg'
        ] : [];

        return await this.userRepository.findOne({
            where: { email },
            relations
        });
    }

    /**
     * Finds a user by their username with optional relation loading.
     *
     * @param username - Username to search for
     * @param includeRelations - Whether to include role and sub-role relations (defaults to true)
     *
     * @returns Promise<User | null> - The found user or null if not found
     */
    async findUserByUsername(username: string, includeRelations: boolean = true): Promise<User | null> {
        if (!username) return null;

        const relations = includeRelations ? [
            'role',
            'subRoles',
            'subRoles.subRoleCfg'
        ] : [];

        return await this.userRepository.findOne({
            where: { username },
            relations
        });
    }

    /**
     * Finds multiple users by their IDs.
     *
     * @param userIds - Array of user UUIDs to find
     * @param includeRelations - Whether to include role and sub-role relations (defaults to false for performance)
     *
     * @returns Promise<User[]> - Array of found users
     */
    async findUsersByIds(userIds: string[], includeRelations: boolean = false): Promise<User[]> {
        if (userIds.length === 0) return [];

        const relations = includeRelations ? [
            'role',
            'subRoles',
            'subRoles.subRoleCfg'
        ] : [];

        return await this.userRepository.find({
            where: { id: In(userIds) },
            relations
        });
    }

    // ========================================
    // USER LIST AND SEARCH OPERATIONS
    // ========================================

    /**
     * Retrieves a paginated list of users with filtering and sorting options.
     * Optimized for admin interfaces and user management screens.
     *
     * @param filters - Search and filter criteria (optional)
     * @param pagination - Pagination and sorting options (optional)
     *
     * @returns Promise<PaginatedResult<User>> - Paginated result with user data
     */
    async findUsers(
        filters: UserSearchFilters = {},
        pagination: PaginationOptions = {}
    ): Promise<PaginatedResult<User>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = pagination;

        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('user.subRoles', 'userSubRole')
            .leftJoinAndSelect('userSubRole.subRoleCfg', 'subRoleCfg');

        // Apply filters
        this.applyUserFilters(queryBuilder, filters);

        // Apply sorting
        queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

        // Apply pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        // Execute query and get total count
        const [data, total] = await queryBuilder.getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1
        };
    }

    /**
     * Performs a full-text search across user attributes.
     * Searches in email, username, forename, and surname fields.
     *
     * @param searchTerm - Text to search for
     * @param pagination - Pagination options (optional)
     * @param includeInactive - Whether to include inactive users (defaults to false)
     *
     * @returns Promise<PaginatedResult<User>> - Paginated search results
     */
    async searchUsers(
        searchTerm: string,
        pagination: PaginationOptions = {},
        includeInactive: boolean = false
    ): Promise<PaginatedResult<User>> {
        if (!searchTerm.trim()) {
            return await this.findUsers(
                includeInactive ? {} : { isActive: true },
                pagination
            );
        }

        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = pagination;

        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('user.subRoles', 'userSubRole')
            .leftJoinAndSelect('userSubRole.subRoleCfg', 'subRoleCfg');

        // Full-text search across multiple fields
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        queryBuilder.where(
            '(LOWER(user.email) LIKE :search OR ' +
            'LOWER(user.username) LIKE :search OR ' +
            'LOWER(user.forename) LIKE :search OR ' +
            'LOWER(user.surname) LIKE :search)',
            { search: searchPattern }
        );

        if (!includeInactive) {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
        }

        // Apply sorting and pagination
        queryBuilder.orderBy(`user.${sortBy}`, sortOrder);
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1
        };
    }

    /**
     * Finds users by their role.
     *
     * @param roleId - UUID of the role to search for
     * @param includeInactive - Whether to include inactive users (defaults to false)
     * @param pagination - Pagination options (optional)
     *
     * @returns Promise<PaginatedResult<User>> - Paginated users with the specified role
     */
    async findUsersByRole(
        roleId: string,
        includeInactive: boolean = false,
        pagination: PaginationOptions = {}
    ): Promise<PaginatedResult<User>> {
        const filters: UserSearchFilters = { roleId };
        if (!includeInactive) {
            filters.isActive = true;
        }

        return await this.findUsers(filters, pagination);
    }

    /**
     * Finds users who have a specific sub-role.
     *
     * @param subRoleId - UUID of the sub-role configuration to search for
     * @param includeInactive - Whether to include inactive users (defaults to false)
     * @param pagination - Pagination options (optional)
     *
     * @returns Promise<PaginatedResult<User>> - Paginated users with the specified sub-role
     */
    async findUsersBySubRole(
        subRoleId: string,
        includeInactive: boolean = false,
        pagination: PaginationOptions = {}
    ): Promise<PaginatedResult<User>> {
        const filters: UserSearchFilters = { hasSubRole: subRoleId };
        if (!includeInactive) {
            filters.isActive = true;
        }

        return await this.findUsers(filters, pagination);
    }

    // ========================================
    // AUTHENTICATION OPERATIONS
    // ========================================

    /**
     * Authenticates a user by email/username and password.
     * Returns complete user data with permissions for session establishment.
     *
     * @param identifier - Email address or username
     * @param password - Plain text password to verify
     *
     * @returns Promise<UserAuthData | null> - Complete auth data or null if authentication fails
     */
    async authenticateUser(identifier: string, password: string): Promise<UserAuthData | null> {
        // Try to find user by email first, then by username
        let user = await this.findUserByEmail(identifier, true);
        if (!user) {
            user = await this.findUserByUsername(identifier, true);
        }

        if (!user || !user.isActive) {
            return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        // Get user permissions
        const permissions = await this.getUserPermissions(user.id);

        // Prepare sub-roles data
        const subRoles = user.subRoles?.map(usr => usr.subRoleCfg) || [];

        return {
            user,
            permissions: permissions.allPermissionNames,
            roles: {
                mainRole: user.role,
                subRoles
            }
        };
    }

    /**
     * Verifies if a user has valid active sessions.
     *
     * @param userId - UUID of the user
     *
     * @returns Promise<boolean> - True if user has active sessions
     */
    async hasActiveSessions(userId: string): Promise<boolean> {
        const sessionCount = await this.sessionRepository.count({
            where: { user: { id: userId } }
        });
        return sessionCount > 0;
    }

    // ========================================
    // PERMISSION OPERATIONS
    // ========================================

    /**
     * Retrieves all permissions for a user from their main role and sub-roles.
     * Aggregates permissions from multiple sources and removes duplicates.
     *
     * @param userId - UUID of the user
     *
     * @returns Promise<UserPermissions> - Complete permission data for the user
     */
    async getUserPermissions(userId: string): Promise<UserPermissions> {
        const user = await this.findUserById(userId, true);
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Get role permissions
        const rolePermissions = await this.rolePermissionRepository
            .createQueryBuilder('rp')
            .leftJoinAndSelect('rp.permission', 'permission')
            .where('rp.roleId = :roleId', { roleId: user.role.id })
            .getMany();

        const permissions = rolePermissions.map(rp => rp.permission);

        // Get sub-role permissions
        const subRolePermissions: SubRolePermission[] = [];
        if (user.subRoles && user.subRoles.length > 0) {
            const subRoleIds = user.subRoles.map(usr => usr.subRoleCfgId);

            const subRolePerms = await this.subRolePermissionPermissionRepository
                .createQueryBuilder('srpp')
                .leftJoinAndSelect('srpp.subRolePermission', 'subRolePermission')
                .where('srpp.subRoleCfgId IN (:...subRoleIds)', { subRoleIds })
                .getMany();

            subRolePermissions.push(...subRolePerms.map(srpp => srpp.subRolePermission));
        }

        // Combine all permission names and remove duplicates
        const rolePermissionNames = permissions.map(p => p.name);
        const subRolePermissionNames = subRolePermissions.map(srp => srp.name);
        const allPermissionNames = [...new Set([...rolePermissionNames, ...subRolePermissionNames])];

        return {
            userId: user.id,
            rolePermissions: permissions,
            subRolePermissions,
            allPermissionNames
        };
    }

    /**
     * Checks if a user has a specific permission.
     *
     * @param userId - UUID of the user
     * @param permissionName - Name of the permission to check
     *
     * @returns Promise<boolean> - True if user has the permission
     */
    async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissions.allPermissionNames.includes(permissionName);
    }

    /**
     * Checks if a user has any of the specified permissions.
     *
     * @param userId - UUID of the user
     * @param permissionNames - Array of permission names to check
     *
     * @returns Promise<boolean> - True if user has at least one of the permissions
     */
    async userHasAnyPermission(userId: string, permissionNames: string[]): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissionNames.some(name => permissions.allPermissionNames.includes(name));
    }

    /**
     * Checks if a user has all of the specified permissions.
     *
     * @param userId - UUID of the user
     * @param permissionNames - Array of permission names to check
     *
     * @returns Promise<boolean> - True if user has all the permissions
     */
    async userHasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissionNames.every(name => permissions.allPermissionNames.includes(name));
    }

    // ========================================
    // ROLE AND SUB-ROLE QUERY OPERATIONS
    // ========================================

    /**
     * Retrieves all available roles for user assignment.
     *
     * @param includeInactive - Whether to include non-main roles (defaults to false)
     *
     * @returns Promise<Role[]> - Array of available roles
     */
    async getAvailableRoles(includeInactive: boolean = false): Promise<Role[]> {
        const where = includeInactive ? {} : { isMainRole: true };
        return await this.roleRepository.find({ where });
    }

    /**
     * Retrieves all available sub-role configurations.
     *
     * @returns Promise<SubRoleCfg[]> - Array of sub-role configurations
     */
    async getAvailableSubRoles(): Promise<SubRoleCfg[]> {
        return await this.subRoleCfgRepository.find({
            order: { title: 'ASC' }
        });
    }

    /**
     * Gets detailed information about a user's roles and permissions.
     * Useful for user profile displays and permission debugging.
     *
     * @param userId - UUID of the user
     *
     * @returns Promise<object> - Detailed role and permission information
     */
    async getUserRoleDetails(userId: string): Promise<{
        user: User;
        mainRole: Role;
        subRoles: SubRoleCfg[];
        allPermissions: UserPermissions;
        roleCount: number;
        permissionCount: number;
    }> {
        const user = await this.findUserById(userId, true);
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        const permissions = await this.getUserPermissions(userId);
        const subRoles = user.subRoles?.map(usr => usr.subRoleCfg) || [];

        return {
            user,
            mainRole: user.role,
            subRoles,
            allPermissions: permissions,
            roleCount: 1 + subRoles.length,
            permissionCount: permissions.allPermissionNames.length
        };
    }

    // ========================================
    // STATISTICS AND REPORTING OPERATIONS
    // ========================================

    /**
     * Gets user statistics for admin dashboards and reports.
     *
     * @returns Promise<object> - User statistics including counts and breakdowns
     */
    async getUserStatistics(): Promise<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        usersByRole: { [roleName: string]: number };
        recentUsers: number;
    }> {
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.count({ where: { isActive: true } });
        const inactiveUsers = totalUsers - activeUsers;

        // Users by role
        const roleStats = await this.userRepository
            .createQueryBuilder('user')
            .select('role.name', 'roleName')
            .addSelect('COUNT(user.id)', 'userCount')
            .leftJoin('user.role', 'role')
            .groupBy('role.name')
            .getRawMany();

        const usersByRole: { [roleName: string]: number } = {};
        roleStats.forEach(stat => {
            usersByRole[stat.roleName] = parseInt(stat.userCount);
        });

        // Recent users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = await this.userRepository.count({
            where: { createdAt: { $gte: thirtyDaysAgo } as any }
        });

        return {
            totalUsers,
            activeUsers,
            inactiveUsers,
            usersByRole,
            recentUsers
        };
    }

    /**
     * Validates if an email address is available for registration.
     *
     * @param email - Email address to check
     * @param excludeUserId - User ID to exclude from check (for updates)
     *
     * @returns Promise<boolean> - True if email is available
     */
    async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
        const where: any = { email };
        if (excludeUserId) {
            where.id = { $ne: excludeUserId } as any;
        }

        const existingUser = await this.userRepository.findOne({ where });
        return !existingUser;
    }

    /**
     * Validates if a username is available for registration.
     *
     * @param username - Username to check
     * @param excludeUserId - User ID to exclude from check (for updates)
     *
     * @returns Promise<boolean> - True if username is available
     */
    async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
        if (!username) return true; // Username is optional

        const where: any = { username };
        if (excludeUserId) {
            where.id = { $ne: excludeUserId } as any;
        }

        const existingUser = await this.userRepository.findOne({ where });
        return !existingUser;
    }

    // ========================================
    // ADVANCED QUERY OPERATIONS
    // ========================================

    /**
     * Finds users who have been inactive for a specified number of days.
     * Useful for cleanup operations and user engagement analysis.
     *
     * @param daysSinceLastActivity - Number of days since last login/activity
     * @param pagination - Pagination options (optional)
     *
     * @returns Promise<PaginatedResult<User>> - Paginated inactive users
     */
    async findInactiveUsers(
        daysSinceLastActivity: number,
        pagination: PaginationOptions = {}
    ): Promise<PaginatedResult<User>> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastActivity);

        const {
            page = 1,
            limit = 20,
            sortBy = 'updatedAt',
            sortOrder = 'ASC'
        } = pagination;

        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('user.sessions', 'session')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere(
                '(user.updatedAt < :cutoffDate OR session.id IS NULL)',
                { cutoffDate }
            )
            .groupBy('user.id')
            .addGroupBy('role.id');

        queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1
        };
    }

    /**
     * Gets users with the most permissions (useful for security auditing).
     *
     * @param limit - Maximum number of users to return (defaults to 10)
     *
     * @returns Promise<Array> - Users with permission counts
     */
    async getUsersWithMostPermissions(limit: number = 10): Promise<Array<{
        user: User;
        permissionCount: number;
        rolePermissionCount: number;
        subRolePermissionCount: number;
    }>> {
        const users = await this.userRepository.find({
            relations: ['role', 'subRoles', 'subRoles.subRoleCfg'],
            where: { isActive: true },
            take: 100 // Get a reasonable subset to analyze
        });

        const userPermissionData = await Promise.all(
            users.map(async (user) => {
                const permissions = await this.getUserPermissions(user.id);
                return {
                    user,
                    permissionCount: permissions.allPermissionNames.length,
                    rolePermissionCount: permissions.rolePermissions.length,
                    subRolePermissionCount: permissions.subRolePermissions.length
                };
            })
        );

        // Sort by total permission count and return top users
        return userPermissionData
            .sort((a, b) => b.permissionCount - a.permissionCount)
            .slice(0, limit);
    }

    /**
     * Finds users by permission name (who have a specific permission).
     *
     * @param permissionName - Name of the permission to search for
     * @param pagination - Pagination options (optional)
     *
     * @returns Promise<PaginatedResult<User>> - Users who have the permission
     */
    async findUsersByPermission(
        permissionName: string,
        pagination: PaginationOptions = {}
    ): Promise<PaginatedResult<User>> {
        const {
            page = 1,
            limit = 20,
            sortBy = 'email',
            sortOrder = 'ASC'
        } = pagination;

        // First, find all roles that have this permission
        const rolesWithPermission = await this.rolePermissionRepository
            .createQueryBuilder('rp')
            .leftJoin('rp.permission', 'permission')
            .leftJoin('rp.role', 'role')
            .where('permission.name = :permissionName', { permissionName })
            .select(['role.id'])
            .getRawMany();

        const roleIds = rolesWithPermission.map(r => r.role_id);

        // Find sub-roles that have this permission
        const subRolesWithPermission = await this.subRolePermissionPermissionRepository
            .createQueryBuilder('srpp')
            .leftJoin('srpp.subRolePermission', 'subRolePermission')
            .leftJoin('srpp.subRoleCfg', 'subRoleCfg')
            .where('subRolePermission.name = :permissionName', { permissionName })
            .select(['subRoleCfg.id'])
            .getRawMany();

        const subRoleIds = subRolesWithPermission.map(sr => sr.subrole_cfg_id);

        // Build query to find users
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('user.subRoles', 'userSubRole')
            .leftJoinAndSelect('userSubRole.subRoleCfg', 'subRoleCfg')
            .where('user.isActive = :isActive', { isActive: true });

        if (roleIds.length > 0 && subRoleIds.length > 0) {
            queryBuilder.andWhere(
                '(role.id IN (:...roleIds) OR subRoleCfg.id IN (:...subRoleIds))',
                { roleIds, subRoleIds }
            );
        } else if (roleIds.length > 0) {
            queryBuilder.andWhere('role.id IN (:...roleIds)', { roleIds });
        } else if (subRoleIds.length > 0) {
            queryBuilder.andWhere('subRoleCfg.id IN (:...subRoleIds)', { subRoleIds });
        } else {
            // No roles or sub-roles have this permission
            return {
                data: [],
                total: 0,
                page,
                limit,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false
            };
        }

        queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1
        };
    }

    // ========================================
    // USER PROFILE AND DISPLAY OPERATIONS
    // ========================================

    /**
     * Gets formatted user display information for UI components.
     *
     * @param userId - UUID of the user
     *
     * @returns Promise<object | null> - Formatted user display data or null if not found
     */
    async getUserDisplayInfo(userId: string): Promise<{
        id: string;
        displayName: string;
        email: string;
        initials: string;
        roleName: string;
        subRoleNames: string[];
        isActive: boolean;
        joinDate: Date;
        lastUpdate: Date;
    } | null> {
        const user = await this.findUserById(userId, true);
        if (!user) return null;

        const displayName = this.formatUserDisplayName(user);
        const initials = this.getUserInitials(user);
        const subRoleNames = user.subRoles?.map(usr => usr.subRoleCfg.title) || [];

        return {
            id: user.id,
            displayName,
            email: user.email,
            initials,
            roleName: user.role.name,
            subRoleNames,
            isActive: user.isActive,
            joinDate: user.createdAt,
            lastUpdate: user.updatedAt
        };
    }

    /**
     * Gets multiple user display info efficiently for lists and dropdowns.
     *
     * @param userIds - Array of user UUIDs
     *
     * @returns Promise<Array> - Array of formatted user display data
     */
    async getBulkUserDisplayInfo(userIds: string[]): Promise<Array<{
        id: string;
        displayName: string;
        email: string;
        initials: string;
        roleName: string;
        isActive: boolean;
    }>> {
        if (userIds.length === 0) return [];

        const users = await this.findUsersByIds(userIds, true);

        return users.map(user => ({
            id: user.id,
            displayName: this.formatUserDisplayName(user),
            email: user.email,
            initials: this.getUserInitials(user),
            roleName: user.role.name,
            isActive: user.isActive
        }));
    }

    // ========================================
    // REPORTING AND ANALYTICS OPERATIONS
    // ========================================

    /**
     * Gets detailed user activity report for admin dashboards.
     *
     * @param dateRange - Date range for the report (optional)
     * @param dateRange.startDate - Start date for analysis
     * @param dateRange.endDate - End date for analysis
     *
     * @returns Promise<object> - Comprehensive user activity report
     */
    async getUserActivityReport(dateRange?: {
        startDate: Date;
        endDate: Date;
    }): Promise<{
        summary: {
            totalUsers: number;
            activeUsers: number;
            newUsers: number;
            usersWithSessions: number;
        };
        roleDistribution: Array<{ roleName: string; count: number; percentage: number }>;
        subRoleDistribution: Array<{ subRoleName: string; count: number }>;
        activityMetrics: {
            averageRolesPerUser: number;
            averageSubRolesPerUser: number;
            mostCommonPermissions: Array<{ permission: string; userCount: number }>;
        };
    }> {
        const startDate = dateRange?.startDate;
        const endDate = dateRange?.endDate || new Date();

        // Basic counts
        let totalUsersQuery = this.userRepository.createQueryBuilder('user');
        let activeUsersQuery = this.userRepository.createQueryBuilder('user')
            .where('user.isActive = :isActive', { isActive: true });
        let newUsersQuery = this.userRepository.createQueryBuilder('user');

        if (startDate) {
            totalUsersQuery = totalUsersQuery.andWhere('user.createdAt <= :endDate', { endDate });
            newUsersQuery = newUsersQuery.andWhere('user.createdAt BETWEEN :startDate AND :endDate',
                { startDate, endDate });
        }

        const [totalUsers, activeUsers, newUsers] = await Promise.all([
            totalUsersQuery.getCount(),
            activeUsersQuery.getCount(),
            newUsersQuery.getCount()
        ]);

        // Users with active sessions
        const usersWithSessions = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.sessions', 'session')
            .where('user.isActive = :isActive', { isActive: true })
            .getCount();

        // Role distribution
        const roleDistribution = await this.userRepository
            .createQueryBuilder('user')
            .select('role.name', 'roleName')
            .addSelect('COUNT(user.id)', 'count')
            .leftJoin('user.role', 'role')
            .where('user.isActive = :isActive', { isActive: true })
            .groupBy('role.name')
            .getRawMany();

        const roleDistributionFormatted = roleDistribution.map(item => ({
            roleName: item.roleName,
            count: parseInt(item.count),
            percentage: Math.round((parseInt(item.count) / activeUsers) * 100)
        }));

        // Sub-role distribution
        const subRoleDistribution = await this.userSubRoleRepository
            .createQueryBuilder('usr')
            .select('subRoleCfg.title', 'subRoleName')
            .addSelect('COUNT(usr.id)', 'count')
            .leftJoin('usr.subRoleCfg', 'subRoleCfg')
            .leftJoin('usr.user', 'user')
            .where('user.isActive = :isActive', { isActive: true })
            .groupBy('subRoleCfg.title')
            .getRawMany();

        const subRoleDistributionFormatted = subRoleDistribution.map(item => ({
            subRoleName: item.subRoleName,
            count: parseInt(item.count)
        }));

        // Activity metrics
        const avgRolesPerUser = 1; // Every user has exactly one main role
        const totalSubRoleAssignments = subRoleDistributionFormatted
            .reduce((sum, item) => sum + item.count, 0);
        const avgSubRolesPerUser = activeUsers > 0 ?
            Math.round((totalSubRoleAssignments / activeUsers) * 100) / 100 : 0;

        // Most common permissions (simplified - would need more complex query for exact counts)
        const mostCommonPermissions = await this.permissionRepository
            .createQueryBuilder('permission')
            .leftJoin('permission.roles', 'rolePermission')
            .leftJoin('rolePermission.role', 'role')
            .leftJoin('role.users', 'user')
            .select('permission.name', 'permission')
            .addSelect('COUNT(DISTINCT user.id)', 'userCount')
            .where('user.isActive = :isActive', { isActive: true })
            .groupBy('permission.name')
            .orderBy('userCount', 'DESC')
            .limit(10)
            .getRawMany();

        const mostCommonPermissionsFormatted = mostCommonPermissions.map(item => ({
            permission: item.permission,
            userCount: parseInt(item.userCount)
        }));

        return {
            summary: {
                totalUsers,
                activeUsers,
                newUsers,
                usersWithSessions
            },
            roleDistribution: roleDistributionFormatted,
            subRoleDistribution: subRoleDistributionFormatted,
            activityMetrics: {
                averageRolesPerUser: avgRolesPerUser,
                averageSubRolesPerUser: avgSubRolesPerUser,
                mostCommonPermissions: mostCommonPermissionsFormatted
            }
        };
    }

    /**
     * Exports user data for reporting or data analysis.
     * Returns essential user information in a flat structure.
     *
     * @param filters - Optional filters to apply
     * @param includePermissions - Whether to include permission data (defaults to false for performance)
     *
     * @returns Promise<Array> - Array of user export data
     */
    async exportUserData(
        filters: UserSearchFilters = {},
        includePermissions: boolean = false
    ): Promise<Array<{
        id: string;
        email: string;
        username: string | null;
        forename: string | null;
        surname: string | null;
        displayName: string;
        isActive: boolean;
        roleName: string;
        subRoleNames: string;
        createdAt: Date;
        updatedAt: Date;
        permissions?: string;
    }>> {
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('user.subRoles', 'userSubRole')
            .leftJoinAndSelect('userSubRole.subRoleCfg', 'subRoleCfg');

        this.applyUserFilters(queryBuilder, filters);
        queryBuilder.orderBy('user.createdAt', 'ASC');

        const users = await queryBuilder.getMany();

        const exportData = await Promise.all(
            users.map(async (user) => {
                const subRoleNames = user.subRoles?.map(usr => usr.subRoleCfg.title).join(', ') || '';
                let permissions = '';

                if (includePermissions) {
                    const userPermissions = await this.getUserPermissions(user.id);
                    permissions = userPermissions.allPermissionNames.join(', ');
                }

                const result: any = {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    forename: user.forename,
                    surname: user.surname,
                    displayName: this.formatUserDisplayName(user),
                    isActive: user.isActive,
                    roleName: user.role.name,
                    subRoleNames,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                };

                if (includePermissions) {
                    result.permissions = permissions;
                }

                return result;
            })
        );

        return exportData;
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    /**
     * Private helper method to apply filters to a user query builder.
     *
     * @private
     * @param queryBuilder - TypeORM SelectQueryBuilder for User entity
     * @param filters - UserSearchFilters to apply
     */
    private applyUserFilters(
        queryBuilder: SelectQueryBuilder<User>,
        filters: UserSearchFilters
    ): void {
        if (filters.email) {
            queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
                email: `%${filters.email}%`
            });
        }

        if (filters.username) {
            queryBuilder.andWhere('LOWER(user.username) LIKE LOWER(:username)', {
                username: `%${filters.username}%`
            });
        }

        if (filters.forename) {
            queryBuilder.andWhere('LOWER(user.forename) LIKE LOWER(:forename)', {
                forename: `%${filters.forename}%`
            });
        }

        if (filters.surname) {
            queryBuilder.andWhere('LOWER(user.surname) LIKE LOWER(:surname)', {
                surname: `%${filters.surname}%`
            });
        }

        if (filters.isActive !== undefined) {
            queryBuilder.andWhere('user.isActive = :isActive', {
                isActive: filters.isActive
            });
        }

        if (filters.roleId) {
            queryBuilder.andWhere('role.id = :roleId', { roleId: filters.roleId });
        }

        if (filters.roleName) {
            queryBuilder.andWhere('LOWER(role.name) LIKE LOWER(:roleName)', {
                roleName: `%${filters.roleName}%`
            });
        }

        if (filters.hasSubRole) {
            queryBuilder.andWhere('subRoleCfg.id = :subRoleId', {
                subRoleId: filters.hasSubRole
            });
        }

        if (filters.createdAfter) {
            queryBuilder.andWhere('user.createdAt >= :createdAfter', {
                createdAfter: filters.createdAfter
            });
        }

        if (filters.createdBefore) {
            queryBuilder.andWhere('user.createdAt <= :createdBefore', {
                createdBefore: filters.createdBefore
            });
        }
    }

    /**
     * Private helper method to format user display name consistently.
     *
     * @private
     * @param user - User entity
     *
     * @returns string - Formatted display name
     */
    private formatUserDisplayName(user: User): string {
        if (user.forename && user.surname) {
            return `${user.forename} ${user.surname}`;
        } else if (user.forename) {
            return user.forename;
        } else if (user.surname) {
            return user.surname;
        } else if (user.username) {
            return user.username;
        } else {
            return user.email;
        }
    }

    /**
     * Private helper method to generate user initials for avatars.
     *
     * @private
     * @param user - User entity
     *
     * @returns string - User initials (1-2 characters)
     */
    private getUserInitials(user: User): string {
        if (user.forename && user.surname) {
            return (user.forename.charAt(0) + user.surname.charAt(0)).toUpperCase();
        } else if (user.forename) {
            return user.forename.charAt(0).toUpperCase();
        } else if (user.surname) {
            return user.surname.charAt(0).toUpperCase();
        } else if (user.username) {
            return user.username.charAt(0).toUpperCase();
        } else {
            return user.email.charAt(0).toUpperCase();
        }
    }
}