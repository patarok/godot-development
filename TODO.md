# TODO - Development Roadmap

## 🔥 HIGHEST PRIORITY: Database Seeding Reorganization

### Current Issue
The application currently uses a single monolithic seed file (`alt_initial_seed.ts`) that mixes essential system data with test/development data. This makes production deployment difficult and doesn't provide flexibility for different environments.

### Required Actions

#### 1. Create Base Functional Seed (`db:seed:base` or `db:seed:production`)
**Purpose**: Seed minimal required data for application functionality that any installation needs.

**Should Include**:
- ✅ Main Roles (Owner, Admin, Controller, User)
- ✅ Essential Main Permissions (admin.access, user.manage, settings.view, etc.)
- ✅ Role-Permission mappings for main roles
- ✅ SubRole configurations (Engineer, Project Manager, Designer, etc.)
- ✅ SubRole permissions and their mappings
- ✅ Task Statuses (Todo, In Progress, Review, Done, Blocked, etc.)
- ✅ Project Statuses (Planning, Active, On Hold, Completed, etc.)
- ✅ Priorities (Low, Medium, High, Critical, etc.)
- ✅ Risk Levels (Low, Medium, High, Critical)
- ✅ Task Types (Feature, Bug, Task, Epic, Story, etc.)
- ✅ System Settings (if any default required)

**Should NOT Include**:
- ❌ Test users (owner@example.com, admin@example.com, user@example.com, etc.)
- ❌ Sample projects
- ❌ Sample tasks
- ❌ Test project-user assignments
- ❌ Sample time entries

**Implementation**:
```bash
# New file structure:
src/lib/server/database/seeds/
  ├── base_seed.ts          # Production-ready base data
  ├── dev_seed.ts           # Development test data
  └── alt_initial_seed.ts   # Current comprehensive seed (keep for reference)
```

**Package.json scripts**:
```json
{
  "db:seed:base": "tsx src/lib/server/database/seeds/base_seed.ts",
  "db:seed:dev": "tsx src/lib/server/database/seeds/dev_seed.ts",
  "db:seed:full": "npm run db:seed:base && npm run db:seed:dev"
}
```

#### 2. Create Development Test Seed (`db:seed:dev`)
**Purpose**: Add realistic test data for development and testing.

**Should Include**:
- ✅ Test users with various roles (owner, admin, controller, user, stakeholder, contractor, etc.)
- ✅ Sample projects with different statuses and configurations
- ✅ Sample tasks with parent-child relationships
- ✅ Task-project assignments
- ✅ User-project assignments
- ✅ Sample time entries
- ✅ Sample tags
- ✅ Sample activity logs

**Environment Detection**:
```typescript
// Should check NODE_ENV and refuse to run in production
if (process.env.NODE_ENV === 'production') {
  console.error('Cannot run dev seed in production environment');
  process.exit(1);
}
```

#### 3. Refactor Current Seed Files
- Extract reusable helper functions into `src/lib/server/database/seeds/helpers.ts`:
  - `upsertRole()`, `upsertPermission()`, `linkRolePermission()`
  - `upsertTaskStatus()`, `upsertProjectStatus()`, `upsertPriority()`, etc.
  - `upsertUser()`, `upsertProject()`, `upsertTask()`
  - `generateIdenteapot()` wrapper
- Create clear separation between base and test data
- Add comprehensive comments explaining what each section seeds

#### 4. Update Documentation
- Update README.md with new seed scripts ✓
- Add `docs/seeding.md` explaining:
  - What each seed script does
  - When to use which seed
  - How to create custom seeds
  - Production deployment seed strategy

---

## 🎯 HIGH PRIORITY: Kanban Board Enhancements

### 1. Implement Drag & Drop Persistence
**Status**: Drag & drop UI works, but changes are not saved to database.

**Required**:
- [ ] Add server action `moveCard` in `/routes/tasks/+page.server.ts`
  - For weekday view: Update `task.plannedStartDate`
  - For status view: Update `task.taskStatus`
- [ ] Wire up `onCardMove` handler in `/routes/tasks/+page.svelte`
- [ ] Add optimistic UI updates
- [ ] Handle error states with rollback

### 2. Implement Card Operations
**Required**:
- [ ] `onCardUpdate`: Update task title/description via server action
- [ ] `onCardAdd`: Create new task in column
- [ ] Add loading states during operations
- [ ] Show success/error toasts

### 3. Additional Grouping Modes
**Enhancement**: Support more ways to organize tasks.

**Potential modes**:
- [ ] By Priority (High, Medium, Low)
- [ ] By Assignee (group by user)
- [ ] By Project
- [ ] By Type (Bug, Feature, Task)

---

## 🔧 MEDIUM PRIORITY: Code Quality & Refactoring

### 1. Type Safety Improvements
- [ ] Replace `any[]` with proper interfaces in component props
- [ ] Create discriminated union for `KanbanColumn` types (weekday vs status)
- [ ] Add strict type checking for task data structure

### 2. Error Handling
- [ ] Add try-catch blocks for date parsing
- [ ] Handle missing required fields gracefully
- [ ] Add error boundaries for component failures
- [ ] Implement proper logging strategy

### 3. Testing
- [ ] Set up Vitest for unit tests
- [ ] Create integration tests for seed scripts
- [ ] Add E2E tests for critical user flows (Playwright)
- [ ] Test Kanban drag & drop functionality

---

## 📊 MEDIUM PRIORITY: Data & Performance

### 1. Task Filtering & Search
- [ ] Add filter UI in task views (by assignee, priority, project, tags, status)
- [ ] Implement search functionality
- [ ] Persist filter/search state in URL query params
- [ ] Add saved filter presets

### 2. Performance Optimization
- [ ] Profile render performance with large datasets (1000+ tasks)
- [ ] Consider virtualization for large lists
- [ ] Add pagination to task queries
- [ ] Optimize database queries (add indexes, review N+1 queries)
- [ ] Implement caching strategy

### 3. Real-time Updates
- [ ] Add WebSocket/SSE for live updates
- [ ] Show when other users are editing cards
- [ ] Handle concurrent updates gracefully
- [ ] Add optimistic locking

---

## 🐛 LOW PRIORITY: TypeORM Entity Fixes

> **Note**: These are technical debt items that don't block core functionality but should be addressed for maintainability.

### Files Requiring Updates

#### Critical Import/Entity Issues
- [ ] `src/lib/server/database/config/datasource.ts`
  - Remove non-existent `UserRole` import
  - Fix `ContractorMail` import path
  - Add missing SubRole entity imports
  - Include Attachment and MailAudit in entities array

#### User/Role Domain
- [ ] `entities/user/User.ts` - Fix ManyToOne import, Role import, inverse mismatch
- [ ] `entities/user/Role.ts` - Fix inverse to reference `user.role` (singular)
- [ ] `entities/user/UserSubRole.ts` - Rename `roleId` to `subRoleCfgId`, fix indices
- [ ] `entities/user/SubRoleCfg.ts` - Fix invalid indexes (name→title, remove rank)
- [ ] `entities/user/SubRolePermission.ts` - Add SubRolePermissionPermission import
- [ ] `entities/user/SubRolePermissionPermission.ts` - Complete rewrite for proper m:n relationship

#### Other Domains
- [ ] `entities/deadline/Deadline.ts` - Fix import paths for Project, Priority, User
- [ ] `entities/deadline/DeadlineTag.ts` - Fix typo `$lib/serve/database` → `$lib/server/database`
- [ ] `entities/mail/ContractorMail.ts` - Fix User relation, add JoinColumn to Attachment/MailAudit

**Reference**: See detailed entity fix checklist in archive (moved from old TODO.md)

---

## 🎨 UI/UX Enhancements

### Kanban Board
- [ ] Mobile responsiveness improvements
- [ ] Touch event handlers for mobile drag & drop
- [ ] WIP (Work In Progress) limits per column
- [ ] Card detail modal/drawer
- [ ] Keyboard navigation (arrow keys, space, escape)
- [ ] Screen reader announcements via live region

### General
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add empty states with helpful CTAs
- [ ] Implement toast notifications
- [ ] Add confirmation dialogs for destructive actions

---

## 📚 Documentation

- [ ] Create `docs/seeding.md` (database seeding guide)
- [ ] Create `docs/typeorm-entity-fixes.md` (entity relationship fixes)
- [ ] Create `docs/architecture.md` (system architecture overview)
- [ ] Create `docs/api.md` (server actions API reference)
- [ ] Add JSDoc comments to all public functions
- [ ] Create Storybook for component library

---

## 🚀 Future Features

### Phase 1
- [ ] Email notifications
- [ ] File attachments to tasks/projects
- [ ] Comments and discussions on tasks
- [ ] Task templates
- [ ] Bulk operations UI

### Phase 2
- [ ] Time tracking UI with start/stop timers
- [ ] Gantt chart view
- [ ] Calendar view
- [ ] Reports and analytics dashboard
- [ ] Export functionality (CSV, PDF)

### Phase 3
- [ ] Custom fields for tasks/projects
- [ ] Workflow automation
- [ ] Integrations (GitHub, GitLab, Slack, etc.)
- [ ] API for third-party integrations
- [ ] Mobile app (React Native or Progressive Web App)

---

## 📝 Notes

- Current seeding approach: `npm run db:seed:alt` runs comprehensive seed with test data
- Production deployment will require base seed only: `npm run db:seed:base`
- See `docs/kanban-todo.md` for detailed Kanban board considerations
- TypeORM synchronize issues are documented but don't block core functionality
