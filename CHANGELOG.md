# [5.2.0](https://github.com/patarok/godot-development/compare/v5.1.1...v5.2.0) (2025-09-06)


### Bug Fixes

* fixes casing in entities ([6557dd3](https://github.com/patarok/godot-development/commit/6557dd3597cc9d938e56276bd161022f92dd419d))


### Features

* decides for bits-ui, introduces a clean way of styling bits-ui headless components ([de59b10](https://github.com/patarok/godot-development/commit/de59b10874f13f9c80e173c5963f64507ed36917))

## [5.1.1](https://github.com/patarok/godot-development/compare/v5.1.0...v5.1.1) (2025-09-06)


### Bug Fixes

* schema drop, seed now working via npm scripts ([9350da9](https://github.com/patarok/godot-development/commit/9350da94ae65400e810ed6851491a068113d9f9d))

# [5.1.0](https://github.com/patarok/godot-development/compare/v5.0.0...v5.1.0) (2025-09-05)


### Features

* **db:** add impediment domain (Impediment, Solution, ImpedimentMedian) and wire relations ([961fff3](https://github.com/patarok/godot-development/commit/961fff379563a92f9dea3b31857b150b5cf0b096))

# [5.0.0](https://github.com/patarok/godot-development/compare/v4.0.0...v5.0.0) (2025-09-05)


### Features

* **projects:** introduce full Project domain, Risk Levels, and /projects CRUD; enhance Tasks and Admin System ([1b886e0](https://github.com/patarok/godot-development/commit/1b886e053cc9b9c950530008cf8645bec64e9c2f))


### BREAKING CHANGES

* **projects:** Project.riskLevel changed from a non-null string to an optional FK (riskLevelId). Generate and run a migration or enable synchronize in development to update the schema.

# [4.0.0](https://github.com/patarok/godot-development/compare/v3.0.0...v4.0.0) (2025-09-04)


* git commit -m "feat!: implement task management system with UUID migration and admin improvements ([94614d9](https://github.com/patarok/godot-development/commit/94614d98006e2fbae3caab239b4fe20afb653e74))


### BREAKING CHANGES

* Migrate primary keys and related foreign keys to UUID across user/role/permission/session and join tables (Session.userId, UserRole.userId/roleId, RolePermission.roleId/permissionId, UserTask.userId). TaskTag schema changed from string tag to Tag entity via tagId. Existing databases must be reset or migrated.

- feat(tasks): add task creation page with title/description/due date, completion toggle, required TaskState, optional Priority, and tag assignment
- feat(tasks): support toggling task completion and adding tags inline
- feat(tags): add Tag entity (slug/name/color/description) and refactor TaskTag to reference Tag via tagId with unique constraint
- feat(admin): add management UI and actions for Task States and Priorities with create/update/delete operations
- feat(admin): add users list with computed role labels and UUID-based manipulation
- feat(auth): add /api/logout endpoint for AJAX logout and update layout accountToggle
- feat(db): register new entities (Task, TaskTag, UserTask, Tag, Priority, TaskState, ProjectState) in datasource
- feat(db): add optional DROP_SCHEMA toggle for dev resets
- fix(admin): fix serialization by returning plain objects
- fix(auth): rework revokeSession to lookup by tokenHash with UUID fallback
- fix(db): make Task.taskState required with onDelete RESTRICT and add Task.creator field"

# [3.0.0](https://github.com/patarok/godot-development/compare/v2.2.0...v3.0.0) (2025-09-04)


* feat!: implement core domain entities with UUID primary keys ([3820162](https://github.com/patarok/godot-development/commit/382016286cdbf0c1a09f95a5f384f969407718d1))


### BREAKING CHANGES

* Changed primary keys from integer to UUID/GUID format

- feat: add configuration entities (MainRoleTitleCfg, PriorityLevelCfg, ProjectStateKind, TaskStateKind)
- feat: add state management entities (Priority, ProjectState, TaskState)
- feat: add core business entities (Task, TaskTag, UserTask)
- fix: convert all primary keys to UUID/GUID format
- refactor: improve entity definitions and structure

# [2.2.0](https://github.com/patarok/godot-development/compare/v2.1.1...v2.2.0) (2025-09-04)


### Features

* barrels used wisely, redundancies removed ([b730ec5](https://github.com/patarok/godot-development/commit/b730ec58208ce5ddfc46445e91d24a9f2839da37))

## [2.1.1](https://github.com/patarok/godot-development/compare/v2.1.0...v2.1.1) (2025-09-03)


### Bug Fixes

* populating user_role now when registering, adds flowchart, renames folder prisma ([4d5bd5d](https://github.com/patarok/godot-development/commit/4d5bd5d6a017275e68c779a555b7f0b937d0903b))

# [2.1.0](https://github.com/patarok/godot-development/compare/v2.0.0...v2.1.0) (2025-09-02)


### Features

* **db,entities,pages:** add TypeORM, adds/edits entities, modifies ([5de742c](https://github.com/patarok/godot-development/commit/5de742ca569815de6dcfe4274b424101e1434792))

# [2.0.0](https://github.com/patarok/godot-development/compare/v1.5.3...v2.0.0) (2025-09-01)


* feat(auth,admin,mail,schema,storage,ui)!: admin area, Mailhog email, DB-like sessions; enriched registration & user views ([e926bb3](https://github.com/patarok/godot-development/commit/e926bb3fe38a15aeca411342218f10a558f73401))


### BREAKING CHANGES

* users.json storage format changed to a versioned object (v2) with separate sessions and tokens. Legacy inline tokens are discarded; users must re-login. Install new dependency (nodemailer) and run DB migrations before enabling Prisma-backed auth.

## [1.5.3](https://github.com/patarok/godot-development/compare/v1.5.2...v1.5.3) (2025-08-31)


### Bug Fixes

* improves schema, improves notes ([fd06718](https://github.com/patarok/godot-development/commit/fd0671821b04767eee8b3d192433b5f8ff48263a))

## [1.5.2](https://github.com/patarok/godot-development/compare/v1.5.1...v1.5.2) (2025-08-30)


### Bug Fixes

* adds a proper 'sketch-prisma.schema' as starting point ([e078796](https://github.com/patarok/godot-development/commit/e078796df506fb28271ac254ec6b08912af58e16))

## [1.5.1](https://github.com/patarok/godot-development/compare/v1.5.0...v1.5.1) (2025-08-30)


### Bug Fixes

* re-organizes package.json, adds pkgs for further development ([921b9fc](https://github.com/patarok/godot-development/commit/921b9fca6baeb7283020f302625d22029a05ac88))

# [1.5.0](https://github.com/patarok/godot-development/compare/v1.4.0...v1.5.0) (2025-08-30)


### Features

* adds basic user auth to program TODO: sanitation ([8770b88](https://github.com/patarok/godot-development/commit/8770b88a33aed98dc2c8f8ad979d705b0d7caa32))

# [1.4.0](https://github.com/patarok/godot-development/compare/v1.3.1...v1.4.0) (2025-08-30)


### Features

* implements dark mode button, fix .svelte files ([35b47e3](https://github.com/patarok/godot-development/commit/35b47e370a016f760761f2b5c25fd0db65736006))

## [1.3.1](https://github.com/patarok/godot-development/compare/v1.3.0...v1.3.1) (2025-08-30)


### Bug Fixes

* allowed vite to serve from styled-system ([85e1c55](https://github.com/patarok/godot-development/commit/85e1c55b9e127a97c51ed079e05958930b3ca601))

# [1.3.0](https://github.com/patarok/godot-development/compare/v1.2.0...v1.3.0) (2025-08-30)


### Features

* using PandaCSS now ([27b5ace](https://github.com/patarok/godot-development/commit/27b5ace99f600c7c61dfc92d44b7e17cb2ba3d1a))

# [1.2.0](https://github.com/patarok/godot-development/compare/v1.1.0...v1.2.0) (2025-08-29)


### Bug Fixes

* renamed release.config.js to .cjs ending so it doesnt get treated as ESM ([3e4fc9d](https://github.com/patarok/godot-development/commit/3e4fc9d4cc1936da5b94b42d63462d4eb3469dba))


### Features

* adds Svelte/SvelteKit with basic skeleton ([418956d](https://github.com/patarok/godot-development/commit/418956d21301f3e5d30089133413e5d515893849))
* moved to typescript ([36d7808](https://github.com/patarok/godot-development/commit/36d78088823f3849d54fa32e93a2d84bf26718ee))

# [1.1.0](https://github.com/patarok/godot-development/compare/v1.0.2...v1.1.0) (2025-08-29)


### Features

* sets up dockerized development environment, adds .gitignore ([e7048f8](https://github.com/patarok/godot-development/commit/e7048f885fa1592401688567b6551afbc004e755))
* setup dockerized development environment ([1c796ca](https://github.com/patarok/godot-development/commit/1c796caa71adb93fdf04faa0141ce7cc446e0547))

## [1.0.2](https://github.com/patarok/godot-development/compare/v1.0.1...v1.0.2) (2025-08-29)


### Bug Fixes

* **release:** changed policy to --major: false--, so we start out with v0 in future projects, which derive from this as template ([a6ef367](https://github.com/patarok/godot-development/commit/a6ef367bf8c81fa7f630e287dbde26ab7dffcc76))

## [1.0.1](https://github.com/patarok/godot-development/compare/v1.0.0...v1.0.1) (2025-08-29)


### Bug Fixes

* **release:** explicitly add github plugin to config ([2d7521b](https://github.com/patarok/godot-development/commit/2d7521bb97770f6b0fb7dd94c4e8f47f926c0a0c))

# 1.0.0 (2025-08-29)


### Features

* Initial project setup with README and CHANGELOG ([dc2a3dc](https://github.com/patarok/godot-development/commit/dc2a3dca966ec29b67bb6ca8577a6ca8929a304f))
* setup semantic-release ([e14c6fd](https://github.com/patarok/godot-development/commit/e14c6fd349132e57c0375e2ed47c32d579904d27))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   Initial `README.md` and `CHANGELOG.md` files.

### Changed

-   (None yet)

### Removed

-   (None yet)
