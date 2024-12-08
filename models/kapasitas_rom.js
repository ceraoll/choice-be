'use strict';
module.exports = (sequelize, DataTypes) => {
  const KapasitasRom = sequelize.define('KapasitasRom', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'kapasitas_rom',
    timestamps: false,
  });

  return KapasitasRom;
};
