import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('audit_logs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('audit_logs', ['action']);
  await queryInterface.addIndex('audit_logs', ['created_at']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('audit_logs');
}
