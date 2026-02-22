import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  // Add chamber_windows column to doctors table
  await queryInterface.addColumn('doctors', 'chamber_windows', {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Window-based availability: { monday: { morning: { enabled: true, maxPatients: 10 }, noon: {...}, evening: {...} }, ... }',
  });

  // Add window and serial columns to appointments table
  await queryInterface.addColumn('appointments', 'window', {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Window name: morning, noon, or evening',
  });

  await queryInterface.addColumn('appointments', 'serial', {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Serial number within the window (1, 2, 3, ...)',
  });

  // Add index for window-based queries
  await queryInterface.addIndex('appointments', ['doctor_id', 'appointment_date', 'window']);
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeIndex('appointments', ['doctor_id', 'appointment_date', 'window']);
  await queryInterface.removeColumn('appointments', 'serial');
  await queryInterface.removeColumn('appointments', 'window');
  await queryInterface.removeColumn('doctors', 'chamber_windows');
}
