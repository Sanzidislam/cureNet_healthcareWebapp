import path from 'path';
import { fileURLToPath } from 'url';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use glob + cwd so the pattern has no backslashes (path.join on Windows breaks glob)
const migrationsDir = path.join(__dirname, 'migrations');

const umzug = new Umzug({
  migrations: {
    glob: '*.mjs',
    cwd: migrationsDir,
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export async function runMigrations() {
  const pending = await umzug.pending();
  if (pending.length === 0) {
    console.log('Migrations: none pending.');
    return;
  }
  console.log(`Migrations: running ${pending.length} pending (${pending.map((m) => m.name).join(', ')})...`);
  await umzug.up();
  console.log('Migrations: done.');
}
