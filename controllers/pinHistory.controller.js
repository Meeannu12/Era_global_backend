const PinHistory = require("../models/pinHistory.model");
const User = require("../models/user.model");

const getPinHistory = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    console.log("limit", limit, page);
    const parseLimit = parseInt(limit);
    const skip = (page - 1) * parseLimit;

    const user = await User.findOne({ userID: req.userId });
    const pinHistory = await PinHistory.find({
      $or: [{ fromUserID: user._id }, { toUserID: user._id }],
    })
      .limit(parseLimit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .populate("fromUserID", "username phone")
      .populate("toUserID", "username phone");

    console.log("pinHistory", pinHistory);
    return res.status(200).json({
      success: true,
      message: "Get Pin History Successfully",
      data: pinHistory,
    });
  } catch (error) {
    console.error("Get Pin History error:", error);
    return res.status(500).json({
      success: false,
      message: "Get Pin History failed",
      error: error.message,
    });
  }
};

module.exports = { getPinHistory };
