import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { AppDataSource, Task, initializeDatabase, User } from '$lib/server/database';
import type { KanbanCircleColor } from '$lib/components/kanban/kanban-board-types';
import { toPlainArray } from '$lib/utils/index';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        return { columns: [] };
    }

    await initializeDatabase();

    // Fetch tasks with all required relations
    const taskRepo = AppDataSource.getRepository(Task);
    const tasks = await taskRepo.find({
        relations: ['taskStatus', 'priority', 'assignedUsers', 'project', 'creator'],
        where: { isActive: true },
        order: { dueDate: 'ASC' }
    });

    // Get current week's date range (Sunday to Saturday)
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);

    // Create 7 columns for the week (Sunday to Saturday)
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const colors: KanbanCircleColor[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'primary'];

    const columns = weekdays.map((day, index) => {
        const columnDate = new Date(startOfWeek);
        columnDate.setDate(startOfWeek.getDate() + index);
        
        // Filter tasks that are due on this day
        const dayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDue = new Date(task.dueDate);
            return (
                taskDue.getFullYear() === columnDate.getFullYear() &&
                taskDue.getMonth() === columnDate.getMonth() &&
                taskDue.getDate() === columnDate.getDate()
            );
        });

        return {
            id: columnDate.toISOString().split('T')[0], // YYYY-MM-DD format
            title: `${day} ${columnDate.getMonth() + 1}/${columnDate.getDate()}`,
            weekday: index,
            date: columnDate.toISOString(),
            color: colors[index],
            items: dayTasks.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                priority: t.priority?.name ?? null,
                priorityId: t.priority?.id ?? null,
                status: t.taskStatus?.name ?? null,
                statusId: t.taskStatus?.id ?? null,
                dueDate: t.dueDate,
                isDone: t.isDone,
                isActive: t.isActive,
                assignees: (t.assignedUsers ?? []).map(u => ({
                    id: u.id,
                    email: u.email,
                    forename: u.forename,
                    surname: u.surname,
                    username: u.username
                })),
                project: t.project ? {
                    id: t.project.id,
                    title: t.project.title,
                    avatarData: t.project.avatarData
                } : null
            }))
        };
    });

    return { columns: toPlainArray(columns) };
};

export const actions: Actions = {
    moveCard: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Not authenticated' });

        await initializeDatabase();

        const form = await request.formData();
        const cardId = String(form.get('cardId'));
        const targetColumnId = String(form.get('columnId')); // This is the date string (YYYY-MM-DD)

        const taskRepo = AppDataSource.getRepository(Task);
        const task = await taskRepo.findOne({ where: { id: cardId } });
        if (!task) return fail(404, { message: 'Task not found' });

        // Parse the target column date and update task's dueDate
        try {
            const newDueDate = new Date(targetColumnId);
            if (isNaN(newDueDate.getTime())) {
                return fail(400, { message: 'Invalid date format' });
            }
            
            task.dueDate = newDueDate;
            await taskRepo.save(task);

            return { success: true };
        } catch (error) {
            return fail(500, { message: 'Failed to update task due date' });
        }
    },

    updateCard: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Not authenticated' });

        await initializeDatabase();

        const form = await request.formData();
        const cardId = String(form.get('cardId'));
        const title = String(form.get('title'));

        const taskRepo = AppDataSource.getRepository(Task);
        const task = await taskRepo.findOne({ where: { id: cardId } });
        if (!task) return fail(404, { message: 'Task not found' });

        task.title = title;
        await taskRepo.save(task);

        return { success: true };
    },

    addCard: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { message: 'Not authenticated' });

        await initializeDatabase();

        const form = await request.formData();
        const columnId = String(form.get('columnId')); // Date string (YYYY-MM-DD)
        const title = String(form.get('title'));

        // Parse the column date for the task's dueDate
        const dueDate = new Date(columnId);
        if (isNaN(dueDate.getTime())) {
            return fail(400, { message: 'Invalid date format' });
        }

        const taskRepo = AppDataSource.getRepository(Task);
        const userRepo = AppDataSource.getRepository(User);
        
        // Get the creator
        const creator = await userRepo.findOne({ where: { email: locals.user.email } });

        const task = taskRepo.create({
            title,
            dueDate,
            isActive: true,
            creator: creator ?? undefined
        });

        await taskRepo.save(task);
        return { success: true, cardId: task.id };
    }
};