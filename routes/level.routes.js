const express = require("express");
const levelRoute = express.Router();

const authenticateToken = require("../middlewares/auth");
const LevelController = require("../controllers/level.controller");

levelRoute.post("/createLevel", LevelController.createLevel);

module.exports = levelRoute;
