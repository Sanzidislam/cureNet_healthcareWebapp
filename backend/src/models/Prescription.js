import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Appointment from './Appointment.js';

const Prescription = sequelize.define(
  'Prescription',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'appointments', key: 'id' },
      onDelete: 'CASCADE',
    },
    diagnosis: { type: DataTypes.TEXT, allowNull: true },
    medicines: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of { name, strength, dose, unit, frequency, duration, route, instructions }',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'prescriptions',
    timestamps: true,
    underscored: true,
  }
);

Appointment.hasOne(Prescription, { foreignKey: 'appointmentId' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId' });

export default Prescription;
