const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const User = require("../models/User");
const Session = require("../models/Session");
// const client = require("../../index");
const { client } = require("../../config/redisClient"); // Import the Redis client
const Entrypoint = require("../models/Entrypoints");
const ClientSecrete = require("../models/Oauth_clients");
const sequelize = require("../../config/database");
const axios = require("axios");
const moment = require("moment");

// const message = (req) => {
// 	let message = req.flash('error');
// 	if (message.length > 0) {
// 		message = message[0];
// 	} else {
// 		message = null;
// 	}

// 	return message;
// }

// const oldInput = (req) => {
// 	let oldInput = req.flash('oldInput');
// 	if (oldInput.length > 0) {
// 		oldInput = oldInput[0];
// 	} else {
// 		oldInput = null;
// 	}

// 	return oldInput;
// }

// exports.loginPage = (req, res, next) => {
// 	if(res.locals.isAuthenticated){
// 		res.redirect('/');
// 	} else {
// 		res.render('login',{layout: 'login_layout', loginPage: true, pageTitle: 'Login', errorMessage: message(req), oldInput: oldInput(req)});
// 	}
// };

// exports.logout = (req, res, next) => {
// 	if(res.locals.isAuthenticated){
// 		req.session.destroy(err => {
// 			return res.redirect('/');
// 		});
// 	} else {
// 		return res.redirect('/login');
// 	}
// };

// exports.signUpPage = (req, res, next) => {
// 	res.render('sign_up',{layout: 'login_layout', signUpPage: true, errorMessage: message(req), oldInput: oldInput(req)});
// };

// exports.signUp = (req, res, next) => {
// 	User.findOne({
// 		where: {
// 			email: req.body.email
// 		}
// 	}).then(user => {
// 		if(!user) {
// 			return bcrypt
// 					.hash(req.body.password, 12)
// 					.then(hashedPassword => {
// 						const user = new User({
// 							fullName: req.body.name,
// 							email: req.body.email,
// 							password: hashedPassword,
// 						});
// 						return user.save();
// 					})
// 					.then(result => {
// 						return res.redirect('/login');
// 					});
// 		} else {
// 			req.flash('error', 'E-Mail exists already, please pick a different one.');
// 			req.flash('oldInput',{name: req.body.name});
//         	return res.redirect('/sign-up');
// 		}
// 	})
// 	.catch(err => console.log(err));
// };

// exports.forgotPasswordPage = (req, res, next) => {
// 	if(res.locals.isAuthenticated){
// 		return res.redirect('/');
// 	} else {
// 		return res.render('forgot_password',{layout: 'login_layout', loginPage: true, pageTitle: 'Forgot Password', errorMessage: message(req), oldInput: oldInput(req)});
// 	}
// };

// exports.forgotPassword = (req, res, next) => {
// 	const validationErrors = [];
// 	if (!validator.isEmail(req.body.email)) validationErrors.push('Please enter a valid email address.');

// 	if (validationErrors.length) {
// 		req.flash('error', validationErrors);
// 		return res.redirect('/forgot-password');
// 	}
// 	crypto.randomBytes(32, (err, buffer) => {
// 		if (err) {
// 			console.log(err);
// 			return res.redirect('/forgot-password');
// 		}
// 		const token = buffer.toString('hex');
// 		User.findOne({where: {
// 				email: req.body.email
// 				}
// 			})
// 			.then(user => {
// 				if(!user){
// 					req.flash('error', 'No user found with that email');
// 					return res.redirect('/forgot-password');
// 				}
// 				user.resetToken = token;
// 				user.resetTokenExpiry = Date.now() + 3600000;
// 				return user.save();
// 			}).then(result => {
// 				if(result) return res.redirect('/resetlink');
// 			}).catch(err => {console.log(err)})
// 	});
// };

exports.login = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.inputEmail))
    validationErrors.push("Please enter a valid email address.");
  if (validator.isEmpty(req.body.inputPassword))
    validationErrors.push("Password cannot be blank.");
  if (validationErrors.length) {
    req.flash("error", validationErrors);
    return res.redirect("/login");
  }
  User.findOne({
    where: {
      email: req.body.inputEmail,
    },
  })
    .then((user) => {
      if (user) {
        bcrypt
          .compare(req.body.inputPassword, user.password)
          .then((doMatch) => {
            if (doMatch) {
              req.session.isLoggedIn = true;
              req.session.user = user.dataValues;
              return req.session.save((err) => {
                console.log(err);
                res.redirect("/");
              });
            }
            req.flash("error", "Invalid email or password.");
            req.flash("oldInput", { email: req.body.inputEmail });
            return res.redirect("/login");
          })
          .catch((err) => {
            console.log(err);
            req.flash("error", "Sorry! Somethig went wrong.");
            req.flash("oldInput", { email: req.body.inputEmail });
            return res.redirect("/login");
          });
      } else {
        req.flash("error", "No user found with this email");
        req.flash("oldInput", { email: req.body.inputEmail });
        return res.redirect("/login");
      }
    })
    .catch((err) => console.log(err));
};

exports.getTenentToken = async (req, res, next) => {
  try {
    const { hostname = "app" } = req.body;
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
        replacements: { url: "https://oasisbites.bunidiner.com/" },
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

  // return this.respond(req, res, body, "Successs", {});
};
