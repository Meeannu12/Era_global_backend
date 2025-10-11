const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userID: String,
    sponsorID: String,
    mode: {
      type: String,
      enum: ["Deposit", "Withdraw"], // ✅ only these two values allowed
      required: true,
    },
    transaction: String,
    senderWallet: {
      type: String,
    },
    // senderName: {
    //   type: String,
    // },
    receiveWallet: {
      type: String,
    },
    // receiveName: {
    //   type: String,
    // },
    previousRoyaltyID: {
      type: String
    },
    amount: {
      type: String,
    },
    walletType: { type: String, enum: ["royaltyWallet", "selfWallet"] },
    verficationStatus: {
      type: String,
      enum: ["Unverified", "Verified", "Rejected"], // ✅ only these three values allowed
      default: "Unverified",
    },
    recordStatus: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentHistory", paymentHistorySchema);
