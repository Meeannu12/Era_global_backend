const mongoose = require("mongoose");

const RewardSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
      unique: true,
    },
    userIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // <-- User collection ka reference
      },
    ],
  },
  { timestamps: true }
);

const Reward = mongoose.model("Reward", RewardSchema);

module.exports = Reward;
