import { sqliteTable, AnySQLiteColumn, uniqueIndex, foreignKey, text, integer } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const sessions = sqliteTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	token: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	uniqueIndex("sessions_token_unique").on(table.token),
]);

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	uniqueIndex("users_email_unique").on(table.email),
]);

export const projects = sqliteTable("projects", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	description: text(),
	notes: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

