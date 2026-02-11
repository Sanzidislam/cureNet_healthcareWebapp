/**
 * Generate migration .mjs files from Sequelize models.
 * Run from backend: node scripts/generate-migrations-from-models.mjs
 * Writes to src/migrations/ (back up or use git before overwriting).
 *
 * Table order respects foreign keys: users → doctors, patients, password_reset_tokens
 * → appointments → prescriptions, ratings; audit_logs last.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../src/models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'src', 'migrations');

// Model names in dependency order (so FKs exist when table is created)
const MODEL_ORDER = [
  'User',
  'Doctor',
  'Patient',
  'PasswordResetToken',
  'Appointment',
  'Prescription',
  'Rating',
  'AuditLog',
];

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Serialize a Sequelize attribute type to DataTypes.XXX(...) source code.
 */
function typeToCode(attr) {
  const t = attr.type;
  if (!t || !t.key) return 'DataTypes.JSON';
  switch (t.key) {
    case 'INTEGER':
      return 'DataTypes.INTEGER';
    case 'BIGINT':
      return 'DataTypes.BIGINT';
    case 'STRING':
      return `DataTypes.STRING(${t._length ?? 255})`;
    case 'TEXT':
      return 'DataTypes.TEXT';
    case 'DATE':
      return 'DataTypes.DATE';
    case 'DATEONLY':
      return 'DataTypes.DATEONLY';
    case 'BOOLEAN':
      return 'DataTypes.BOOLEAN';
    case 'DECIMAL':
      return `DataTypes.DECIMAL(${t._precision ?? 10}, ${t._scale ?? 2})`;
    case 'JSON':
      return 'DataTypes.JSON';
    case 'ENUM':
      if (Array.isArray(t.values) && t.values.length) {
        const args = t.values.map((v) => `'${String(v).replace(/'/g, "\\'")}'`).join(', ');
        return `DataTypes.ENUM(${args})`;
      }
      return 'DataTypes.ENUM()';
    default:
      return `DataTypes.${t.key}`;
  }
}

function attrToLines(attrName, attr, colName) {
  const lines = [`    ${colName}: {`, `      type: ${typeToCode(attr)},`];
  if (attr.primaryKey) lines.push('      primaryKey: true,');
  if (attr.autoIncrement) lines.push('      autoIncrement: true,');
  if (attr.allowNull === false) lines.push('      allowNull: false,');
  else if (attr.allowNull === true) lines.push('      allowNull: true,');
  if (attr.defaultValue !== undefined) {
    const dv = attr.defaultValue;
    if (typeof dv === 'boolean') lines.push(`      defaultValue: ${dv},`);
    else if (typeof dv === 'number') lines.push(`      defaultValue: ${dv},`);
    else lines.push(`      defaultValue: '${String(dv).replace(/'/g, "\\'")}',`);
  }
  if (attr.unique) lines.push('      unique: true,');
  if (attr.references) {
    lines.push(`      references: { model: '${attr.references.model}', key: '${attr.references.key}' },`);
    if (attr.onDelete) lines.push(`      onDelete: '${attr.onDelete}',`);
  }
  lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
  lines.push('    },');
  return lines.join('\n');
}

function modelToMigrationBody(model) {
  const tableName = model.getTableName();
  const raw = model.rawAttributes || {};
  const options = model.options || {};
  const lines = [];

  const attrs = {};
  for (const [attrName, attr] of Object.entries(raw)) {
    const colName = attr.field || camelToSnake(attrName);
    attrs[colName] = attrToLines(attrName, attr, colName);
  }
  const attrBlock = Object.values(attrs).join('\n').replace(/,\n    \},/g, '\n    },');
  lines.push(`  await queryInterface.createTable('${tableName}', {`);
  lines.push(attrBlock);
  lines.push('  });');

  const indexes = options.indexes || [];
  for (const idx of indexes) {
    const fields = idx.fields || [];
    if (fields.length) lines.push(`  await queryInterface.addIndex('${tableName}', [${fields.map((f) => `'${f}'`).join(', ')}]);`);
  }

  return lines.join('\n');
}

function generateOneMigration(model, index) {
  const tableName = model.getTableName();
  const num = String(index + 1).padStart(6, '0');
  const slug = tableName.replace(/_/g, '-');
  const body = modelToMigrationBody(model);
  return `import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
${body}
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('${tableName}');
}
`;
}

function main() {
  const { sequelize } = db;
  const models = sequelize.models;
  if (!models) {
    console.error('No models found on sequelize.');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  MODEL_ORDER.forEach((name, index) => {
    const model = models[name];
    if (!model) {
      console.warn(`Model ${name} not found, skipping.`);
      return;
    }
    const num = String(index + 1).padStart(6, '0');
    const tableName = model.getTableName();
    const slug = tableName.replace(/_/g, '-');
    const filename = `${num}-${slug}.mjs`;
    const filepath = path.join(OUT_DIR, filename);
    const content = generateOneMigration(model, index);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Wrote', filename);
  });

  console.log('Done. Review diff before committing.');
}

main();
