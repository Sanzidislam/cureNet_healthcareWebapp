import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('prescriptions', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    appointment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'appointments', key: 'id' },
      onDelete: 'CASCADE'
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medicines: {
      type: DataTypes.JSON,
      allowNull: true
    },
    notes: {
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
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('prescriptions');
}
