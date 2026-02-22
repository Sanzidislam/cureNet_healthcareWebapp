import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.changeColumn('appointments', 'time_block', {
    type: DataTypes.STRING(20),   // ⚠️ Use the exact existing datatype
    allowNull: true,
    comment: 'Time block of the appointment (nullable)',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.changeColumn('appointments', 'time_block', {
    type: DataTypes.STRING(20),   // Must match original definition
    allowNull: false,
    comment: 'Time block of the appointment (required)',
  });
}