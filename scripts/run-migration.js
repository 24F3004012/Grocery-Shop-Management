const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { pool } = require('../db');

const confirmation = process.argv[2];
const migrationName = process.argv[3] || '001_multi_store_auth.sql';
if (confirmation !== '--confirm') {
  console.error('This changes the Neon schema. Run only after a backup: npm run db:migrate -- --confirm');
  process.exit(1);
}

(async () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', migrationName), 'utf8');
  if (migration.includes("'MIGRATE_ME'")) throw new Error('Prepare the legacy password first: npm run db:prepare');
  const answer = await new Promise((resolve) => {
    const input = readline.createInterface({ input: process.stdin, output: process.stdout });
    input.question('Type APPLY to run the migration: ', (value) => { input.close(); resolve(value); });
  });
  if (answer !== 'APPLY') throw new Error('Migration cancelled.');
  await pool.query(migration);
  console.log('Migration completed.');
  await pool.end();
})().catch(async (error) => {
  console.error(`Migration failed: ${error.message}`);
  await pool.end();
  process.exitCode = 1;
});