import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('appointments', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'patients', key: 'id' },
      onDelete: 'CASCADE'
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'doctors', key: 'id' },
      onDelete: 'CASCADE'
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    time_block: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('in_person', 'video', 'phone'),
      allowNull: false,
      defaultValue: 'in_person'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('requested', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'requested'
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
  await queryInterface.addIndex('appointments', ['doctor_id', 'appointment_date']);
  await queryInterface.addIndex('appointments', ['patient_id']);
  await queryInterface.addIndex('appointments', ['status']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('appointments');
}
