const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const ClientSecrete = require("./Oauth_clients");

const Entrypoint = sequelize.define(
  "entrypoints",
  { tenant_id: DataTypes.INTEGER, url: DataTypes.STRING },
  {
    tableName: "tbl_entrypoints",
    timestamps: false,
  }
);

Entrypoint.belongsTo(ClientSecrete, {
  foreignKey: "tenant_id",
  targetKey: "user_id",
});

module.exports = Entrypoint;
