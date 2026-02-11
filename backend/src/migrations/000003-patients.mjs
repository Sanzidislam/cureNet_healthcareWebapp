import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('patients', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    blood_type: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emergency_contact: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergency_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    insurance_provider: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    insurance_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('patients');
}
