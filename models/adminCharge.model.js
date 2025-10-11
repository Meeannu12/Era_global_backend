const { Schema, default: mongoose } = require("mongoose");

const AdminChargeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sponsorID: String,
    withdrawAmount: Number,
    adminCharge: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminCharge", AdminChargeSchema);
