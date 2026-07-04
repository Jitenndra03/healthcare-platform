import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function migrate() {
  const migrationDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
    await pool.query(sql);
    console.log(`✓ ${file}`);
  }

  await pool.end();
  console.log('All migrations complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
