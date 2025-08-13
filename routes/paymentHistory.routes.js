const express = require("express");

const paymentHistoryRoute = express.Router();

const authenticateToken = require("../middlewares/auth");
const PaymentHistory = require("../controllers/paymentHistory.controller");

paymentHistoryRoute.post(
  "/addDeposit",
  authenticateToken,
  PaymentHistory.addDepositHistory
);

paymentHistoryRoute.post(
  "/addWithdraw",
  authenticateToken,
  PaymentHistory.addWithdrawHistory
);

paymentHistoryRoute.get(
  "/getTransactionsByUser",
  authenticateToken,
  PaymentHistory.getTransactionsByUser
);

module.exports = paymentHistoryRoute;
