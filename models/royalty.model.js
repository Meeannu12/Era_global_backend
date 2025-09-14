const mongoose = require("mongoose");

const RoyaltySchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
      unique: true,
    },
    userRoyalty: [
      {
        userIds: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // <-- User collection ka reference
        },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Royalty = mongoose.model("Royalty", RoyaltySchema);

const RoyaltyAmountStatusSchema = new mongoose.Schema(
  {
    userIds: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // <-- User collection ka reference
    },
    status: {
      type: String,
      default: "unpaid",
    },
    amount: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 0,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RoyaltyAmountStatus = mongoose.model(
  "RoyaltyAmountStatus",
  RoyaltyAmountStatusSchema
);

module.exports = { Royalty, RoyaltyAmountStatus };
