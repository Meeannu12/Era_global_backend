const express = require("express");
const router = express.Router();

const userRouter = require("./user.routes");
const pinRouter = require("./pin.routes");
const authRouter = require("./auth.routes");
const pinHistoryRouter = require("./pinHistory.routes");

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/pins", pinRouter);
router.use("/pins-history", pinHistoryRouter);

module.exports = router;
