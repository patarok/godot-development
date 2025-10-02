# DnD Droppables: Why containers have no node and how to fix it

This document captures the investigation into why droppable containers registered in `@dnd-kit-svelte` sometimes show `hasNode: false` and fail collision detection in this project, plus a durable fix plan.

Location: docs/dnd-droppables-investigation.md
Created: 2025-09-23

---

## TL;DR
- The droppable containers are registered via `useDroppable` (used inside `useSortable`). Registration happens early and includes the current `nodeRef.current` at that instant.
- If the DOM element has not yet been bound to the droppable’s `nodeRef` when registration occurs, the reducer stores an element with `node: null`.
- The store does not re-dispatch on subsequent `nodeRef` changes, so the node may remain `null` in the container map unless registration happens after the ref is set.
- Without a node, `useDroppableMeasuring` cannot compute rects, so collision detection has nothing to compare against, producing `over: null`.
- In your table, `useSortable` is bound via `bind:this={s.node.current}` to `<tr>`, which is correct, but the timing can still result in registration before the element binds.

Fix: Ensure the droppable node is bound before/at registration time, or explicitly set the droppable node via the provided setter. Also temporarily force measuring strategy to `Always` to confirm rects and use logging to verify.

---

## Code path overview (relevant internals)

- Registration (node_modules/@dnd-kit-svelte/core/dist/hooks/use-droppable.svelte.js):
  - `watch(() => id, () => { dispatch({ type: Action.RegisterDroppable, element: { id, key, disabled, node: nodeRef.current, rect, data } }) })`
  - Registration uses `nodeRef.current` at that moment. If it’s `null`, the container is stored with `node: null`.
  - Subsequent node changes are handled by a ResizeObserver for measurements but there is no re-register to update `element.node` in the store.

- Store (reducer):
  - `RegisterDroppable` stores the `element` object as-is in `DroppableContainersMap`.

- Measuring (useDroppableMeasuring):
  - Iterates `containers` and does `const node = container.node; const rect = node ? new Rect(measure(node), node) : null; container.rect = rect;`.
  - If `container.node` is `null`, `rect` remains `null`.

- DndContext collision detection:
  - Uses `enabledDroppableContainers` + `droppableRects` to compute collisions. Missing rects => no `over`.

---

## Observations in this project

Files referenced (paths abbreviated):
- src/lib/components/data-table.svelte (DraggableRow)
- src/lib/components/utilities/dnd-monitor.svelte
- node_modules/@dnd-kit-svelte/core/... (use-droppable.svelte.js, dnd-context.svelte, use-droppable-measuring.svelte.js)

Key points:
- In `DraggableRow`, you do:
  - `{@const s = useSortable({ id: row.original.id })}`
  - `<tr bind:this={s.node.current} ...>`
  - This is the recommended binding and should wire both draggable and droppable refs the hook manages.
- In `DndContext`, measuring is set to:
  - `draggable: MeasuringStrategy.Always`
  - `droppable: MeasuringStrategy.BeforeDragging`
- The monitor (`dnd-monitor.svelte`) and `droppable-inspector.svelte` show droppables, often with `hasNode: false` and `rect: null` before drag.

Risk window:
- If registration runs before `<tr>` binds to `s.node.current`, the store snapshot for that container has `node: null` and will continue to have it. Even if the internal ref later points to the DOM, the store object isn’t updated automatically.

---

## Why this leads to no collisions
- No node => no rect => no entries in `droppableRects` => detection functions (e.g., `pointerWithin`, `closestCenter`) have nothing to compare against => `over` stays null.

---

## Durable fixes

1) Bind the droppable node explicitly via setter (most explicit)
- `useSortable` exposes `setDroppableNodeRef`. Use it to bind your row element:

```svelte
{@snippet DraggableRow({ row })}
  {@const s = useSortable({ id: row.original.id })}
  <tr use:bindDroppable={s.setDroppableNodeRef} ...>
    <!-- cells -->
  </tr>
{/snippet}

<script lang="ts">
  function bindDroppable(node: HTMLElement, setRef: (el: HTMLElement | null) => void) {
    setRef(node);
    return { destroy() { setRef(null); } };
  }
</script>
```

- This ensures the store’s droppable node is set as early as possible through the hook’s API.

2) Alternatively, continue using `bind:this={s.node.current}` but delay initial measuring and logs until after mount
- You already adjusted the monitor to measure on mount and during drag. Keep that but be aware it may snapshot before nodes bind on first paint.

3) Temporarily force droppable measuring to Always while verifying

```svelte
<DndContext
  measuring={{
    draggable: { strategy: MeasuringStrategy.Always },
    droppable:  { strategy: MeasuringStrategy.Always }
  }}
>
```

- If rects and `over` start working here, timing/binding was the issue.

4) Sanity checks
- IDs are stable and type-consistent between `SortableContext items` and `useSortable({ id })`.
- No parent CSS transforms or `display: contents` on `<tr>` parents that could interfere with rects.
- Only one instance of `@dnd-kit-svelte` (your Vite config already dedupes and noExternal’s it, which is good).

5) Optional: Use a thin Droppable wrapper component in your UI layer
- You already have `src/lib/components/ui/droppable.svelte` that wraps `useDroppable`. If you ever need bare droppables, favor this wrapper to centralize the node binding via an action as above.

---

## Verification checklist
- On mount:
  - `📦 DndMonitor:mount` shows droppables with `hasNode: true` for all rows; rects populated (if droppable measuring Always) or after first drag (BeforeDragging).
- During drag:
  - `onDragMove` logs show `over` switching between row IDs as the pointer moves.
- After drop:
  - `onDragEnd` shows a non-null `over` when dropping over another row; reorder logic runs.

---

## Notes on logging and Vite
- Console logs inside `node_modules` may be stripped or minimized depending on mode; you’ve surfaced relevant logs in your local builds already. Prefer app-level logs via the monitor/inspector for consistent output.

---

## Bottom line
- The original analysis was previously only in chat. It’s now persisted in this repository at:
  - docs/dnd-droppables-investigation.md
- Apply Fix (1) or (2)+(3) and re-test. If issues persist, capture a monitor snapshot immediately after mount and at drag start to confirm `hasNode` and `rect` across all droppables.