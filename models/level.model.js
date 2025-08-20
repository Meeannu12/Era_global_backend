const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema({
  level: {
    type: Number, // e.g. 1, 2, 3 ... 10
    required: true,
    unique: true
  },
  commission: {
    type: Number, // percentage (%) ya fixed amount
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Level", levelSchema);
