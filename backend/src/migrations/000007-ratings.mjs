import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('ratings', {
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
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'appointments', key: 'id' },
      onDelete: 'SET NULL'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    review: {
      type: DataTypes.TEXT,
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
  await queryInterface.addIndex('ratings', ['doctor_id']);
  await queryInterface.addIndex('ratings', ['patient_id']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('ratings');
}
