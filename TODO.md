### Goal
Finish the review by pinpointing every entity/config file that needs edits so TypeORM synchronize works cleanly on a fresh DB (after you recreated app_db). Below is a file-by-file checklist with exact issues and concrete change suggestions, followed by a short sequence to get sync running.

---

### Critical configuration: DataSource
File: src/lib/server/database/config/datasource.ts
- Incorrect imports and missing imports:
    - Remove import of non-existent UserRole: `import { UserRole } from '../entities/user/UserRole.ts';` (file not present; not used).
    - ContractorMail is imported from SimpleMail path: `import { ContractorMail } from "../entities/mail/SimpleMail"`; change to `../entities/mail/ContractorMail.ts`.
    - Missing imports for SubRole entities used in entities array: SubRoleCfg, SubRolePermission, SubRolePermissionPermission.
    - If you want Attachment and MailAudit tables created, you must also import and list them explicitly (they live in the same file as ContractorMail).
- Entities array contains undeclared symbols and is incomplete:
    - You reference `SubRoleCfg, SubRolePermission, SubRolePermissionPermission` but they aren’t imported.
    - If you need the nested mail entities: add Attachment and MailAudit.
- Suggested fixed header and entities list (illustrative):
    - Add:
        - `import { SubRoleCfg } from '../entities/user/SubRoleCfg.ts';`
        - `import { SubRolePermission } from '../entities/user/SubRolePermission.ts';`
        - `import { SubRolePermissionPermission } from '../entities/user/SubRolePermissionPermission.ts';`
        - `import { ContractorMail, Attachment, MailAudit } from '../entities/mail/ContractorMail.ts';`
    - Remove: the `UserRole` import and any reference to it in entities.
    - Ensure the entities array includes:
        - User, Role, Permission, RolePermission,
        - SubRoleCfg, SubRolePermission, SubRolePermissionPermission,
        - Session, PasswordResetToken,
        - SystemSetting,
        - Task, TaskTag, UserTask, Tag,
        - Priority, TaskStatus, ProjectStatus, RiskLevel,
        - Project, ProjectUser, ProjectTag, ProjectCreator, ProjectCircle, ProjectAssignedUser, ProjectResponsibleUser,
        - Deadline, DeadlineTag,
        - Solution, Impediment, ImpedimentMedian,
        - Mail, SimpleMail, ContractorMail, Attachment, MailAudit.

Why this matters: Until an entity class appears in the `entities` array, synchronize will not create the table.

---

### User/Role/Permission domain

File: src/lib/server/database/entities/user/User.ts
- Import issues:
    - Uses `@ManyToOne` but doesn’t import ManyToOne.
    - Imports `Session, PasswordResetToken` from `$lib/database`; your barrel is `$lib/server/database`. Change to `$lib/server/database` or use direct relative imports.
    - Missing import of Role.
    - Unused imports: `UserRole` (no file), `SubRoleCfg` (not used directly in this file).
- Relation inverse mismatch with Role:
    - In Role.ts, the inverse side points to `user.roles` (plural), but `User` defines a single `role: Role`. This must be aligned.
- Suggested edits:
    - Add `ManyToOne` to the import list.
    - Import Role: `import { Role } from './Role';`
    - Fix barrel path: `from '$lib/server/database'` (or make all direct relative to avoid circular runtime imports).
    - Keep property as: `@ManyToOne(() => Role, (role) => role.users) role: Role;`

File: src/lib/server/database/entities/user/Role.ts
- Inverse side mismatch and unused imports:
    - `@OneToMany(() => User, (user) => user.roles, ...)` should reference `user.role` (singular).
    - `ManyToOne` is imported but not used; `UserRole` is imported but not used (and file doesn’t exist). Remove both imports.
- Suggested edit:
    - `@OneToMany(() => User, (user) => user.role, { onDelete: 'CASCADE' }) users: User[];`

File: src/lib/server/database/entities/user/Permission.ts
- Looks fine for current usage.

File: src/lib/server/database/entities/user/RolePermission.ts
- Looks consistent: snake_case columns match JoinColumn names.

File: src/lib/server/database/entities/user/UserSubRole.ts
- Column name/JoinColumn mismatch and naming confusion:
    - You define `roleId` mapped to `role_id`, but the relation to SubRoleCfg uses `@JoinColumn({ name: 'subrole_id' })`. That’s inconsistent. This join will not bind to your `roleId` column; TypeORM will try to create another FK column or fail.
    - Index names reference `roleId`, but the relation’s column is effectively `subrole_id`.
- Suggested changes:
    - Rename the property to reflect SubRoleCfg: `subRoleCfgId` and keep snake_case column name aligned with JoinColumn:
        - `@Column({ type: 'uuid', name: 'subrole_id' }) subRoleCfgId: string;`
        - Update indices to use `['userId', 'subRoleCfgId']` and `['subRoleCfgId']`.
    - Keep the relation as is: `@ManyToOne(() => SubRoleCfg, ...) @JoinColumn({ name: 'subrole_id' }) subRoleCfg: SubRoleCfg;`

File: src/lib/server/database/entities/user/SubRoleCfg.ts
- Invalid indexes: referencing non-existent fields.
    - `@Index(['name'], { unique: true })` but the property is `title` (no `name` property).
    - `@Index(['rank'])` but no `rank` field exists on this entity.
- Suggested changes:
    - If the unique should be on `title`, change to `@Index(['title'], { unique: true })`.
    - Remove the `rank` index or add a numeric `rank` column if you actually need it.

File: src/lib/server/database/entities/user/SubRolePermission.ts
- Import / inverse mismatch:
    - Imports `RolePermission` but doesn’t use it; remove.
    - Uses `SubRolePermissionPermission` but doesn’t import it.
    - Property on the other side in SubRolePermissionPermission points to `srp.subroles`, which doesn’t exist here.
- Suggested changes:
    - Add import: `import { SubRolePermissionPermission } from './SubRolePermissionPermission';`
    - Keep or rename the collection property here and align the inverse name there. For example keep:
        - In this file: `subrolePermissionPermissions: SubRolePermissionPermission[];`
        - Then in SubRolePermissionPermission.ts make the inverse `srp => srp.subrolePermissionPermissions` (exact same name).

File: src/lib/server/database/entities/user/SubRolePermissionPermission.ts
- Multiple critical issues:
    - Wrong imports: `import { SubRoleCfg } from '$lib/database'` should be `$lib/server/database` or a direct relative import `../user/SubRoleCfg`.
    - Index definitions refer to properties that don’t exist: `@Index(['subRoleId'])` (no subRoleId field).
    - Column names vs JoinColumn names don’t match:
        - You define `@Column({ name: 'subrole_id' }) roleId: string;` but the relation’s JoinColumn is `{ name: 'subrole_cfg_id' }`.
    - Relation points to `SubRolePermission` but the file doesn’t import it; also inverse points to `srp.subroles` which doesn’t exist.
    - You import `Permission` but don’t use it (this junction is between SubRoleCfg and SubRolePermission, not Permission directly).
- Suggested rewrite (aligned with your intent “SubRoleCfg m:n SubRolePermission”):
    - Imports:
        - `import { SubRoleCfg } from './SubRoleCfg';`
        - `import { SubRolePermission } from './SubRolePermission';`
    - Columns and indexes:
        - `@Column({ type: 'uuid', name: 'subrole_cfg_id' }) subRoleCfgId: string;`
        - `@Column({ type: 'uuid', name: 'subrole_permission_id' }) subRolePermissionId: string;`
        - `@Index(['subRoleCfgId'])`
        - `@Index(['subRolePermissionId'])`
        - `@Index(['subRoleCfgId', 'subRolePermissionId'], { unique: true })`
    - Relations:
        - `@ManyToOne(() => SubRoleCfg, (src) => src.subRolePermissionPermissions, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'subrole_cfg_id' }) subRoleCfg: SubRoleCfg;`
        - `@ManyToOne(() => SubRolePermission, (srp) => srp.subrolePermissionPermissions, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'subrole_permission_id' }) subRolePermission: SubRolePermission;`
    - Remove the unused `Permission` import.

---

### Session domain

File: src/lib/server/database/entities/session/Session.ts
- Likely fine, but make sure the barrel path is correct (it is: `$lib/server/database`).

File: src/lib/server/database/entities/session/PasswordResetToken.ts
- Looks fine.

---

### Project domain

File: src/lib/server/database/entities/project/Project.ts
- Looks consistent.

File: src/lib/server/database/entities/project/ProjectUser.ts
- Looks consistent.

File: src/lib/server/database/entities/project/ProjectAssignedUser.ts
- Looks consistent.

File: src/lib/server/database/entities/project/ProjectResponsibleUser.ts
- Looks consistent.

File: src/lib/server/database/entities/project/ProjectTag.ts
- Looks consistent.

File: src/lib/server/database/entities/project/ProjectCreator.ts
- Looks consistent.

File: src/lib/server/database/entities/project/ProjectCircle.ts
- Standalone; fine.

---

### Task domain

File: src/lib/server/database/entities/task/Task.ts
- Looks consistent.

File: src/lib/server/database/entities/task/TaskTag.ts
- Looks consistent.

File: src/lib/server/database/entities/task/UserTask.ts
- Looks consistent.

File: src/lib/server/database/entities/task/Tag.ts
- Looks consistent.

---

### Deadline domain

File: src/lib/server/database/entities/deadline/Deadline.ts
- Import path is broken:
    - `import { Project, Priority, User } from '../project/Project';` is invalid; that file only exports Project. Import each from its proper module (or from the barrel):
        - Recommended: `import { Project, Priority, User } from '$lib/server/database';`

File: src/lib/server/database/entities/deadline/DeadlineTag.ts
- Wrong barrel path typo:
    - `import { Tag } from '$lib/serve/database';` should be `$lib/server/database`.
- Otherwise consistent.

---

### Impediment domain

File: src/lib/server/database/entities/impediment/Solution.ts
- Suggest aligning column names with snake_case for foreign keys (optional, not mandatory for sync): `@JoinColumn({ name: 'author_id' })` instead of `authorId`. Not strictly required but improves consistency.

File: src/lib/server/database/entities/impediment/Impediment.ts
- Looks consistent.

File: src/lib/server/database/entities/impediment/ImpedimentMedian.ts
- Looks consistent.

---

### Mail domain

File: src/lib/server/database/entities/mail/Mail.ts
- Looks consistent.

File: src/lib/server/database/entities/mail/SimpleMail.ts
- Looks consistent.

File: src/lib/server/database/entities/mail/ContractorMail.ts
- Inverse side to User is wrong and child relations need proper join columns:
    - `@ManyToOne(() => User, user => user.roles, ...)` should not reference `user.roles`. The inverse on User for this entity does not exist; use a no-inverse lambda or create an inverse collection on User. Easiest fix: `@ManyToOne(() => User, { onDelete: 'CASCADE' })` (omit inverse function).
    - Attachment and MailAudit currently define a separate `@Column() mailId: string;` and also a `@ManyToOne(() => ContractorMail, ...)` without `@JoinColumn`. TypeORM will try to create its own FK column and you’ll end up with duplicates or mismatches.
- Suggested changes:
    - In ContractorMail:
        - Change the User relation to: `@ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user: User;`
    - In Attachment:
        - Rename the column to snake_case and bind it: `@Column({ type: 'uuid', name: 'mail_id' }) mailId: string;`
        - Add: `@ManyToOne(() => ContractorMail, (mail) => mail.attachments, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'mail_id' }) mail: ContractorMail;`
    - In MailAudit:
        - Similarly: `@Column({ type: 'uuid', name: 'mail_id' }) mailId: string;`
        - Add: `@ManyToOne(() => ContractorMail, (mail) => mail.audits, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'mail_id' }) mail: ContractorMail;`
    - Ensure Attachment and MailAudit are in the DataSource `entities` list.

---

### Barrel and cross-imports

File: src/lib/server/database/index.ts
- Barrel exists and looks fine. However, be cautious importing the barrel inside entities (e.g., `User.ts` importing `Session` via the barrel). This can create circular import timing issues. TypeORM usually survives because relation callbacks are lazy, but it’s safest to:
    - Use direct relative imports between entities where feasible, or
    - If you keep barrel imports, ensure they only import types used in decorators and not used at top-level immediately.

---

### Minimal step-by-step to make synchronize work again
1. Fix the DataSource imports and the entities array exactly as above. This alone will eliminate immediate boot errors (missing module/UserRole, wrong ContractorMail path, missing SubRole* imports).
2. Fix the User/Role inverse mismatch:
    - Role: `user => user.role`.
    - User: ensure `@ManyToOne(() => Role, (role) => role.users)` and import ManyToOne + Role.
3. Align SubRole* files:
    - UserSubRole: use `subRoleCfgId` bound to `subrole_id` and update indices accordingly.
    - SubRoleCfg: fix indexes to reference actual properties (`title`, remove `rank` unless you add the field).
    - SubRolePermission: import SubRolePermissionPermission and align inverse collection name.
    - SubRolePermissionPermission: rewrite columns/indexes and relations to use `subrole_cfg_id` and `subrole_permission_id` with inverse `srp.subrolePermissionPermissions`.
4. Fix Deadline imports:
    - In Deadline.ts: import Project, Priority, User from the barrel `$lib/server/database` (or their direct files).
    - In DeadlineTag.ts: fix `$lib/serve/database` → `$lib/server/database`.
5. Fix ContractorMail relations as above and include Attachment/MailAudit in entities.
6. Recreate the DB or drop schema in dev:
    - Ensure: `NODE_ENV=development` and (optionally) `DROP_SCHEMA=1` to force clean rebuild.
    - Ensure DATABASE_URL points to the new `app_db` (e.g., `postgres://user:pass@localhost:5432/app_db`).
    - Start the server or run a small bootstrap that imports `AppDataSource` (it already initializes on import). Alternatively, create a dedicated script that calls `AppDataSource.initialize()` and `AppDataSource.synchronize()` explicitly.

If you prefer a quick test script, you can adapt the commented script at scripts/generate-schema.ts to import the correct DataSource and run `synchronize(true)` once, then exit.

---

### Summary list of files needing edits
- config/datasource.ts
- entities/user/User.ts
- entities/user/Role.ts
- entities/user/UserSubRole.ts
- entities/user/SubRoleCfg.ts
- entities/user/SubRolePermission.ts
- entities/user/SubRolePermissionPermission.ts
- entities/deadline/Deadline.ts
- entities/deadline/DeadlineTag.ts
- entities/mail/ContractorMail.ts

Optional/nice-to-have consistency updates:
- entities/impediment/Solution.ts (rename join column to author_id for consistency)

If you want, I can draft concrete patched code blocks for each of the above files, ready to paste in, based on your preferred FK column naming (camelCase vs snake_case).