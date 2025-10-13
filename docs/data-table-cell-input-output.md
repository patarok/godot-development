
## TODO for cell input:
- validation through ZOD and therefore use ZOD the right way see our gathered information on the issue:


### Short answer

- No, you shouldn’t force everything into strings. Use richer shapes (arrays, objects, IDs) and let Zod validate/transform them.
- Save updates by primary key `id`. Prefer patch-style updates that transmit only changed fields in their canonical forms (IDs for relations), not display strings.

### Why strings are the wrong long‑term shape
Strings are fine for mock data and quick UI iterations, but they make everything harder when you leave the mock state:
- Relations like `tags` or `assignedUsers` lose identity when collapsed into comma-separated strings.
- You must re-parse strings at the server, which complicates validation, error handling, and referential integrity (what if a tag name collides?).
- You can’t safely do client-side filtering/sorting/faceting on structured fields if you flatten them.

Zod already supports rich types:
- `z.array(z.object({...}))` for lists of entities
- `z.date()` or `z.coerce.date()` for dates
- enums/refinements for constraints
- `transform` and `preprocess` for adapting transport shapes

### Recommend a layered model (entity ↔ view model ↔ transport)
Create three clear levels and adapters between them:

1) Entity/DB reference schemas (canonical IDs)
- Use IDs for relations so saving is trivial.
- Include optional denormalized display fields for convenience.

```ts
// src\lib\components\schemas.ts
import { z } from "zod/v4";

export const Id = z.union([z.string().min(1), z.number()]);

export const TagRefSchema = z.object({
  id: Id,
  name: z.string().min(1)
});

export const UserRefSchema = z.object({
  id: Id,
  name: z.string().min(1)
});

export const PriorityRefSchema = z.object({
  id: Id,
  name: z.string().min(1)
});

export const TaskStatusRefSchema = z.object({
  id: Id,
  name: z.string().min(1)
});

// Canonical Task shape used for persistence
export const TaskEntitySchema = z.object({
  id: Id,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isDone: z.boolean().default(false),
  isMeta: z.boolean().default(false),
  priority: PriorityRefSchema.nullable().optional(),
  taskStatus: TaskStatusRefSchema,
  plannedStartDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  parent: z.object({ id: Id }).nullable().optional(),
  tags: z.array(TagRefSchema).default([]),
  assignedUsers: z.array(UserRefSchema).default([]),
  creator: UserRefSchema.optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
});
export type TaskEntity = z.infer<typeof TaskEntitySchema>;
```

2) Table/View model for your row (UI-oriented)
- Provide only what the table needs, including derived/readable fields.
- Keep relations as arrays of refs for editing (not strings), but you can add computed display strings if helpful for sorting.

```ts
// Row shown in the table; header is your guaranteed column
export const TaskRowSchema = z.object({
  id: Id,
  header: z.string(),
  // keep structured values
  status: TaskStatusRefSchema,   // { id, name }
  priority: PriorityRefSchema.nullable().optional(),
  tags: z.array(TagRefSchema),   // [{ id, name }]
  assignedUsers: z.array(UserRefSchema),
  mainAssignee: UserRefSchema.nullable().optional(),
  planned: z.coerce.date(),
  due: z.coerce.date().optional(),
  isActive: z.boolean(),
  // Optional denormalized strings purely for display or quick filters
  statusName: z.string().optional(),
  priorityName: z.string().optional(),
  tagsCSV: z.string().optional(),
  assigneesCSV: z.string().optional()
});
export type TaskRow = z.infer<typeof TaskRowSchema>;
```

3) Transport/DTO
- For server actions/endpoints, accept a JSON payload shaped for persistence (IDs for relations), not display strings.
- If you must support CSVs (e.g., to create unknown tags by name), accept a union and normalize.

```ts
export const UpdateTaskDtoSchema = z.object({
  id: Id,
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isDone: z.boolean().optional(),
  isMeta: z.boolean().optional(),
  taskStatusId: Id.optional(),
  priorityId: Id.nullable().optional(),
  plannedStartDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  parentTaskId: Id.nullable().optional(),

  // relations by IDs (canonical)
  tagIds: z.array(Id).optional(),
  assignedUserIds: z.array(Id).optional(),

  // transitional support to create-by-name if needed
  tagsCSV: z.string().optional(),
});
export type UpdateTaskDto = z.infer<typeof UpdateTaskDtoSchema>;
```

### Adapters between layers
Implement small, explicit mappers:

```ts
// Entity -> Row
export function taskEntityToRow(t: TaskEntity): TaskRow {
  return {
    id: t.id,
    header: t.title,
    status: t.taskStatus,
    priority: t.priority ?? null,
    tags: t.tags,
    assignedUsers: t.assignedUsers,
    mainAssignee: t.assignedUsers[0] ?? null,
    planned: t.plannedStartDate,
    due: t.dueDate,
    isActive: t.isActive,
    statusName: t.taskStatus.name,
    priorityName: t.priority?.name,
    tagsCSV: t.tags.map(x => x.name).join(', '),
    assigneesCSV: t.assignedUsers.map(x => x.name).join(', ')
  };
}

// Row -> Update DTO (only changed fields)
export function buildUpdateDtoFromRowPatch(
  id: TaskRow["id"],
  patch: Partial<TaskRow>
): UpdateTaskDto {
  const dto: UpdateTaskDto = { id };
  if (patch.header !== undefined) dto.title = patch.header;
  if (patch.status !== undefined) dto.taskStatusId = patch.status.id;
  if (patch.priority !== undefined) dto.priorityId = patch.priority?.id ?? null;
  if (patch.planned !== undefined) dto.plannedStartDate = patch.planned;
  if (patch.due !== undefined) dto.dueDate = patch.due;
  if (patch.isActive !== undefined) dto.isActive = patch.isActive;
  if (patch.tags !== undefined) dto.tagIds = patch.tags.map(t => t.id);
  if (patch.assignedUsers !== undefined) dto.assignedUserIds = patch.assignedUsers.map(u => u.id);
  return dto;
}
```

### Using this in your current components

#### 1) Keep `MinimalRow` for flexibility, add column meta for validation
Your change to `data-table-cell-viewer.svelte` removed the hard dependency on `Schema`. Good. To leverage Zod, pass schema or field metadata through the column `meta` so the viewer can render appropriate input and validate.

```ts
// when defining columns
const columns: Columns = [
  {
    ...staticColumns.header,
    cell: ({ row }) => renderComponent(DataTableCellViewer, {
      item: row.original,
      // attach meta for form
      zod: TaskRowSchema,
      fields: {
        status: { type: 'select', options: states.map(s => ({ value: s.id, label: s.name })) },
        tags:   { type: 'multiselect', options: tags.map(t => ({ value: t.id, label: t.name })) },
        assignedUsers: { type: 'multiselect', options: users.map(u => ({ value: u.id, label: u.name })) }
      }
    })
  },
  // ...other dynamic columns with specific cells for complex types
];
```

Then in `data-table-cell-viewer.svelte`, use the provided metadata to decide how to render and validate on submit:

```ts
// props
let { item, zod, fields }: {
  item: MinimalRow;
  zod?: typeof TaskRowSchema; // or ZodObject<any>
  fields?: Record<string, { type: 'text' | 'select' | 'multiselect' | 'date'; options?: { value: any, label: string }[] }>
} = $props();

function submit() {
  const parsed = zod ? zod.partial().safeParse(item) : { success: true, data: item };
  if (!parsed.success) {
    // show validation errors
    return;
  }
  // emit patch event with changed fields only
}
```

#### 2) Column rendering for complex fields
Use custom cells instead of `createColumnsFromData` for fields like `tags`, `assignedUsers`, `priority`, `status`, dates, etc. You’re already doing this for a few columns — extend that:
- `tags`: chips with a popover multiselect
- `assignedUsers`: avatars + multiselect
- `priority`: badge + select
- `status`: badge + select
- `planned`/`due`: date picker with consistent timezone handling

Each cell should keep local UI state, validate with Zod, and emit a patch to the table/page store.

#### 3) Persisting updates
- Ensure every row has its primary key `id` (you already do).
- On edit submit, build an `UpdateTaskDto` with only changed fields and post to a SvelteKit action or endpoint.
- Prefer JSON posts for complex updates. If you must use `FormData`, serialize arrays as `tagIds[]=...` etc.

Example SvelteKit action (update):

```ts
// src\routes\tasks\+page.server.ts
export const actions: Actions = {
  // ...create
  update: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Not authenticated' });

    const body = await request.json();
    const parsed = UpdateTaskDtoSchema.safeParse(body);
    if (!parsed.success) return fail(400, { message: 'Invalid payload', errors: parsed.error.flatten() });

    const dto = parsed.data;
    await initializeDatabase();

    const taskRepo = AppDataSource.getRepository(Task);
    const task = await taskRepo.findOne({ where: { id: dto.id } });
    if (!task) return fail(404, { message: 'Task not found' });

    // map primitives
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description ?? null;
    if (dto.isActive !== undefined) task.isActive = dto.isActive;
    if (dto.isDone !== undefined) task.isDone = dto.isDone;
    if (dto.isMeta !== undefined) task.isMeta = dto.isMeta;
    if (dto.taskStatusId !== undefined) task.taskStatus = { id: dto.taskStatusId } as any;
    if (dto.priorityId !== undefined) task.priority = dto.priorityId ? ({ id: dto.priorityId } as any) : null;
    if (dto.plannedStartDate !== undefined) task.plannedStartDate = new Date(dto.plannedStartDate);
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.parentTaskId !== undefined) task.parent = dto.parentTaskId ? ({ id: dto.parentTaskId } as any) : null;

    // relations
    const tagRepo = AppDataSource.getRepository(Tag);
    const userRepo = AppDataSource.getRepository(User);

    if (dto.tagIds) {
      const tags = await tagRepo.findBy({ id: In(dto.tagIds as any) });
      // persist join table accordingly (TaskTag)
      // ...clear/replace or diff update
    }

    if (dto.assignedUserIds) {
      const users = await userRepo.findBy({ id: In(dto.assignedUserIds as any) });
      // persist UserTask join table
    }

    await taskRepo.save(task);
    return { success: true };
  }
};
```

Note: you already have CSV handling for tags in `create`. You can keep that as a backward-compat ramp but prefer IDs.

### Sorting, filtering, and faceting with complex fields
- TanStack columns for arrays should supply a `sortingFn` and `filterFn`.
- You can sort `tags` by the first tag name or by count; filter with set membership.

```ts
const tagColumn: ColumnDef<TaskRow> = {
  accessorKey: 'tags',
  header: 'Tags',
  cell: ({ row }) => row.original.tags.map(t => t.name).join(', '),
  filterFn: (row, id, filterValues: string[]) => {
    const names = (row.getValue(id) as {name: string}[]).map(t => t.name);
    return filterValues.every(v => names.includes(v));
  },
  sortingFn: (a, b, id) => {
    const an = (a.getValue(id) as {name: string}[])[0]?.name ?? '';
    const bn = (b.getValue(id) as {name: string}[])[0]?.name ?? '';
    return an.localeCompare(bn);
  }
};
```

### Migration path from current strings
While you transition, accept both shapes using unions and transform to canonical:

```ts
export const TransitionalTagsSchema = z.union([
  z.array(TagRefSchema),
  z.string().transform(s => s.split(',').map(x => x.trim()).filter(Boolean).map(name => ({ id: name, name })))
]);

export const TransitionalTaskRowSchema = TaskRowSchema.extend({
  tags: TransitionalTagsSchema,
  assignedUsers: z.union([
    z.array(UserRefSchema),
    z.string().transform(s => s.split(',').map(x => x.trim()).filter(Boolean).map(name => ({ id: name, name })))
  ])
}).transform(r => ({
  ...r,
  tags: (r.tags as any[]).map(t => ({ id: t.id, name: t.name })),
  assignedUsers: (r.assignedUsers as any[]).map(u => ({ id: u.id, name: u.name }))
}));
```

### Step‑by‑step plan
1) Define canonical schemas
- Add `TaskEntitySchema`, `TagRefSchema`, `UserRefSchema`, etc. in `schemas.ts`. Keep `TaskRowSchema` as your UI model with structured fields.

2) Build adapters
- Write `taskEntityToRow` and `buildUpdateDtoFromRowPatch`. Use these to feed the table and persist edits.

3) Update `tasks-data-table.svelte`
- For complex columns (`tags`, `assignedUsers`, `priority`, `status`, dates), define explicit cells with inputs bound to structured values, not strings.
- Provide column `meta` so `data-table-cell-viewer` can render appropriate editors and validate using Zod.

4) Implement update action
- Add an `update` action or REST endpoint that receives `UpdateTaskDto` and persists changes by `id`.
- Migrate tag handling from CSV to `tagIds` but keep CSV temporarily for compatibility if needed.

5) Validation on both sides
- Client: validate with the relevant Zod schema before sending the patch.
- Server: validate `UpdateTaskDto` with Zod, then persist. Return structured errors.

6) Improve sorting/filtering for arrays
- Supply `sortingFn`/`filterFn` for `tags`, `assignedUsers`.

7) Incrementally remove string fallbacks
- Once UI and server support IDs/arrays, remove CSV parsing paths.

### Constraints and caveats
- Dates: always normalize to ISO (`toISOString`) when sending, and `z.coerce.date()` on receipt. Beware timezone in UI pickers.
- Performance: when rendering chips/avatars for many rows, memoize derived values and avoid heavy computations in `cell`.
- Keys: your rowId is already `row.id.toString()`. Ensure relation IDs are stable.
- Access control: validate that the current user may assign tags/users.

### Final recommendation
- Do not flatten complex fields into strings as a general rule.
- Represent relations as arrays of `{ id, name }` objects in the row model; persist by IDs.
- Use Zod throughout to validate and to bridge any transitional string inputs.
- Save updates by `id` via patch semantics, keeping the client and server schemas aligned.