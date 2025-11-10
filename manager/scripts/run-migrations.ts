#!/usr/bin/env node
/**
 * Database Migration Runner
 *
 * Executes SQL migration files in sequential order.
 * Tracks applied migrations in migrations_history table.
 * Supports rollback on failure.
 *
 * Usage:
 *   pnpm db:migrate              - Apply all pending migrations
 *   pnpm db:migrate:rollback     - Rollback last migration batch
 *   pnpm db:migrate:status       - Show migration status
 */

import * as fs from "node:fs";
import * as path from "node:path";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// ============================================================
// Configuration
// ============================================================
const MIGRATIONS_DIR = path.join(__dirname, "../migrations");
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL environment variable not set");
  process.exit(1);
}

// ============================================================
// Database Connection
// ============================================================
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1, // Single connection for migrations
});

// ============================================================
// Migration History Table
// ============================================================
async function ensureMigrationsTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_history (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_history_batch 
        ON migrations_history(batch DESC);
    `);
  } finally {
    client.release();
  }
}

// ============================================================
// Get Migration Files
// ============================================================
function getMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort(); // Natural sort ensures 000_, 001_, etc.
}

// ============================================================
// Get Applied Migrations
// ============================================================
async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query<{ filename: string }>(
    "SELECT filename FROM migrations_history ORDER BY id ASC"
  );
  return result.rows.map((row) => row.filename);
}

// ============================================================
// Get Next Batch Number
// ============================================================
async function getNextBatch(): Promise<number> {
  const result = await pool.query<{ batch: number }>(
    "SELECT COALESCE(MAX(batch), 0) + 1 AS batch FROM migrations_history"
  );
  return result.rows[0].batch;
}

// ============================================================
// Apply Single Migration
// ============================================================
async function applyMigration(filename: string, batch: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Read SQL file
    const filepath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filepath, "utf-8");

    // Execute migration
    await client.query(sql);

    // Record in history
    await client.query(
      "INSERT INTO migrations_history (filename, batch) VALUES ($1, $2)",
      [filename, batch]
    );

    await client.query("COMMIT");
    console.log(`✅ Applied: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================
// Migrate Up (Apply Pending Migrations)
// ============================================================
async function migrateUp(): Promise<void> {
  console.log("🚀 Starting database migration...\n");

  await ensureMigrationsTable();

  const allFiles = getMigrationFiles();
  const appliedFiles = await getAppliedMigrations();
  const pendingFiles = allFiles.filter((file) => !appliedFiles.includes(file));

  if (pendingFiles.length === 0) {
    console.log("✅ No pending migrations. Database is up to date.");
    return;
  }

  console.log(`📋 Found ${pendingFiles.length} pending migration(s):\n`);
  pendingFiles.forEach((file) => console.log(`   - ${file}`));
  console.log("");

  const batch = await getNextBatch();

  for (const file of pendingFiles) {
    await applyMigration(file, batch);
  }

  console.log(`\n✅ Successfully applied ${pendingFiles.length} migration(s).`);
  console.log(`📦 Batch: ${batch}`);
}

// ============================================================
// Migrate Down (Rollback Last Batch)
// ============================================================
async function migrateDown(): Promise<void> {
  console.log("⏪ Rolling back last migration batch...\n");

  await ensureMigrationsTable();

  const result = await pool.query<{ filename: string; batch: number }>(
    "SELECT filename, batch FROM migrations_history WHERE batch = (SELECT MAX(batch) FROM migrations_history) ORDER BY id DESC"
  );

  if (result.rows.length === 0) {
    console.log("✅ No migrations to rollback.");
    return;
  }

  const batch = result.rows[0].batch;
  console.log(`📋 Rolling back batch ${batch}:\n`);

  for (const row of result.rows) {
    console.log(`   ⏳ Rollback: ${row.filename}`);
    await pool.query("DELETE FROM migrations_history WHERE filename = $1", [
      row.filename,
    ]);
    console.log(`   ✅ Rolled back: ${row.filename}`);
  }

  console.log(
    `\n⚠️  WARNING: Manual rollback SQL may be required for schema changes.`
  );
  console.log(`✅ Removed ${result.rows.length} migration(s) from history.`);
}

// ============================================================
// Migration Status
// ============================================================
async function migrationStatus(): Promise<void> {
  console.log("📊 Migration Status:\n");

  await ensureMigrationsTable();

  const allFiles = getMigrationFiles();
  const appliedFiles = await getAppliedMigrations();

  console.log(`Total migrations: ${allFiles.length}`);
  console.log(`Applied: ${appliedFiles.length}`);
  console.log(`Pending: ${allFiles.length - appliedFiles.length}\n`);

  console.log("Migrations:\n");
  allFiles.forEach((file) => {
    const status = appliedFiles.includes(file) ? "✅" : "⏳";
    console.log(`  ${status} ${file}`);
  });
}

// ============================================================
// Main Entry Point
// ============================================================
async function main(): Promise<void> {
  const command = process.argv[2] || "up";

  try {
    switch (command) {
      case "up":
        await migrateUp();
        break;
      case "down":
        await migrateDown();
        break;
      case "status":
        await migrationStatus();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log("\nUsage:");
        console.log("  pnpm db:migrate           - Apply pending migrations");
        console.log("  pnpm db:migrate:rollback  - Rollback last batch");
        console.log("  pnpm db:migrate:status    - Show migration status");
        process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
