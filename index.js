const path = require("path");
// load dependencies
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

// Export the Redis client to be used in other modules

env.config();
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// required for csurf
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
    // store: new SequelizeStore({
    // 	db: sequelize,
    // 	table: "sessions",
    // }),
  })
);

// app.use(csrfProtection);
// app.use(flash());

// app.use((req, res, next) => {
// 	res.locals.isAuthenticated = req.session.isLoggedIn;
// 	res.locals.csrfToken = req.csrfToken();
// 	next();
// });

// app.engine(
// 	'hbs',
// 	expressHbs({
// 		layoutsDir: 'views/layouts/',
// 		defaultLayout: 'web_layout',
// 		extname: 'hbs'
// 	})
// );
// app.set('view engine', 'hbs');
// app.set('views', 'views');

app.use(routes);
// app.use(errorController.pageNotFound);

sequelize
  //.sync({force : true})
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
// Connect to Redis
