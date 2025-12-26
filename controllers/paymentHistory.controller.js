const adminChargeModel = require("../models/adminCharge.model");
const CommissionModel = require("../models/commission.model");
const { findById } = require("../models/level.model");
// const paymentHistoryModel = require("../models/paymentHistory.model");
const PaymentHistoryModel = require("../models/paymentHistory.model");
const Pin = require("../models/pin.model");
const RoyaltyHistory = require("../models/royalty.model");
// const { RoyaltyAmountStatus } = require("../models/royalty.model");
const User = require("../models/user.model");

const moment = require("moment");
// 1. Month ka start & end date
const monthStart = moment().startOf("month").toDate();
const monthEnd = moment().endOf("month").toDate();

const addDepositHistory = async (req, res) => {
  const userID = req.userId;
  const { senderWallet, amount, receiveWallet, sponsorID, transaction } =
    req.body;
  //   console.log("addDepositHistory", senderWallet, amount, receiveWallet);
  try {
    const user = await User.findOne({ userID });

    const addDeposit = new PaymentHistoryModel({
      user: user._id,
      userID: user.userID,
      sponsorID,
      mode: "Deposit",
      senderWallet,
      receiveWallet,
      transaction,
      amount,
    });
    await addDeposit.save();

    // console.log("user Data recived from DB", user);
    res.status(201).json({
      success: true,
      message: "Amount Deposit Request Send",
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Amount Deposit Request Failed",
      error: error.message,
    });
  }
};

const addWithdrawHistory = async (req, res) => {
  const userID = req.userId;
  const { senderWallet, amount, receiveWallet, sponsorID, walletType } =
    req.body;
  //   console.log("addDepositHistory", senderWallet, amount, receiveWallet);
  try {
    const user = await User.findOne({ userID });


    // check wallet type
    if (walletType == "royaltyWallet") {

      const getRoyaltyAmount = await RoyaltyHistory.findById(amount)
      const addWithdraw = new PaymentHistoryModel({
        user: user._id,
        userID: user.userID,
        mode: "Withdraw",
        walletType,
        sponsorID,
        senderWallet,
        receiveWallet,
        previousRoyaltyID: getRoyaltyAmount._id,
        amount: getRoyaltyAmount.creditedAmount,
      });
      await addWithdraw.save();

    } else {
      const addWithdraw = new PaymentHistoryModel({
        user: user._id,
        userID: user.userID,
        mode: "Withdraw",
        walletType,
        sponsorID,
        senderWallet,
        receiveWallet,
        amount,
      });
      await addWithdraw.save();
    }



    // console.log("user Data recived from DB", user);
    res.status(201).json({
      success: true,
      message: "Amount Withdraw Request Send",
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Amount Withdraw Request Failed",
      error: error.message,
    });
  }
};

const getTransactionsByUser = async (req, res) => {
  const userID = req.userId;
  try {
    const paymentHistory = await PaymentHistoryModel.find({ userID });
    // .sort({
    //   createdAt: -1,
    // });
    res.status(200).json({
      success: true,
      message: "Amount Withdraw Request Send",
      data: paymentHistory ? paymentHistory : [],
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "failed Get Transactions",
      error: error.message,
    });
  }
};

const getWithdrawal = async (req, res) => {
  try {
    const allTransaction = await PaymentHistoryModel.find({
      mode: "Withdraw",
      verficationStatus: "Unverified",
    }).populate("user");

    res.status(200).json({
      success: true,
      message: "Get WithDrawal Transaction",
      data: allTransaction ? allTransaction : [],
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "failed to Get Withdrawal Transactions",
      error: error.message,
    });
  }
};

const getDeposit = async (req, res) => {
  try {
    const allTransaction = await PaymentHistoryModel.find({
      mode: "Deposit",
      verficationStatus: "Unverified",
    }).populate("user");

    res.status(200).json({
      success: true,
      message: "Get Deposit Transaction",
      data: allTransaction ? allTransaction : [],
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "failed to Get Deposit Transactions",
      error: error.message,
    });
  }
};

// Allowed statuses
const ALLOWED_STATUSES = ["Verified", "Rejected"];

const updatePaymentStatus = async (req, res) => {
  const { status, method } = req.body;
  const { id } = req.params;
  //   console.log(status, id);
  try {
    // ✅ 1. Check status is valid
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const updatePayment = await PaymentHistoryModel.findById(id);
    if (!updatePayment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment Status Not Found" });
    }

    if (status === "Verified") {
      if (method.toLowerCase() === "deposit") {
        const getPin = await Pin.findOne({ used: false });
        await User.findOneAndUpdate(
          { sponsorID: updatePayment.sponsorID },
          {
            $inc: { walletDeposit: updatePayment.amount },
            $set: { pin: getPin.pin, isActive: true },
          },
          { new: true }
        );
        getPin.used = true;
        getPin.save();
      }
      if (method.toLowerCase() === "withdraw") {
        // const amountToDeduct =
        //   updatePayment.amount - updatePayment.amount * 0.1; // 10% extra cut
        const amount = Number(updatePayment.amount)
        if (updatePayment.walletType === "royaltyWallet") {
          await RoyaltyHistory.findByIdAndUpdate(updatePayment.previousRoyaltyID, { $set: { status: "paid" } })

          const updatedUser = await User.findOneAndUpdate(
            {
              sponsorID: updatePayment.sponsorID,
              walletEarning: { $gte: amount },
            },
            { $inc: { walletEarning: -amount } },
            { new: true }
          );

          if (!updatedUser) {
            return res.status(422).json({
              success: false,
              message:
                "Insufficient balance in walletTeamEarn or user not found.",
            });
          }

          await adminChargeModel.create({
            userId: updatedUser._id,
            sponsorID: updatedUser.sponsorID,
            withdrawAmount: updatePayment.amount,
            adminCharge: updatePayment.amount * 0.1,
          });
        } else {
          const updatedUser = await User.findOneAndUpdate(
            {
              sponsorID: updatePayment.sponsorID,
              walletEarning: { $gte: amount },
            },
            { $inc: { walletEarning: - amount } },
            { new: true }
          );

          if (!updatedUser) {
            return res.status(422).json({
              success: false,
              message:
                "Insufficient balance in walletTeamEarn or user not found.",
            });
          }

          await adminChargeModel.create({
            userId: updatedUser._id,
            sponsorID: updatedUser.sponsorID,
            withdrawAmount: updatePayment.amount,
            adminCharge: updatePayment.amount * 0.1,
          });
        }
      }
    }


    // ✅ 2. Update document
    const updatedPayment = await PaymentHistoryModel.findByIdAndUpdate(
      id,
      { verficationStatus: status },
      { new: true } // return updated doc
    );

    // ✅ 3. Check if payment not exists
    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      // payment: updatedPayment,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment status update faild",
      error: error.message,
    });
  }
};

const getDepositHistorybyUser = async (req, res) => {
  try {
    const sponsorID = req.params.sponsorID;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const DepositPayment = await PaymentHistoryModel.find({
      sponsorID,
      mode: "Deposit",
    })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const count = await PaymentHistoryModel.countDocuments({
      sponsorID,
      mode: "Deposit",
    });

    return res.status(200).json({
      success: true,
      message: "Get User Deposit Information Successfully",
      data: {
        payment: DepositPayment,
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
      message: "Get all Deposit Payment by sponsor ID failed",
      error: error.message,
    });
  }
};

const getWithdrawalHistorybyUser = async (req, res) => {
  try {
    const sponsorID = req.params.sponsorID;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const WithdrawPayment = await PaymentHistoryModel.find({
      sponsorID,
      mode: "Withdraw",
    })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const count = await PaymentHistoryModel.countDocuments({
      sponsorID,
      mode: "Withdraw",
    });

    return res.status(200).json({
      success: true,
      message: "Get User Deposit Information Successfully",
      data: {
        payment: WithdrawPayment,
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
      message: "Get all Deposit Payment by sponsor ID failed",
      error: error.message,
    });
  }
};

// get user all commission today only
const getCommissionHistoryToDay = async (req, res) => {
  try {
    const sponsorID = req.params.sponsorID;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ sponsorID });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // 00:00:00

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999); // 23:59:59

    const userCommission = await CommissionModel.find({
      userId: user._id,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    })
      .populate("fromUserId")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    // const count = await CommissionModel.countDocuments({
    //   userId: user._id,
    //   createdAt: { $gte: startOfToday, $lte: endOfToday },
    // });

    return res.status(200).json({
      success: true,
      message: "Get User All Commission Information Successfully",
      data: {
        payment: userCommission,
        count: userCommission.length,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(userCommission.length / limit),
          limit: limit,
        },
      },
    });
  } catch (error) {
    console.error("Get all user sponsor by sponsor ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Get all Deposit Payment by sponsor ID failed",
      error: error.message,
    });
  }
};

const getWalletDetails = async (req, res) => {
  const userID = req.userId;
  try {
    const user = await User.findOne({ userID });

    const currentMonth = moment().format("YYYY-MM");
    const getUnpaidRoyalty = await RoyaltyHistory.find({ month: { $ne: currentMonth }, userId: user._id, status: "unpaid" }, { creditedAmount: 1, month: 1 });


    const withDrawal = await PaymentHistoryModel.find({
      user: user._id,
      mode: "Withdraw",
      verficationStatus: "Verified",
    });

    const totalWithDrawal = withDrawal.reduce((sum, item) => {
      return sum + (parseInt(item.amount) || 0);
    }, 0);


    res.status(201).json({
      success: true,
      message: "user Amount get Sections",
      totalWithDrawal,
      getUnpaidRoyalty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "faild to get Royalty Entry",
      error: error.message,
    });
  }
};

module.exports = {
  addDepositHistory,
  addWithdrawHistory,
  getTransactionsByUser,
  getWithdrawal,
  getDeposit,
  updatePaymentStatus,
  getDepositHistorybyUser,
  getWithdrawalHistorybyUser,
  getCommissionHistoryToDay,
  getWalletDetails,
};
