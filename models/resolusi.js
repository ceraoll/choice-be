'use strict';
module.exports = (sequelize, DataTypes) => {
  const Resolusi = sequelize.define('Resolusi', {
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
    tableName: 'resolusi',
    timestamps: false,
  });

  return Resolusi;
};
