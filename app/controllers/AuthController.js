const { client } = require("../../config/redisClient");
const sequelize = require("../../config/database");
const axios = require("axios");
const moment = require("moment");

exports.getTenentToken = async (req, res, next) => {
  try {
    const { hostname } = req.body;
    if (!hostname) {
      return res.status(400).json({ error: "hostname are required" });
    }
    const storedData = await client.get(hostname);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const tokenExpiry = new Date(parsedData.tokenExpiry);
      const currentTime = new Date();
      if (currentTime < tokenExpiry) {
        return res
          .status(200)
          .json({ status: true, message: "Access_Token", data: parsedData });
      }
    }
    const result = await sequelize.query(
      `SELECT e.*, oc.*
       FROM tbl_entrypoints e
       JOIN oauth_clients oc
       ON CAST(e.tenant_id AS CHAR) COLLATE utf8mb4_general_ci = oc.user_id COLLATE utf8mb4_general_ci
       WHERE e.URL = :url`,
      {
        replacements: { url: `https://${hostname}/` },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (result.length > 0) {
      const req = await axios.post(
        "https://api.bunidiner.com/api/v1/Auth/token",
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "client-id": result[0].client_id,
            "client-secret": result[0].client_secret,
          },
        }
      );
      const data = await req.data;
      const tokenExpiry = moment().add(data.expires_in, "seconds");
      const redisData = {
        hostname,
        token: data.access_token,
        tokenExpiry: new Date(tokenExpiry),
      };
      await client.set(hostname, JSON.stringify(redisData));
      return res
        .status(200)
        .json({ staus: true, message: "Access_Token", data });
    } else {
      console.log("No record found with the provided URL.");
      return res.status(400).json({
        staus: false,
        message: "No record found with the provided URL.",
      });
    }
  } catch (error) {
    console.error("Error checking or adding IP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
