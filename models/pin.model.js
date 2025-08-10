const mongoose = require("mongoose");

const pinSchema = new mongoose.Schema(
  {
    assignedTo: {
      type: String,
      default: null,
    },
    pin: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Pin = mongoose.model("Pin", pinSchema);

module.exports = Pin;
