const PaymentHistoryModel = require("../models/paymentHistory.model");
const User = require("../models/user.model");

const addDepositHistory = async (req, res) => {
  const userID = req.userId;
  const { senderWallet, amount, receiveWallet } = req.body;
  //   console.log("addDepositHistory", senderWallet, amount, receiveWallet);
  try {
    const user = await User.findOne({ userID });

    const addDeposit = new PaymentHistoryModel({
      user: user._id,
      userID: user.userID,
      mode: "Deposit",
      senderWallet,
      receiveWallet,
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
  const { senderWallet, amount, receiveWallet } = req.body;
  //   console.log("addDepositHistory", senderWallet, amount, receiveWallet);
  try {
    const user = await User.findOne({ userID });

    const addWithdraw = new PaymentHistoryModel({
      user: user._id,
      userID: user.userID,
      mode: "Withdraw",
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

module.exports = {
  addDepositHistory,
  addWithdrawHistory,
  getTransactionsByUser,
};
