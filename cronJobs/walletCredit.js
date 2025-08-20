// cronJobs/walletCredit.js
// import cron from "node-cron";
// const cron = require("node-cron");
const { default: nodeCron } = require("node-cron");
const User = require("../models/user.model");
// import mongoose from "mongoose";

// mongoose.connect("mongodb://127.0.0.1:27017/walletDB");

function isWeekend(date) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  //   console.log("data", day)
  return day === 0 || day === 6;
}

nodeCron.schedule("0 0 * * *", async () => {
  const today = new Date();

  if (isWeekend(today)) {
    console.log("Weekend hai, skip ho gaya");
    return;
  }

  try {
    const allUsers = await User.find({});

    for (const user of allUsers) {
      const maxLimit = user.walletDeposit * 5;

      if (user.walletEarn >= maxLimit) {
        console.log(`${user.username} ka limit reach ho gaya`);
        continue; // skip credit
      }

      const interest = user.walletDeposit * (0.25 / 100);
      let amountToAdd = interest;

      if (user.walletSelfEarn + interest > maxLimit) {
        amountToAdd = maxLimit - user.walletSelfEarn;
      }

      user.walletSelfEarn += amountToAdd;
      user.lastCreditedDate = today;

      await user.save();

      console.log(`Added ${amountToAdd} to ${user.username}`);
    }
  } catch (err) {
    console.error("Error in cron job:", err);
  }
});
