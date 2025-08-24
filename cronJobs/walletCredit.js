// cronJobs/walletCredit.js
// import cron from "node-cron";
// const cron = require("node-cron");
const { default: nodeCron } = require("node-cron");
const User = require("../models/user.model");
const commissionModel = require("../models/commission.model");
// import mongoose from "mongoose";

// mongoose.connect("mongodb://127.0.0.1:27017/walletDB");

function isWeekend(date) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  //   console.log("data", day)
  return day === 0 || day === 6;
}

async function selfEarning() {
  const today = new Date();

  if (isWeekend(today)) {
    console.log("Weekend hai, skip ho gaya");
    return;
  }

  try {
    const allUsers = await User.find({});
    const bulkUserOps = [];
    const bulkCommissionOps = [];

    for (const user of allUsers) {
      const maxLimit = user.walletDeposit * 5;

      if (user.walletSelfEarn >= maxLimit) {
        // console.log(`${user.username} ka limit reach ho gaya`);
        continue; // skip credit
      }

      const interest = user.walletDeposit * (0.25 / 100);
      let amountToAdd = interest;

      if (user.walletSelfEarn + interest > maxLimit) {
        amountToAdd = maxLimit - user.walletSelfEarn;
      }

      // user.walletSelfEarn += amountToAdd;
      // user.lastCreditedDate = today;

      // if (amountToAdd > 0) {
      //   await commissionModel.create({
      //     userId: user._id,
      //     amount: amountToAdd,
      //     level: 0,
      //     date: today,
      //   });
      // }

      // await user.save();

      if (amountToAdd > 0) {
        bulkCommissionOps.push({
          insertOne: {
            document: {
              userId: user._id,
              amount: amountToAdd,
              level: 0,
              date: today,
            },
          },
        });

        bulkUserOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $inc: { walletSelfEarn: amountToAdd },
              $set: { lastCreditedDate: today },
            },
          },
        });
      }

      if (bulkUserOps.length > 0) {
        await User.bulkWrite(bulkUserOps);
      }
      if (bulkCommissionOps.length > 0) {
        await commissionModel.bulkWrite(bulkCommissionOps);
      }

      console.log(`Added ${amountToAdd} to ${user.username}`);
    }
  } catch (err) {
    console.error("Error in cron job:", err);
  }
}

module.exports = selfEarning;
