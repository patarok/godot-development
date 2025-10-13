# Kanban Board - TODO & Considerations

## Completed ✓

### Architecture Refactoring
- ✅ Updated `kanban-board.svelte` props to accept raw data: `tasks`, `states`, `priorities`, `types`, `users`, `projects`
- ✅ Removed dependency on non-existent `data.kanbanColumns`
- ✅ Implemented client-side column building using `$derived` rune
- ✅ Added dynamic grouping modes: `'weekday'` and `'status'`
- ✅ Integrated `taskToCard` transformation for all column types
- ✅ Added color mapping functions (`mapStateToColor`, `getWeekdayColor`)
- ✅ Fixed empty state handling with `min-h-[600px]`
- ✅ Removed duplicate wrapper divs in template
- ✅ Updated `+page.svelte` to pass all required props to KanbanBoard

### Svelte 5 Compliance
- ✅ Fixed event handler in `kanban-board-column.svelte` (removed `|preventDefault` modifier, added explicit preventDefault)
- ✅ Fixed `$state` usage in `kanban-board-provider.svelte` (moved to variable declaration with getters/setters)
- ✅ All components use proper Svelte 5 runes: `$props()`, `$state()`, `$derived()`, `{@attach}`
- ✅ Reviewed all 6 kanban component files for compliance
- ✅ Fixed SSR errors in UI components (dropdown-menu, dialog, select, popover, hover-card, sheet, tooltip) by adding optional chaining to bits-ui Primitive property access

### UI Component Improvements
- ✅ Replaced Table/Kanban view toggle buttons with NavigationMenu component
  - Added NavigationMenu.Item with icon support (TableIcon, LayoutKanbanIcon from @tabler/icons-svelte)
  - Implemented active view styling with font-semibold and text-primary classes
  - Added proper click handlers with preventDefault
- ✅ Replaced "By Week" / "By Status" buttons with Switch component
  - Added label "View Mode:" with Switch toggle
  - Implemented bidirectional mode labels showing current active mode
  - Styled with bg-muted/30 rounded container for better visual grouping
  - Switch checked state: true = 'status', false = 'weekday'
- ✅ Implementation: src/routes/tasks/+page.svelte (lines 10-14, 37-71, 93-110)

## Current State Analysis

### Data Flow
```
Server (+page.server.ts)
  ↓ returns: tasksProjected, states, priorities, types, users, projects
+page.svelte
  ↓ passes all data + groupBy mode
kanban-board.svelte
  ↓ $derived.by() builds columns dynamically
  ↓ applies taskToCard() transformation
kanban-board-column.svelte
  ↓ renders cards
kanban-board-card.svelte
```

### Component Structure
- **kanban-board.svelte** - Main container, handles column building and drag-drop logic
- **kanban-board-column.svelte** - Individual column with cards, "Add task" button
- **kanban-board-card.svelte** - Task card with drag handle, inline editing
- **kanban-board-provider.svelte** - Context provider for accessibility
- **kanban-board-live-region.svelte** - Screen reader announcements
- **kanban-board-accessibility.svelte** - Empty (unused?)
- **kanban-board-types.ts** - TypeScript type definitions

## Remaining Tasks

### 1. Implement Drag & Drop Persistence ⚠️ HIGH PRIORITY
**Issue**: Currently `onCardMove`, `onCardUpdate`, `onCardAdd` are optional and not implemented.

**Required Actions**:
- Add server actions in `+page.server.ts` for:
  - `moveCard`: Update task's `plannedStartDate` (for weekday view) or `status` (for status view)
  - `updateCard`: Update task title/description
  - `addCard`: Create new task in column
- Wire up handlers in `+page.svelte` to call server actions
- Add optimistic UI updates for better UX
- Handle error states and rollback on failure

**Example**:
```typescript
// In +page.svelte
function handleCardMove(cardId: string, columnId: string, index: number) {
  if (kanbanGroupBy === 'weekday') {
    // columnId is a date string (YYYY-MM-DD)
    // Update task.plannedStartDate
  } else {
    // columnId is a state.id
    // Update task.status
  }
  // Submit to server action
}
```

### 2. Empty File Cleanup
- **Action**: Delete or implement `kanban-board-accessibility.svelte` (currently empty)
- **Decision needed**: Is this file needed for future accessibility features?

### 3. Column Type Definitions
**Issue**: `KanbanColumn` type in `kanban-board-types.ts` assumes weekday-specific fields (`weekday`, `date`), but status-based columns don't have these.

**Required Actions**:
- Refactor type to support both column types:
```typescript
export type KanbanColumnBase = {
    id: string;
    title: string;
    color: KanbanCircleColor;
    items: KanbanCard[];
};

export type KanbanWeekdayColumn = KanbanColumnBase & {
    weekday: number;
    date: Date;
    type: 'weekday';
};

export type KanbanStatusColumn = KanbanColumnBase & {
    statusId: string;
    type: 'status';
};

export type KanbanColumn = KanbanWeekdayColumn | KanbanStatusColumn;
```

### 4. "Today" Indicator for Status View
**Issue**: The `isToday` derived state in `kanban-board-column.svelte` only works for weekday columns.

**Required Actions**:
- Add conditional logic to only show "Today" badge in weekday mode
- Consider adding other visual indicators for status columns (e.g., WIP limits)

### 5. Color Mapping Extensibility
**Issue**: `mapStateToColor` has hardcoded state names ('Todo', 'In Progress', etc.).

**Required Actions**:
- Make color mapping dynamic based on actual state data from database
- Add fallback colors
- Consider adding color field to `TaskStatus` entity

### 6. Additional Grouping Modes
**Potential Enhancement**: Support more grouping modes:
- By priority (High, Medium, Low)
- By user (assigned to)
- By project
- By type (Bug, Feature, Task)

**Required Actions**:
- Extend `groupBy` prop type
- Add building functions for each mode
- Update UI to show mode selector

### 7. Drag & Drop Validation
**Issue**: No validation for invalid moves (e.g., dropping in past dates, status transitions).

**Required Actions**:
- Add business logic for valid transitions
- Disable invalid drop targets
- Show visual feedback for invalid moves
- Add confirmation dialogs for sensitive operations

### 8. Performance Optimization
**Current**: All tasks are filtered on every render.

**Potential Issues**:
- Large task lists (1000+ tasks) may cause lag
- Frequent re-renders when dragging

**Required Actions**:
- Consider memoization for column building
- Add virtual scrolling for large task lists
- Implement pagination or lazy loading
- Profile render performance

### 9. Real-time Updates
**Enhancement**: Multi-user collaboration support.

**Required Actions**:
- Add WebSocket/SSE for live updates
- Show when other users are editing cards
- Handle concurrent updates gracefully
- Add optimistic locking

### 10. Keyboard Navigation
**Accessibility**: Full keyboard support for accessibility.

**Required Actions**:
- Arrow keys to move between cards
- Space to pick up/drop cards
- Escape to cancel drag
- Tab to navigate between columns
- Implement announcements via `kanban-board-live-region.svelte`

### 11. Mobile Responsiveness
**Issue**: Drag & drop may not work well on touch devices.

**Required Actions**:
- Test on mobile devices
- Add touch event handlers
- Consider alternative UI for mobile (e.g., move buttons)
- Adjust column width for smaller screens

### 12. Card Details/Preview
**Enhancement**: Show full card details without navigating away.

**Required Actions**:
- Add modal/drawer for card details
- Show full description, comments, attachments
- Allow inline editing of all fields
- Add task history/activity log

### 13. Filtering & Search
**Enhancement**: Filter tasks in kanban view.

**Required Actions**:
- Add filter UI (by assignee, priority, project, tags)
- Add search input
- Filter columns or cards
- Persist filter state in URL

### 14. WIP Limits
**Enhancement**: Work-in-progress limits per column.

**Required Actions**:
- Add WIP limit configuration per column
- Show visual indicator when limit reached
- Prevent drops when limit exceeded (optional)
- Add warnings/badges

## Testing Checklist

### Manual Testing Needed
- [ ] Test weekday view with tasks scheduled today, tomorrow, next week
- [ ] Test status view with tasks in different states
- [ ] Test switching between views
- [ ] Test with empty data (no tasks)
- [ ] Test with tasks missing required fields (no plannedStart, no status)
- [ ] Test "Add task" functionality in columns
- [ ] Test card inline editing (double-click)
- [ ] Test card drag & drop (once implemented)
- [ ] Test with large number of tasks (100+)
- [ ] Test browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Test accessibility with screen reader
- [ ] Test keyboard navigation

### Edge Cases to Consider
- Tasks with no `plannedStartDate` (won't show in weekday view)
- Tasks with past dates (should show in past columns?)
- Tasks with `plannedStartDate` beyond 7 days (won't show in weekday view)
- Tasks with status not in `states` array
- Drag & drop between incompatible columns
- Concurrent edits from multiple users
- Network failures during updates

## Code Quality Improvements

### 1. Type Safety
- Replace `any[]` types with proper interfaces
- Add stricter type checks for task data structure
- Use discriminated unions for column types

### 2. Error Handling
- Add try-catch blocks for date parsing
- Handle missing required fields gracefully
- Add error boundaries for component failures
- Log errors for debugging

### 3. Code Organization
- Extract helper functions to separate utility files
- Create a `kanban-utils.ts` for shared logic
- Consider a state management solution for complex interactions

### 4. Styling
- Translate inline CSS to Tailwind (see comment in kanban-board.svelte line 128)
- Ensure consistent spacing and colors
- Add dark mode support
- Improve scrollbar styling

### 5. Documentation
- Add JSDoc comments to all public functions
- Document expected data structure for `tasksProjected`
- Add README for kanban component usage
- Create Storybook stories for components

## Questions for Product Owner

1. **Drag & Drop Behavior**: When dragging a task to a different day, should we update `plannedStartDate` or `plannedDue` or both?
2. **Status Transitions**: Are there restrictions on which status transitions are allowed?
3. **Past Dates**: Should we show columns for past dates, or only future dates?
4. **Date Range**: Currently showing 7 days. Should this be configurable?
5. **Add Task**: Should "Add task" create a minimal task or open a full form?
6. **Permissions**: Do all users have permission to move any task, or should there be restrictions?
7. **Default View**: Should we persist user's view preference (weekday vs status)?
8. **Multiple Projects**: Should kanban board support filtering by project, or always show all tasks?

## Migration Notes

### Breaking Changes from Old Implementation
- **Props**: `columns` prop replaced with `tasks`, `states`, etc.
- **Data Structure**: No longer expects pre-built `kanbanColumns` from server
- **Column Building**: Now happens client-side using `$derived`

### Migration Path for Existing Code
If any other components were using the old KanbanBoard:
1. Update props to pass raw data instead of formatted columns
2. Ensure `tasksProjected` has required fields: `taskUuid`, `header`, `status`, `plannedSchedule.plannedStart`
3. Pass `states` array from server

## Performance Metrics (To Be Measured)

Track these metrics after full implementation:
- Initial render time with 100, 500, 1000 tasks
- Drag & drop latency
- Server action response time
- Memory usage
- Lighthouse accessibility score

## References

- [dnd-kit-svelte Documentation](https://dnd-kit-svelte.com)
- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte/$state)
