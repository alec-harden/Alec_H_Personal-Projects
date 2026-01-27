import { relations } from "drizzle-orm/relations";
import { users, sessions, projects } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	projects: many(projects),
}));

export const projectsRelations = relations(projects, ({one}) => ({
	user: one(users, {
		fields: [projects.userId],
		references: [users.id]
	}),
}));