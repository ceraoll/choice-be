'use strict';
module.exports = (sequelize, DataTypes) => {
  const TipeProcessor = sequelize.define('TipeProcessor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'tipe_processor',
    timestamps: false,
  });

  return TipeProcessor;
};
