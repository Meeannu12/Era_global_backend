const User = require("../models/user.model");
const {
  getReferralTree,
  getReferralCountByEachLevel,
} = require("../services/user.service");

const editUserProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userID = req.userId;

    const user = await User.findOne({ userID: userID });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email) {
      const existingUser = await User.findOne({ email: email });
      if (user.email !== email && existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { userID: userID },
      {
        username: username || user.username,
        email: email || user.email,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Update User Information Successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Update user failed",
      error: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userID = req.userId;

    const user = await User.findOne({ userID: userID });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Change Password Successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Change password failed",
      error: error.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { sponsorID, password, phone } = req.body;

    const user = await User.findOne({
      $and: [{ sponsorID: sponsorID }, { phone: phone }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Change Password Successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Change password failed",
      error: error.message,
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get User Information Successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Get user failed",
      error: error.message,
    });
  }
};

const getUsersBySponsorID = async (req, res) => {
  try {
    const sponsorID = req.params.sponsorID;
    const usersDirectly = await User.find({ referredBy: sponsorID });
    const { totalReferred, users } = await getReferralTree(sponsorID);

    return res.status(200).json({
      success: true,
      message: "Get User Information Successfully",
      data: {
        // users: users,
        countUserDirectly: usersDirectly.length,
        countUserIndirectly: totalReferred,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Get user failed",
      error: error.message,
    });
  }
};

// add wallet address using this api
const addWalletAddress = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    // const user = await User.findOne({ userID: req.userId });
    // console.log("addWalletAddress", walletAddress, user);
    const updateUser = await User.findOneAndUpdate(
      { userID: req.userId },
      { $set: { walletAddress } },
      { new: true }
    );
    res.status(201).json({
      success: true,
      message: "user Wallet Address Update",
      user: updateUser,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Get user failed",
      error: error.message,
    });
  }
};

async function getReferralCountByLevel(req, res) {
  try {
    const sponsorID = req.params.sponsorID;
    const levelCount = await getReferralCountByEachLevel(sponsorID);
    return res.status(200).json({
      success: true,
      message: "Get User Information Successfully",
      data: levelCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Get user failed",
      error: error.message,
    });
  }
}

async function getAllUserSponsorBySponsorID(req, res) {
  try {
    const sponsorID = req.params.sponsorID;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ referredBy: sponsorID })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments({ referredBy: sponsorID });

    return res.status(200).json({
      success: true,
      message: "Get User Information Successfully",
      data: {
        users: users,
        count: count,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          limit: limit,
        },
      },
    });
  } catch (error) {
    console.error("Get all user sponsor by sponsor ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Get all user sponsor by sponsor ID failed",
      error: error.message,
    });
  }
}

module.exports = {
  getUser,
  getUsersBySponsorID,
  getReferralCountByLevel,
  getAllUserSponsorBySponsorID,
  editUserProfile,
  changePassword,
  forgetPassword,
  addWalletAddress,
};
