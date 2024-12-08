'use strict';
module.exports = (sequelize, DataTypes) => {
  
  const GenerasiProcessor = sequelize.define('GenerasiProcessor', {
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
    tableName: 'generasi_processor',
    timestamps: false,
  });

  return GenerasiProcessor;
};
