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

paymentHistoryRoute.get(
  "/getWithdrawalTransaction",
  authenticateToken,
  PaymentHistory.getWithdrawal
);
paymentHistoryRoute.get(
  "/getDepositTransaction",
  authenticateToken,
  PaymentHistory.getDeposit
);

paymentHistoryRoute.post(
  "/updatePaymentStatus/:id",
  authenticateToken,
  PaymentHistory.updatePaymentStatus
);

paymentHistoryRoute.get(
  "/getDepositHistorybyUser/:sponsorID",
  authenticateToken,
  PaymentHistory.getDepositHistorybyUser
);

paymentHistoryRoute.get(
  "/getWithdrawalHistorybyUser/:sponsorID",
  authenticateToken,
  PaymentHistory.getWithdrawalHistorybyUser
);

paymentHistoryRoute.get(
  "/getCommissionHistoryToDay/:sponsorID",
  authenticateToken,
  PaymentHistory.getCommissionHistoryToDay
);
module.exports = paymentHistoryRoute;
