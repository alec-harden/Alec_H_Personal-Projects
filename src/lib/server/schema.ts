import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// Template Types (exported for use in other files)
// =============================================================================

/**
 * Joinery method option with skill level indicator
 */
export interface JoineryOption {
	id: string;
	name: string;
	description: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Dimension range with min/max/default values
 */
export interface DimensionRange {
	min: number;
	max: number;
	default: number;
}

/**
 * Template dimensions with ranges for length, width, optional height
 */
export interface TemplateDimensions {
	length: DimensionRange;
	width: DimensionRange;
	height?: DimensionRange;
	unit: 'inches';
}

// Users table for authentication
export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
	disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' })
});

// Sessions table for session management
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// Password reset tokens table
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
	tokenHash: text('token_hash').primaryKey(), // SHA-256 hash of token
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// Email verification tokens table
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
	tokenHash: text('token_hash').primaryKey(), // SHA-256 hash of token
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// Drizzle relations for query API
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	projects: many(projects),
	passwordResetTokens: many(passwordResetTokens),
	emailVerificationTokens: many(emailVerificationTokens),
	cutLists: many(cutLists)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	})
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
	user: one(users, {
		fields: [emailVerificationTokens.userId],
		references: [users.id]
	})
}));

// Projects table with user ownership
export const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Projects relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
	user: one(users, {
		fields: [projects.userId],
		references: [users.id]
	}),
	boms: many(boms),
	cutLists: many(cutLists)
}));

// BOMs table - bill of materials linked to projects
export const boms = sqliteTable('boms', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	projectType: text('project_type').notNull(),
	generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// BOM items table - individual line items in a BOM
export const bomItems = sqliteTable('bom_items', {
	id: text('id').primaryKey(),
	bomId: text('bom_id')
		.notNull()
		.references(() => boms.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	quantity: integer('quantity').notNull(),
	unit: text('unit').notNull(),
	category: text('category').notNull(),
	notes: text('notes'),
	hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
	position: integer('position').notNull(),
	// Lumber dimensions (nullable, for lumber items only)
	length: real('length'), // inches
	width: real('width'), // inches
	height: real('height') // inches (thickness)
});

// BOMs relations
export const bomsRelations = relations(boms, ({ one, many }) => ({
	project: one(projects, {
		fields: [boms.projectId],
		references: [projects.id]
	}),
	items: many(bomItems)
}));

// BOM items relations
export const bomItemsRelations = relations(bomItems, ({ one }) => ({
	bom: one(boms, {
		fields: [bomItems.bomId],
		references: [boms.id]
	})
}));

// =============================================================================
// Templates Table
// =============================================================================

// Templates table - project templates for BOM generation
export const templates = sqliteTable('templates', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	icon: text('icon').notNull(),
	description: text('description').notNull(),
	defaultDimensions: text('default_dimensions', { mode: 'json' })
		.$type<TemplateDimensions>()
		.notNull(),
	joineryOptions: text('joinery_options', { mode: 'json' })
		.$type<JoineryOption[]>()
		.notNull(),
	suggestedWoods: text('suggested_woods', { mode: 'json' }).$type<string[]>().notNull(),
	suggestedFinishes: text('suggested_finishes', { mode: 'json' }).$type<string[]>().notNull(),
	typicalHardware: text('typical_hardware', { mode: 'json' }).$type<string[]>().notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Templates relations (standalone - no foreign keys)
export const templatesRelations = relations(templates, () => ({}));

// =============================================================================
// Cut List Optimizer Tables
// =============================================================================

// Cut lists table - stores cut optimization projects
export const cutLists = sqliteTable('cut_lists', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	mode: text('mode', { enum: ['linear', 'sheet'] }).notNull(),
	kerf: real('kerf').notNull().default(0.125), // blade width in inches
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Cut list cuts table - pieces to cut from stock
export const cutListCuts = sqliteTable('cut_list_cuts', {
	id: text('id').primaryKey(),
	cutListId: text('cut_list_id')
		.notNull()
		.references(() => cutLists.id, { onDelete: 'cascade' }),
	length: real('length').notNull(), // inches
	width: real('width'), // inches, only for sheet mode
	quantity: integer('quantity').notNull().default(1),
	label: text('label'), // optional name like "Table top"
	position: integer('position').notNull(), // for ordering
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	// Manual override fields
	assignedStockId: text('assigned_stock_id').references(() => cutListStock.id, { onDelete: 'set null' }),
	overridePosition: real('override_position') // nullable, null = use algorithm position
});

// Cut list stock table - available stock to cut from
export const cutListStock = sqliteTable('cut_list_stock', {
	id: text('id').primaryKey(),
	cutListId: text('cut_list_id')
		.notNull()
		.references(() => cutLists.id, { onDelete: 'cascade' }),
	length: real('length').notNull(), // inches
	width: real('width'), // inches, only for sheet mode
	quantity: integer('quantity').notNull().default(1),
	label: text('label'), // optional name like "8ft pine"
	position: integer('position').notNull() // for ordering
});

// Cut list relations
export const cutListsRelations = relations(cutLists, ({ one, many }) => ({
	user: one(users, {
		fields: [cutLists.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [cutLists.projectId],
		references: [projects.id]
	}),
	cuts: many(cutListCuts),
	stock: many(cutListStock)
}));

export const cutListCutsRelations = relations(cutListCuts, ({ one }) => ({
	cutList: one(cutLists, {
		fields: [cutListCuts.cutListId],
		references: [cutLists.id]
	})
}));

export const cutListStockRelations = relations(cutListStock, ({ one }) => ({
	cutList: one(cutLists, {
		fields: [cutListStock.cutListId],
		references: [cutLists.id]
	})
}));
