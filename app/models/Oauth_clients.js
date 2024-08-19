const { Sequelize, DataTypes } = require("sequelize");

const sequelize = require("../../config/database");

const ClientSecrete = sequelize.define(
  "clientSecrete",
  {
    client_id: DataTypes.STRING,
    client_secret: DataTypes.STRING,
    user_id: { type: DataTypes.STRING, primaryKey: true },
  },
  {
    tableName: "oauth_clients",
    timestamps: false,
  }
);

module.exports = ClientSecrete;
