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

module.exports = Royalty;
