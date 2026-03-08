import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn('doctors', 'unavailable_dates', {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Doctor blackout dates: ["YYYY-MM-DD", ...]',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('doctors', 'unavailable_dates');
}

