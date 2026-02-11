import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('doctors', {
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
    bmdc_registration_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    education: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    certifications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hospital: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    consultation_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    chamber_times: {
      type: DataTypes.JSON,
      allowNull: true
    },
    degrees: {
      type: DataTypes.JSON,
      allowNull: true
    },
    awards: {
      type: DataTypes.JSON,
      allowNull: true
    },
    languages: {
      type: DataTypes.JSON,
      allowNull: true
    },
    services: {
      type: DataTypes.JSON,
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
  await queryInterface.dropTable('doctors');
}
