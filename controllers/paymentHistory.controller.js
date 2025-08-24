const { findById } = require("../models/level.model");
const PaymentHistoryModel = require("../models/paymentHistory.model");
const Pin = require("../models/pin.model");
const User = require("../models/user.model");

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
  const { senderWallet, amount, receiveWallet, sponsorID } = req.body;
  //   console.log("addDepositHistory", senderWallet, amount, receiveWallet);
  try {
    const user = await User.findOne({ userID });

    const addWithdraw = new PaymentHistoryModel({
      user: user._id,
      userID: user.userID,
      mode: "Withdraw",
      sponsorID,
      senderWallet,
      receiveWallet,
      amount,
    });
    await addWithdraw.save();

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
const ALLOWED_STATUSES = ["Unverified", "Verified", "Rejected"];
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
        const updatedUser = await User.findOneAndUpdate(
          {
            sponsorID: updatePayment.sponsorID,
            walletTeamEarn: { $gte: updatePayment.amount },
          },
          { $inc: { walletTeamEarn: -updatePayment.amount } },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(422).json({
            success: false,
            message:
              "Insufficient balance in walletTeamEarn or user not found.",
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

    // ✅ 3. Check if payment exists
    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      success: true,
      message: "Status updated successfully",
      payment: updatedPayment,
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

module.exports = {
  addDepositHistory,
  addWithdrawHistory,
  getTransactionsByUser,
  getWithdrawal,
  getDeposit,
  updatePaymentStatus,
};
