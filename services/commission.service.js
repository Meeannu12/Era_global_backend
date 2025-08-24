const Commission = require("../models/commission.model");
const Level = require("../models/level.model");
const User = require("../models/user.model");

const levels = [100, 0.5, 0.7, 1, 1.5, 1.75, 2, 2.25, 2.5, 3]; // Level percent
let commissionRecords = []; // temporary storage

// Recursive function
async function distributeCommission(userID, level = 1, maxLevel = 10) {
  if (level > maxLevel) return;

  const referrals = await User.find({ referredBy: userID.sponsorID });

  for (const ref of referrals) {
    if (ref.walletDeposit >= 20) {
      const baseCommission = (ref.walletDeposit * 0.25) / 100;
      const levelPercent = levels[level - 1] || 0;
      const income = (baseCommission * levelPercent) / 100;

      commissionRecords.push({
        userId: userID._id,
        fromUserId: ref._id,
        level: level,
        amount: income,
      });
    }

    await distributeCommission(ref, level + 1, maxLevel);
  }
}

// Save all commission records in DB at once
async function saveAllIncomes() {
  if (commissionRecords.length > 0) {
    // console.log("commission log's", commissionRecords);
    await Commission.insertMany(commissionRecords);

    // Reduce to user-wise total
    const userTotals = Object.values(
      commissionRecords.reduce((acc, curr) => {
        if (!acc[curr.userId])
          acc[curr.userId] = { userId: curr.userId, amount: 0 };
        acc[curr.userId].amount += curr.amount;
        return acc;
      }, {})
    );

    for (const record of userTotals) {
      await User.findByIdAndUpdate(
        record.userId,
        { $inc: { walletTeamEarn: record.amount } },
        { new: true } // upsert optional, agar user exist nahi to create
      );
    }
    // console.log("total User",userTotals);

    commissionRecords = []; // reset
  }
}

// Example main function
async function levelTeamIncome() {
  const now = new Date();

  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours(); // 0-23

  // Check: run only Monday-Friday at 1 AM
  if (day === 0) {
    console.log("Today is Sunday, function will not run.");
    return;
  }
  if (day === 6) {
    console.log("Today is Saturday, function will not run.");
    return;
  }
  if (hour !== 1) {
    console.log("It is not 1 AM yet, function will not run.");
    return;
  }
  // Start commission calculation for all users (or a specific user)
  const users = await User.find(); // all users
  for (const user of users) {
    await distributeCommission(user);
  }

  await saveAllIncomes();

  console.log("Commission calculation finished!");
}

module.exports = {
  levelTeamIncome,
};
