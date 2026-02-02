import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { 
    AppDataSource, 
    Project, 
    TimeEntry, 
    Task, 
    ProjectLog, 
    UserCurrentActiveProject,
    Priority,
    ProjectStatus,
    RiskLevel,
    User,
    TaskStatus,
    TaskType
} from '$lib/server/database';
import { Between, In } from 'typeorm';
import { toPlainArray } from '$lib/utils/index';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const activeProjectRepo = AppDataSource.getRepository(UserCurrentActiveProject);
    let activeProjectRecord = await activeProjectRepo.findOne({
        where: { userId: locals.user.id }
    });

    if (!activeProjectRecord) {
        throw redirect(302, '/projects');
    }

    const projectId = activeProjectRecord.projectId;
    locals.user.activeProjectId = projectId;

    const projectRepo = AppDataSource.getRepository(Project);
    
    // Fetch project with relations
    const project = await projectRepo.findOne({
        where: { id: projectId },
        relations: [
            'projectStatus',
            'priority',
            'riskLevel',
            'assignedUserLinks',
            'assignedUserLinks.user',
            'responsibleUserLinks',
            'responsibleUserLinks.user',
            'taskLinks',
            'taskLinks.task'
        ]
    });

    if (!project) {
        throw error(404, 'Project not found');
    }

    // Aggregate contributions (last 30 days)
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get tasks for this project to filter time entries
    const taskIds = project.taskLinks?.map(tl => tl.task.id) || [];
    
    let contributions = [];
    if (taskIds.length > 0) {
        const timeEntries = await timeEntryRepo.find({
            where: {
                taskId: In(taskIds),
                startedAt: Between(thirtyDaysAgo, new Date())
            }
        });

        const dailyHours: Record<string, number> = {};
        
        timeEntries.forEach(entry => {
            if (entry.minutes) {
                const dateStr = entry.startedAt.toISOString().split('T')[0];
                dailyHours[dateStr] = (dailyHours[dateStr] || 0) + (entry.minutes / 60);
            }
        });

        contributions = Object.entries(dailyHours)
            .map(([date, hours]) => ({ date, hours }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Project Revenue Calculation
    const revenueData = [
        { name: 'Estimated', value: project.estimatedBudget || 0 },
        { name: 'Actual Cost', value: project.actualCost || 0 }
    ];

    // Load Lookups for ProjectMetaCard
    const [priorities, states, riskLevels, users, allTasks, taskStates, taskTypes] = await Promise.all([
        AppDataSource.getRepository(Priority).find({ order: { rank: 'ASC', name: 'ASC' } }),
        AppDataSource.getRepository(ProjectStatus).find({ order: { rank: 'ASC', name: 'ASC' } }),
        AppDataSource.getRepository(RiskLevel).find({ order: { rank: 'ASC', name: 'ASC' } }),
        AppDataSource.getRepository(User).find({ order: { email: 'ASC' } }),
        AppDataSource.getRepository(Task).find({
            order: { createdAt: 'DESC' },
            where: { isMeta: true },
            select: { id: true, title: true }
        }),
        AppDataSource.getRepository(TaskStatus).find({ order: { rank: 'ASC', name: 'ASC' } }),
        AppDataSource.getRepository(TaskType).find({ order: { rank: 'ASC', name: 'ASC' } })
    ]);

    // Prepare involvedUsers for ProjectMetaCard
    const involvedUsers = project.assignedUserLinks?.map(l => ({
        ...l.user,
        flags: { projectAssigned: true }
    })) || [];
    
    const projectPlain = toPlainArray([project])[0];
    projectPlain.involvedUsers = involvedUsers;

    return {
        project: projectPlain,
        contributions,
        revenueData,
        dailyGoal: activeProjectRecord.dailyGoal,
        priorities: toPlainArray(priorities),
        states: toPlainArray(states),
        riskLevels: toPlainArray(riskLevels),
        users: toPlainArray(users),
        taskStates: toPlainArray(taskStates),
        taskPriorities: toPlainArray(priorities),
        taskTypes: toPlainArray(taskTypes),
        metaTasks: toPlainArray(allTasks)
    };
};

export const actions: Actions = {
    reportIssue: async ({ request, locals }) => {
        if (!locals.user || !locals.user.activeProjectId) throw error(401);
        
        const data = await request.formData();
        const area = data.get('area') as string;
        const subject = data.get('subject') as string;
        const description = data.get('description') as string;
        const severity = data.get('severity') as string;

        const logRepo = AppDataSource.getRepository(ProjectLog);
        const log = logRepo.create({
            projectId: locals.user.activeProjectId,
            userId: locals.user.id,
            action: 'project.issue_reported',
            message: `ISSUE REPORTED: [${area}] ${subject} (Severity: ${severity}) - ${description}`
        });

        await logRepo.save(log);

        return { success: true };
    },

    updateDailyGoal: async ({ request, locals }) => {
        if (!locals.user) throw error(401);
        
        const data = await request.formData();
        const dailyGoal = parseFloat(data.get('dailyGoal') as string);
        
        if (isNaN(dailyGoal)) return fail(400, { message: 'Invalid goal' });

        const activeProjectRepo = AppDataSource.getRepository(UserCurrentActiveProject);
        await activeProjectRepo.update(
            { userId: locals.user.id },
            { dailyGoal }
        );

        return { success: true };
    },

    update: async ({ request, locals }) => {
        const form = await request.formData();
        const id = form.get('projectId') as string;
        if (!id) return fail(400, { message: 'Missing project ID' });

        const projectRepo = AppDataSource.getRepository(Project);
        const project = await projectRepo.findOne({ where: { id } });
        if (!project) return fail(404, { message: 'Project not found' });

        const title = form.get('title') as string;
        if (title) project.title = title;
        
        const description = form.get('description') as string;
        project.description = description;

        await projectRepo.save(project);
        return { success: true };
    }
};
