const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcrypt');

const migrationPath = path.join(__dirname, '..', 'migrations', '001_multi_store_auth.sql');

function readPassword(prompt) {
  return new Promise((resolve) => {
    const input = readline.createInterface({ input: process.stdin, output: process.stdout });
    input.question(prompt, (value) => {
      input.close();
      resolve(value);
    });
  });
}

(async () => {
  const password = await readPassword('Enter a temporary legacy-owner password: ');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  const hash = await bcrypt.hash(password, 12);
  const migration = fs.readFileSync(migrationPath, 'utf8');
  if (!migration.includes("'MIGRATE_ME'")) throw new Error('Migration placeholder was not found; refusing to modify the file.');
  fs.writeFileSync(migrationPath, migration.replace("'MIGRATE_ME'", `'${hash}'`));
  console.log('Migration prepared with a bcrypt password hash. The database was not changed.');
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});