const mongoose = require("mongoose");

const royaltyHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  month: { type: String, required: true }, // "YYYY-MM"
  directIncome: { type: Number, default: 0 },
  levelIncome: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },

  previousRoyalty: { type: Number, default: 0 }, // pichla milestone reward
  newRoyalty: { type: Number, default: 0 }, // abhi achieve hua
  creditedAmount: { type: Number, default: 0 }, // difference jo wallet me gaya

  type: {
    type: String,
    enum: ["new", "upgrade"],
    default: "new"
  }, // new month entry ya upgrade in same month

  levelAchieved: { type: Number, default: 0 }, // (optional) which MLM level reached
}, { timestamps: true });


const RoyaltyHistory = mongoose.model("RoyaltyHistory", royaltyHistorySchema);

module.exports = RoyaltyHistory;
