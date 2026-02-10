import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    entityId: {
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
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

AuditLog.belongsTo(User, { foreignKey: 'userId' });

export default AuditLog;
