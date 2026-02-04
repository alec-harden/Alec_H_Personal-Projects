/**
 * v4.0 Data Migration Script
 * Run with: npx tsx scripts/migrate-v4-data.ts
 *
 * Migrates existing BOM data for v4.0 lumber categorization:
 * - MIG-01: category 'lumber' -> 'hardwood'
 * - MIG-02: cutItem=true for all lumber categories
 * - MIG-03: Copy height values to thickness field
 *
 * Note: This script creates its own database connection because it runs
 * outside of SvelteKit and cannot use $env imports.
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, inArray, isNull, isNotNull, and, or } from 'drizzle-orm';
import * as schema from '../src/lib/server/schema';

// Create standalone database connection for script
const client = createClient({
	url: process.env.TURSO_DATABASE_URL || 'file:local.db',
	authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

const db = drizzle(client, { schema });

async function migrate() {
	console.log('=== v4.0 Data Migration ===\n');
	console.log(`Database: ${process.env.TURSO_DATABASE_URL || 'file:local.db'}\n`);

	// Pre-migration counts
	const lumberItems = await db.query.bomItems.findMany({
		where: eq(schema.bomItems.category, 'lumber')
	});
	console.log(`Found ${lumberItems.length} items with category='lumber'`);

	const itemsNeedingCutItem = await db.query.bomItems.findMany({
		where: and(
			inArray(schema.bomItems.category, ['lumber', 'hardwood', 'common', 'sheet']),
			or(eq(schema.bomItems.cutItem, false), isNull(schema.bomItems.cutItem))
		)
	});
	console.log(`Found ${itemsNeedingCutItem.length} lumber items needing cutItem=true`);

	const itemsWithHeight = await db.query.bomItems.findMany({
		where: and(isNotNull(schema.bomItems.height), isNull(schema.bomItems.thickness))
	});
	console.log(`Found ${itemsWithHeight.length} items with height but no thickness\n`);

	// MIG-01: Update lumber -> hardwood
	if (lumberItems.length > 0) {
		console.log('MIG-01: Updating category lumber -> hardwood...');
		await db
			.update(schema.bomItems)
			.set({ category: 'hardwood' })
			.where(eq(schema.bomItems.category, 'lumber'));
		console.log(`  Updated ${lumberItems.length} items\n`);
	} else {
		console.log('MIG-01: No lumber items to migrate\n');
	}

	// MIG-02: Backfill cutItem=true for lumber categories
	console.log('MIG-02: Backfilling cutItem=true for lumber categories...');
	await db
		.update(schema.bomItems)
		.set({ cutItem: true })
		.where(inArray(schema.bomItems.category, ['hardwood', 'common', 'sheet']));
	console.log('  Done\n');

	// MIG-03: Copy height to thickness (raw SQL needed - Drizzle can't reference columns in .set())
	console.log('MIG-03: Copying height values to thickness...');
	await client.execute(
		'UPDATE bom_items SET thickness = height WHERE height IS NOT NULL AND thickness IS NULL'
	);
	console.log('  Done\n');

	// Post-migration verification
	console.log('=== Post-Migration Verification ===\n');

	const remainingLumber = await db.query.bomItems.findMany({
		where: eq(schema.bomItems.category, 'lumber')
	});
	console.log(`Items with category='lumber': ${remainingLumber.length} (should be 0)`);

	const lumberWithoutCutItem = await db.query.bomItems.findMany({
		where: and(
			inArray(schema.bomItems.category, ['hardwood', 'common', 'sheet']),
			or(eq(schema.bomItems.cutItem, false), isNull(schema.bomItems.cutItem))
		)
	});
	console.log(`Lumber items without cutItem=true: ${lumberWithoutCutItem.length} (should be 0)`);

	const heightWithoutThickness = await db.query.bomItems.findMany({
		where: and(isNotNull(schema.bomItems.height), isNull(schema.bomItems.thickness))
	});
	console.log(`Items with height but no thickness: ${heightWithoutThickness.length} (should be 0)`);

	// Final status
	const allPassed =
		remainingLumber.length === 0 &&
		lumberWithoutCutItem.length === 0 &&
		heightWithoutThickness.length === 0;

	console.log(`\n=== Migration ${allPassed ? 'COMPLETE' : 'INCOMPLETE'} ===`);

	if (!allPassed) {
		process.exit(1);
	}
}

migrate()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Migration failed:', err);
		process.exit(1);
	});
