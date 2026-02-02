# Battleplan: Sidebar and Menubar Consolidation & Highlighting

## 1. Analysis of Current State
*   **Sidebar Implementation**: `AppSidebar` and `AdminSidebar` use a `NavMain` component. Refactored to support `url` and `status`.
*   **Links**: Many links were pointed to `#`. Updated to point to actual routes where they exist.
*   **Routes**: 
    *   Working: `/`, `/projects`, `/tasks`, `/admin/users/list`, `/admin/system`.
    *   Placeholder/Stub: `/admin/documents`, `/admin/log`, `/admin/projects`, `/admin/mail`, `/lifecycle`, `/analytics`, `/team`.
*   **Visuals**: Added visual indicators (opacity, grayscale, 🚧, ❓) to differentiate between functional and non-functional features.

## 2. Refactoring Navigation Components (Completed)
*   **NavMain.svelte**: Updated to use `item.url`. Wrapped `Sidebar.MenuButton` in an `<a>` tag using the `child` snippet.
*   **Data Structure**: Added `status: 'working' | 'stub' | 'missing'` to navigation items.
*   **Support Components**: Updated `NavProjects.svelte`, `NavDocuments.svelte`, and `NavSecondary.svelte` to support the new status field.

## 3. Sidebar Consolidation (Completed)
*   **AppSidebar.svelte**:
    *   Dashboard -> `/`
    *   Projects -> `/projects`
    *   Tasks -> `/tasks`
    *   Lifecycle, Analytics, Team marked as `stub`.
*   **AdminSidebar.svelte**:
    *   Linked to Admin Dashboard (`/admin`), User Management, System Settings.
    *   Marked Mail, Documents, Projects, Logs as `stub`.
    *   Added missing icon imports.

## 4. Menubar Consolidation (Admin) (Completed)
*   **AdminMenubar.svelte**:
    *   Linked 'User MGMT' to `/admin/users/list`.
    *   Linked 'System' to `/admin/system`.
    *   Linked 'Mail' to `/admin/mail`.
    *   Marked 'File', 'Edit', 'View', 'Profiles' as non-functional using `opacity-50 grayscale` and `disabled`.

## 5. Visual Highlighting (Completed)
*   **Implementation**:
    *   Used Tailwind classes `opacity-50 grayscale` for non-functional items.
    *   Added 🚧 indicator for "Stub/In Progress" items.
    *   Added ❓ indicator for "Missing" items.

## 6. Future Improvements (Suggested)
*   [ ] Replace mockup data in `/admin` with actual database metrics.
*   [ ] Implement dynamic breadcrumbs and page titles in `SiteHeader.svelte`.
*   [ ] Complete functional implementation of Mail endpoints.
*   [ ] Implement Account/Logout functionality in `NavUser.svelte`.
