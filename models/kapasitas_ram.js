'use strict';
module.exports = (sequelize, DataTypes) => {
  const KapasitasRam = sequelize.define('KapasitasRam', {
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
    tableName: 'kapasitas_ram',
    timestamps: false,
  });

  return KapasitasRam;
};
