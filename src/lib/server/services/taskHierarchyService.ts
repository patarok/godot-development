import { AppDataSource } from "$lib/server/database";
import { Task } from '$lib/server/database/entities/task/Task';

export type SubtreeRollup = {
    inProgressCount: number;
    notStartedCount: number;
    doneCount: number;
    blockedCount: number;
    maxDepth: number;
    hasDescendantInProgress: boolean;
};

export type Ancestor = { id: string; level: number };

export type FlatSubtreeRow = {
    id: string;
    parent_task_id: string | null;
    level: number;
    title: string;
    is_active: boolean;
    is_done: boolean;
    task_status_id: string | null;
    task_status_name: string | null;
    task_status_rank: number | null;
};

export type TreeNode = {
    id: string;
    parentId: string | null;
    level: number;
    title: string;
    isActive: boolean;
    isDone: boolean;
    status: { id: string | null; name: string | null; rank: number | null };
    children: TreeNode[];
};

/**
 * Compute subtree metrics for a task using a recursive CTE over the adjacency list (parent pointer).
 * No closure table required.
 */
export async function getSubtreeRollup(taskId: string): Promise<SubtreeRollup> {
    const sql = `
    WITH RECURSIVE tree AS (
      SELECT t.id, t.parent_task_id, 0 AS lvl
      FROM task t
      WHERE t.id = $1
      UNION ALL
      SELECT c.id, c.parent_task_id, tree.lvl + 1
      FROM task c
      JOIN tree ON c.parent_task_id = tree.id
    )
    SELECT
      COALESCE(SUM(CASE WHEN ts.rank > 0 AND NOT t.is_done AND t.is_active THEN 1 ELSE 0 END), 0) AS in_progress_count,
      COALESCE(SUM(CASE WHEN (ts.rank IS NULL OR ts.rank = 0) AND t.is_active THEN 1 ELSE 0 END), 0) AS not_started_count,
      COALESCE(SUM(CASE WHEN t.is_done THEN 1 ELSE 0 END), 0) AS done_count,
      COALESCE(SUM(CASE WHEN ts.name = 'Blocked' AND t.is_active THEN 1 ELSE 0 END), 0) AS blocked_count,
      COALESCE(MAX(lvl), 0) AS max_depth,
      COALESCE(BOOL_OR(ts.rank > 0 AND NOT t.is_done AND t.is_active AND lvl > 0), false) AS has_descendant_in_progress
    FROM tree
    JOIN task t ON t.id = tree.id
    LEFT JOIN task_status ts ON ts.id = t.task_status_id;
  `;
    const rows = await AppDataSource.manager.query(sql, [taskId]);
    const r = rows?.[0] ?? {};
    return {
        inProgressCount: Number(r.in_progress_count ?? 0),
        notStartedCount: Number(r.not_started_count ?? 0),
        doneCount: Number(r.done_count ?? 0),
        blockedCount: Number(r.blocked_count ?? 0),
        maxDepth: Number(r.max_depth ?? 0),
        hasDescendantInProgress: Boolean(r.has_descendant_in_progress ?? false),
    };
}

/**
 * Return all ancestors for a given task (including itself at level 0), ordered from self upwards.
 */
export async function getAncestors(taskId: string): Promise<Ancestor[]> {
    const sql = `
    WITH RECURSIVE up AS (
      SELECT t.id, t.parent_task_id, 0 AS lvl
      FROM task t WHERE t.id = $1
      UNION ALL
      SELECT p.id, p.parent_task_id, up.lvl + 1
      FROM task p
      JOIN up ON up.parent_task_id = p.id
    )
    SELECT id, lvl AS level
    FROM up
    ORDER BY level;
  `;
    const rows = await AppDataSource.manager.query(sql, [taskId]);
    return rows.map((r: any) => ({ id: r.id as string, level: Number(r.level) }));
}

/**
 * Fetch the subtree as a flat list with levels and minimal status data.
 */
export async function getSubtreeFlat(taskId: string): Promise<FlatSubtreeRow[]> {
    const sql = `
    WITH RECURSIVE tree AS (
      SELECT t.id, t.parent_task_id, 0 AS lvl
      FROM task t
      WHERE t.id = $1
      UNION ALL
      SELECT c.id, c.parent_task_id, tree.lvl + 1
      FROM task c
      JOIN tree ON c.parent_task_id = tree.id
    )
    SELECT
      t.id,
      t.parent_task_id,
      tree.lvl AS level,
      t.title,
      t.is_active,
      t.is_done,
      t.task_status_id,
      ts.name AS task_status_name,
      ts.rank AS task_status_rank
    FROM tree
    JOIN task t ON t.id = tree.id
    LEFT JOIN task_status ts ON ts.id = t.task_status_id
    ORDER BY level, t.created_at, t.id;
  `;
    const rows = await AppDataSource.manager.query(sql, [taskId]);
    return rows as FlatSubtreeRow[];
}

/**
 * Build a nested tree in memory from the flat subtree.
 */
export async function getSubtreeTree(taskId: string): Promise<TreeNode> {
    const flat = await getSubtreeFlat(taskId);
    if (flat.length === 0) throw new Error('Task not found');

    const nodes = new Map<string, TreeNode>();
    let root: TreeNode | null = null;

    for (const r of flat) {
        nodes.set(r.id, {
            id: r.id,
            parentId: r.parent_task_id,
            level: r.level,
            title: r.title,
            isActive: r.is_active,
            isDone: r.is_done,
            status: { id: r.task_status_id, name: r.task_status_name, rank: r.task_status_rank },
            children: [],
        });
    }

    for (const n of nodes.values()) {
        if (n.parentId && nodes.has(n.parentId)) {
            nodes.get(n.parentId)!.children.push(n);
        } else if (n.level === 0) {
            root = n;
        }
    }

    if (!root) throw new Error('Root not resolved');
    return root;
}

/**
 * Check if reparenting a task under newParentId would create a cycle.
 * Returns ok=false if newParentId is equal to taskId or a descendant of taskId.
 * Pass newParentId = null to detach to root (always ok unless equal, which cannot happen).
 */
export async function canReparent(taskId: string, newParentId: string | null): Promise<{ ok: boolean; reason?: string }> {
    if (!newParentId) return { ok: true };
    if (newParentId === taskId) return { ok: false, reason: 'Task cannot be its own parent' };

    const sql = `
    WITH RECURSIVE tree AS (
      SELECT t.id
      FROM task t WHERE t.id = $1
      UNION ALL
      SELECT c.id
      FROM task c
      JOIN tree ON c.parent_task_id = tree.id
    )
    SELECT 1 FROM tree WHERE id = $2 LIMIT 1;
  `;
    const rows = await AppDataSource.manager.query(sql, [taskId, newParentId]);
    if (rows.length > 0) {
        return { ok: false, reason: 'New parent is a descendant of the task (cycle)' };
    }
    return { ok: true };
}

/**
 * Convenience: load a Task with minimal relations using TypeORM, if needed by callers.
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
    const repo = AppDataSource.getRepository(Task);
    return repo.findOne({ where: { id: taskId }, relations: ['taskStatus', 'parent'] });
}
