import { Repository, DataSource, QueryRunner } from 'typeorm';
import bcrypt from 'bcrypt';
import {
    User,
    Role,
    UserSubRole,
    SubRoleCfg,
    Session,
    PasswordResetToken
} from '../../entities';

/**
 * Domain model for managing User CRUD operations and write-related queries.
 * This model handles all user creation, updates, deletion, and manipulation operations.
 *
 * Separation Note: This model does NOT import UserDomainQueryModel to avoid circular dependencies.
 * For read-only operations, use UserDomainQueryModel separately.
 */
export class UserDomainModel {
    private userRepository: Repository<User>;
    private roleRepository: Repository<Role>;
    private userSubRoleRepository: Repository<UserSubRole>;
    private subRoleCfgRepository: Repository<SubRoleCfg>;
    private sessionRepository: Repository<Session>;
    private passwordResetTokenRepository: Repository<PasswordResetToken>;

    constructor(private dataSource: DataSource) {
        this.userRepository = dataSource.getRepository(User);
        this.roleRepository = dataSource.getRepository(Role);
        this.userSubRoleRepository = dataSource.getRepository(UserSubRole);
        this.subRoleCfgRepository = dataSource.getRepository(SubRoleCfg);
        this.sessionRepository = dataSource.getRepository(Session);
        this.passwordResetTokenRepository = dataSource.getRepository(PasswordResetToken);
    }

    // ========================================
    // USER CREATION OPERATIONS
    // ========================================

    /**
     * Creates a new user with specified role and optional sub-roles.
     * Handles password hashing, validation, and transactional creation.
     *
     * @param userData - User creation data
     * @param userData.email - Unique email address (required)
     * @param userData.password - Plain text password (will be hashed)
     * @param userData.forename - User's first name (optional)
     * @param userData.surname - User's last name (optional)
     * @param userData.username - Unique username (optional)
     * @param userData.roleId - UUID of the main role to assign
     * @param userData.subRoleIds - Array of sub-role configuration IDs (optional)
     * @param userData.isActive - Whether user should be active (defaults to true)
     *
     * @returns Promise<User> - The created user with populated relations
     * @throws Error if email/username already exists, role not found, or validation fails
     */
    async createUser(userData: {
        email: string;
        password: string;
        forename?: string;
        surname?: string;
        username?: string;
        roleId: string;
        subRoleIds?: string[];
        isActive?: boolean;
    }): Promise<User> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate role exists
            const role = await queryRunner.manager.findOne(Role, { where: { id: userData.roleId } });
            if (!role) {
                throw new Error(`Role with ID ${userData.roleId} not found`);
            }

            // Check email uniqueness
            const existingEmail = await queryRunner.manager.findOne(User, { where: { email: userData.email } });
            if (existingEmail) {
                throw new Error(`User with email ${userData.email} already exists`);
            }

            // Check username uniqueness if provided
            if (userData.username) {
                const existingUsername = await queryRunner.manager.findOne(User, { where: { username: userData.username } });
                if (existingUsername) {
                    throw new Error(`User with username ${userData.username} already exists`);
                }
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);

            // Create user
            const user = queryRunner.manager.create(User, {
                email: userData.email,
                password: hashedPassword,
                forename: userData.forename,
                surname: userData.surname,
                username: userData.username,
                isActive: userData.isActive ?? true,
                role: role
            });

            const savedUser = await queryRunner.manager.save(user);

            // Assign sub-roles if provided
            if (userData.subRoleIds && userData.subRoleIds.length > 0) {
                await this.assignSubRolesTransaction(queryRunner, savedUser.id, userData.subRoleIds);
            }

            await queryRunner.commitTransaction();

            // Return user with populated relations
            return await this.userRepository.findOne({
                where: { id: savedUser.id },
                relations: ['role', 'subRoles', 'subRoles.subRoleCfg']
            }) as User;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ========================================
    // USER UPDATE OPERATIONS
    // ========================================

    /**
     * Updates user profile information (non-sensitive data).
     *
     * @param userId - UUID of the user to update
     * @param updateData - Profile data to update
     * @param updateData.forename - New first name (optional)
     * @param updateData.surname - New last name (optional)
     * @param updateData.username - New username (optional, must be unique)
     * @param updateData.email - New email (optional, must be unique)
     *
     * @returns Promise<User> - Updated user with populated relations
     * @throws Error if user not found or validation fails
     */
    async updateUserProfile(userId: string, updateData: {
        forename?: string;
        surname?: string;
        username?: string;
        email?: string;
    }): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Check uniqueness constraints if updating email or username
        if (updateData.email && updateData.email !== user.email) {
            const existingEmail = await this.userRepository.findOne({
                where: { email: updateData.email }
            });
            if (existingEmail) {
                throw new Error(`Email ${updateData.email} is already in use`);
            }
        }

        if (updateData.username && updateData.username !== user.username) {
            const existingUsername = await this.userRepository.findOne({
                where: { username: updateData.username }
            });
            if (existingUsername) {
                throw new Error(`Username ${updateData.username} is already in use`);
            }
        }

        // Apply updates
        Object.assign(user, updateData);
        await this.userRepository.save(user);

        return await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role', 'subRoles', 'subRoles.subRoleCfg']
        }) as User;
    }

    /**
     * Changes user's password with validation.
     *
     * @param userId - UUID of the user
     * @param currentPassword - Current password for verification
     * @param newPassword - New password to set (will be hashed)
     *
     * @returns Promise<boolean> - True if password was changed successfully
     * @throws Error if user not found or current password is incorrect
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Hash and set new password
        user.password = await bcrypt.hash(newPassword, 12);
        await this.userRepository.save(user);

        return true;
    }

    /**
     * Resets user's password (admin operation or password reset flow).
     *
     * @param userId - UUID of the user
     * @param newPassword - New password to set (will be hashed)
     *
     * @returns Promise<boolean> - True if password was reset successfully
     * @throws Error if user not found
     */
    async resetPassword(userId: string, newPassword: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await this.userRepository.save(user);

        return true;
    }

    /**
     * Activates or deactivates a user account.
     *
     * @param userId - UUID of the user
     * @param isActive - True to activate, false to deactivate
     *
     * @returns Promise<User> - Updated user
     * @throws Error if user not found
     */
    async setUserActiveStatus(userId: string, isActive: boolean): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        user.isActive = isActive;
        return await this.userRepository.save(user);
    }

    // ========================================
    // ROLE MANAGEMENT OPERATIONS
    // ========================================

    /**
     * Changes user's main role.
     *
     * @param userId - UUID of the user
     * @param roleId - UUID of the new role to assign
     *
     * @returns Promise<User> - Updated user with populated role relation
     * @throws Error if user or role not found
     */
    async changeUserRole(userId: string, roleId: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        const role = await this.roleRepository.findOne({ where: { id: roleId } });
        if (!role) {
            throw new Error(`Role with ID ${roleId} not found`);
        }

        user.role = role;
        await this.userRepository.save(user);

        return await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role']
        }) as User;
    }

    /**
     * Assigns multiple sub-roles to a user, replacing any existing sub-roles.
     *
     * @param userId - UUID of the user
     * @param subRoleIds - Array of sub-role configuration IDs to assign
     *
     * @returns Promise<UserSubRole[]> - Array of created sub-role assignments
     * @throws Error if user not found or any sub-role doesn't exist
     */
    async assignSubRoles(userId: string, subRoleIds: string[]): Promise<UserSubRole[]> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const result = await this.assignSubRolesTransaction(queryRunner, userId, subRoleIds);
            await queryRunner.commitTransaction();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Removes specific sub-roles from a user.
     *
     * @param userId - UUID of the user
     * @param subRoleIds - Array of sub-role configuration IDs to remove
     *
     * @returns Promise<boolean> - True if sub-roles were removed successfully
     * @throws Error if user not found
     */
    async removeSubRoles(userId: string, subRoleIds: string[]): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        await this.userSubRoleRepository.delete({
            userId: userId,
            subRoleCfgId: { $in: subRoleIds } as any
        });

        return true;
    }

    /**
     * Removes all sub-roles from a user.
     *
     * @param userId - UUID of the user
     *
     * @returns Promise<boolean> - True if all sub-roles were removed successfully
     * @throws Error if user not found
     */
    async clearAllSubRoles(userId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        await this.userSubRoleRepository.delete({ userId: userId });
        return true;
    }

    // ========================================
    // USER DELETION OPERATIONS
    // ========================================

    /**
     * Soft deletes a user by deactivating them (recommended approach).
     *
     * @param userId - UUID of the user to soft delete
     *
     * @returns Promise<User> - The deactivated user
     * @throws Error if user not found
     */
    async softDeleteUser(userId: string): Promise<User> {
        return await this.setUserActiveStatus(userId, false);
    }

    /**
     * Hard deletes a user and all related data (use with caution).
     * This will remove the user and cascade delete sessions, password reset tokens, and sub-role assignments.
     *
     * @param userId - UUID of the user to permanently delete
     *
     * @returns Promise<boolean> - True if user was deleted successfully
     * @throws Error if user not found
     */
    async hardDeleteUser(userId: string): Promise<boolean> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
            if (!user) {
                throw new Error(`User with ID ${userId} not found`);
            }

            // Delete related data (TypeORM will handle cascading for some, but being explicit)
            await queryRunner.manager.delete(UserSubRole, { userId: userId });
            await queryRunner.manager.delete(Session, { user: { id: userId } });
            await queryRunner.manager.delete(PasswordResetToken, { user: { id: userId } });

            // Delete the user
            await queryRunner.manager.delete(User, { id: userId });

            await queryRunner.commitTransaction();
            return true;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ========================================
    // SESSION MANAGEMENT OPERATIONS
    // ========================================

    /**
     * Invalidates all sessions for a user (useful for security operations).
     *
     * @param userId - UUID of the user whose sessions to invalidate
     *
     * @returns Promise<boolean> - True if sessions were invalidated successfully
     * @throws Error if user not found
     */
    async invalidateAllUserSessions(userId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        await this.sessionRepository.delete({ user: { id: userId } });
        return true;
    }

    // ========================================
    // PASSWORD RESET TOKEN OPERATIONS
    // ========================================

    /**
     * Cleans up expired password reset tokens for a user.
     *
     * @param userId - UUID of the user
     *
     * @returns Promise<boolean> - True if cleanup was successful
     * @throws Error if user not found
     */
    async cleanupExpiredPasswordResetTokens(userId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // This assumes your PasswordResetToken entity has an expiresAt field
        await this.passwordResetTokenRepository
            .createQueryBuilder()
            .delete()
            .where('user_id = :userId', { userId })
            .andWhere('expires_at < :now', { now: new Date() })
            .execute();

        return true;
    }

    // ========================================
    // VALIDATION OPERATIONS
    // ========================================

    /**
     * Validates if a user exists and is active.
     *
     * @param userId - UUID of the user to validate
     *
     * @returns Promise<boolean> - True if user exists and is active
     */
    async validateUserExists(userId: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true }
        });
        return !!user;
    }

    /**
     * Validates password strength (implement your own rules).
     *
     * @param password - Password to validate
     * @param minLength - Minimum password length (defaults to 8)
     *
     * @returns Promise<boolean> - True if password meets requirements
     * @throws Error with specific validation failure message
     */
    async validatePasswordStrength(password: string, minLength: number = 8): Promise<boolean> {
        if (password.length < minLength) {
            throw new Error(`Password must be at least ${minLength} characters long`);
        }

        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        if (!/[0-9]/.test(password)) {
            throw new Error('Password must contain at least one number');
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            throw new Error('Password must contain at least one special character');
        }

        return true;
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    /**
     * Private helper method to assign sub-roles within a transaction.
     *
     * @private
     * @param queryRunner - TypeORM QueryRunner for transaction management
     * @param userId - UUID of the user
     * @param subRoleIds - Array of sub-role configuration IDs
     *
     * @returns Promise<UserSubRole[]> - Created sub-role assignments
     */
    private async assignSubRolesTransaction(
        queryRunner: QueryRunner,
        userId: string,
        subRoleIds: string[]
    ): Promise<UserSubRole[]> {
        // Validate user exists
        const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Validate all sub-roles exist
        const subRoles = await queryRunner.manager.findByIds(SubRoleCfg, subRoleIds);
        if (subRoles.length !== subRoleIds.length) {
            const foundIds = subRoles.map(sr => sr.id);
            const missingIds = subRoleIds.filter(id => !foundIds.includes(id));
            throw new Error(`Sub-roles not found: ${missingIds.join(', ')}`);
        }

        // Remove existing sub-role assignments
        await queryRunner.manager.delete(UserSubRole, { userId: userId });

        // Create new sub-role assignments
        const userSubRoles: UserSubRole[] = [];
        for (const subRoleId of subRoleIds) {
            const userSubRole = queryRunner.manager.create(UserSubRole, {
                userId: userId,
                subRoleCfgId: subRoleId,
                user: user,
                subRoleCfg: subRoles.find(sr => sr.id === subRoleId)!
            });
            userSubRoles.push(await queryRunner.manager.save(userSubRole));
        }

        return userSubRoles;
    }
}