import { z } from "zod/v4";

export const schema = z.object({
	id: z.number(),
	header: z.string(),
	type: z.string(),
	status: z.string(),
	target: z.string(),
	limit: z.string(),
	reviewer: z.string(),
});

export const taskRowSchema = z.object({
	id: z.number(),
	taskUuid: z.string(),
	header: z.string(),
	type: z.string(),
	description: z.string(),
	status: z.string(),
	priority: z.string(),
	assignedProject: z.string(),
	plannedSchedule: z.object({
		plannedStart: z.coerce.date(),
		plannedDue: z.coerce.date(),
	}),
	mainAssignee: z.string(),
	assignedUsers: z.array(z.string()),
	isActive: z.boolean(),
	created: z.coerce.date(),
	updated: z.coerce.date(),
	tags: z.array(z.string()),
	timeSeriesDaily: z.array(z.object({
		date: z.coerce.date(),
		minutes: z.number(),
	})).optional(),
});

export type Schema = z.infer<typeof schema>;
export type TaskRowSchema = z.infer<typeof taskRowSchema>;