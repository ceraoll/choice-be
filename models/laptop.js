'use strict';
module.exports = (sequelize, DataTypes) => {
  const Laptop = sequelize.define('Laptop', {
    id_laptop: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nama_laptop: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    harga: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    berat: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    kapasitas_rom: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kapasitas_ram: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kecepatan_ram: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resolusi: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipe_processor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    generasi_processor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'laptop',
    timestamps: false,
  });

  return Laptop;
};
