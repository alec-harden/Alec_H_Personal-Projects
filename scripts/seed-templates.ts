/**
 * Seed script to migrate hardcoded templates to database
 * Run with: npx tsx scripts/seed-templates.ts
 *
 * Note: This script creates its own database connection because it runs
 * outside of SvelteKit and cannot use $env imports.
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/server/schema';
import { templates as hardcodedTemplates } from '../src/lib/data/templates';

// Create standalone database connection for script
const client = createClient({
	url: process.env.TURSO_DATABASE_URL || 'file:local.db',
	authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

const db = drizzle(client, { schema });

async function seedTemplates() {
	console.log('Migrating templates to database...');

	for (const template of hardcodedTemplates) {
		const now = new Date();

		// Check if template already exists
		const existing = await db.query.templates.findFirst({
			where: eq(schema.templates.id, template.id)
		});

		if (existing) {
			console.log(`  = ${template.name} (already exists)`);
			continue;
		}

		try {
			await db.insert(schema.templates).values({
				id: template.id,
				name: template.name,
				icon: template.icon,
				description: template.description,
				defaultDimensions: template.defaultDimensions,
				joineryOptions: template.joineryOptions,
				suggestedWoods: template.suggestedWoods,
				suggestedFinishes: template.suggestedFinishes,
				typicalHardware: template.typicalHardware,
				createdAt: now,
				updatedAt: now
			});

			console.log(`  + ${template.name}`);
		} catch (err: unknown) {
			const error = err as Error;
			console.error(`  ! ${template.name}: ${error.message}`);
		}
	}

	console.log('Migration complete!');
}

seedTemplates()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Migration failed:', err);
		process.exit(1);
	});
