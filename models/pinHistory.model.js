const mongoose = require("mongoose");

const PinHistorySchema = new mongoose.Schema(
  {
    fromUserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pinQuantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PinHistory = mongoose.model("PinHistory", PinHistorySchema);

module.exports = PinHistory;
