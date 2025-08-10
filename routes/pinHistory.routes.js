const express = require("express");
const router = express.Router();
const pinHistoryController = require("../controllers/pinHistory.controller");
const authenticateToken = require("../middlewares/auth");

router.get("/", authenticateToken, pinHistoryController.getPinHistory);

module.exports = router;
