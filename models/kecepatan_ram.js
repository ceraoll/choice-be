'use strict';
module.exports = (sequelize, DataTypes) => {
  const KecepatanRam = sequelize.define('KecepatanRam', {
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
    tableName: 'kecepatan_ram',
    timestamps: false,
  });

  return KecepatanRam;
};
