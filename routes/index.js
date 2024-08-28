const express = require("express");
const router = express.Router();
const AuthController = require("../app/controllers/AuthController");

router.post("/getToken", AuthController.getTenentToken);

module.exports = router;
