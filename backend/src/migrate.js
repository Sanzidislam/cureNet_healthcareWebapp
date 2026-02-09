import path from 'path';
import { fileURLToPath } from 'url';
import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

// Glob must use forward slashes so fast-glob finds files on both Windows and Linux
// (path.join uses backslashes on Windows, which breaks glob; cwd + '*.mjs' can resolve wrong on Linux)
const globPattern = `${migrationsDir.replace(/\\/g, '/')}/*.mjs`;

const umzug = new Umzug({
  migrations: {
    glob: globPattern,
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
