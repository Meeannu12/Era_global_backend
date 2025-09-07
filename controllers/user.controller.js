const CommissionModel = require("../models/commission.model");
const User = require("../models/user.model");
const { getTeamIncome } = require("../services/cron.service");
const { calculateReward } = require("../services/rewardCommission.service");
const {
  getReferralTree,
  getReferralCountByEachLevel,
} = require("../services/user.service");

const rewardLevel = [
  { d_Income: 300, level: 1, t_Income: 300, reward: 0 },
  { d_Income: 350, level: 2, t_Income: 700, reward: 50 },
  { d_Income: 500, level: 3, t_Income: 2000, reward: 100 },
  { d_Income: 600, level: 4, t_Income: 700, reward: 600 },
  { d_Income: 1000, level: 5, t_Income: 22000, reward: 1100 },
  { d_Income: 2000, level: 6, t_Income: 55000, reward: 3300 },
  { d_Income: 3000, level: 7, t_Income: 110000, reward: 10000 },
  { d_Income: 4000, level: 8, t_Income: 500000, reward: 25000 },
  { d_Income: 7000, level: 9, t_Income: 1500000, reward: 250000 },
  { d_Income: 15000, level: 10, t_Income: 5000000, reward: 1100000 },
];

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

const getTeamIncomFindByUser = async (req, res) => {
  const sponsorID = req.params.sponsorID;
  try {
    const user = await User.findOne({ sponsorID });
    const directRefs = await User.find({ referredBy: user.sponsorID }); // cick first user
    // direct income = apna deposit + direct refs ka deposit
    const directIncome =
      user.walletDeposit +
      directRefs.reduce((sum, ref) => sum + ref.walletDeposit, 0);

    // team income (level 2 se 10 tak)
    let teamIncome = 0;
    for (const ref of directRefs) {
      teamIncome += await getTeamIncome(ref.sponsorID, 2, 10); // 2 se start because 1 = direct
    }

    // Reward check
    const reward = await calculateReward(
      { directIncome, teamIncome },
      rewardLevel,
      user._id
    );

    user.walletReward += reward;
    user.walletEarning += reward;
    await user.save();

    if (reward > 0) {
      const addRewardCommission = new CommissionModel({
        userId: user._id, // referrer (receiver)
        fromUserId: null,
        level: 0, // 1..10
        text: "Reward",
        amount: reward,
        date: new Date(), // the “earning day”
      });
      await addRewardCommission.save();
    }

    res.status(201).json({
      success: true,
      message: "get user Team Income",
      directIncome,
      teamIncome,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "faild to get user Team Income",
      error: error.message,
    });
  }
};

const addTaskClaim = async (req, res) => {
  const userID = req.userId;
  const { setClaimTime, walletClaim } = req.body;

  try {
    const newUser = await User.findOne({ userID });

    const now = Date.now();
    // 24 hours in milliseconds
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - newUser.setClaimTime < twentyFourHours) {
      return res
        .status(400)
        .json({ success: false, message: "You already Claim your Task" });
    }

    newUser.setClaimTime = setClaimTime;
    newUser.walletClaim += walletClaim;

    await newUser.save();
    res
      .status(201)
      .json({ success: true, message: "User Task Claimed successful" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "faild to Put Claim bonus",
      error: error.message,
    });
  }
};

module.exports = {
  getUser,
  getUsersBySponsorID,
  getReferralCountByLevel,
  getAllUserSponsorBySponsorID,
  editUserProfile,
  changePassword,
  forgetPassword,
  addWalletAddress,
  getTeamIncomFindByUser,
  addTaskClaim,
};
