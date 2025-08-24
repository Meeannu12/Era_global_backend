// models/Commission.js
// import mongoose from "mongoose";

const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // referrer (receiver)
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // required: true,
    }, // referral (source)
    text: String,
    level: { type: Number, required: true }, // 1..10
    amount: { type: Number, required: true },
    date: { type: Date, default: new Date() }, // the “earning day”
  },
  { timestamps: true }
);

// Idempotency: prevent duplicate payout for same day/source/level
// commissionSchema.index(
//   { userId: 1, fromUserId: 1, level: 1, date: 1 },
//   { unique: true }
// );

module.exports = mongoose.model("Commission", commissionSchema);
