const path = require("path");
const env = require("dotenv");
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { connectRedis } = require("./config/redisClient");
const routes = require("./routes");
const sequelize = require("./config/database");

const app = express();
app.use(cors());
app.use(express.json());
env.config();
app.use(express.static(path.join(__dirname, "public")));
app.use(routes);

sequelize
  .sync()
  .then(() => {
    connectRedis()
      .then(() => {
        console.log("Connected to Redis");

        // Start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
      })
      .catch(console.error);
  })
  .catch((err) => {
    console.log(err);
  });
