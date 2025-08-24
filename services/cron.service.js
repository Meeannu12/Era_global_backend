// services/cron.service.js
const cron = require("node-cron");
const { runDailyDistribution } = require("./commission.service");
// import cron from "node-cron";
const CommissionModel = require("../models/commission.model");
const User = require("../models/user.model");
// import User from "./models/User"; // mongoose model

// helper function - recursive
async function getTeamIncome(userId, level, maxLevel) {
  if (level > maxLevel) return 0;

  const referrals = await User.find({ referredBy: userId });
  let total = 0;

  for (const ref of referrals) {
    total += ref.walletDeposit; // unka deposit
    total += await getTeamIncome(ref._id, level + 1, maxLevel); // unke niche
  }

  return total;
}

// Ye function ek user ke liye royalty decide karega
function calculateRoyalty(user, levels) {
  let lastRoyalty = 0;

  for (const lvl of levels) {
    if (user.directIncome >= lvl.d_Income && user.teamIncome >= lvl.t_Income) {
      // condition pass ho gayi → agle level tak jao
      lastRoyalty = lvl.royalty;
    } else {
      // condition fail → yahin ruk jao
      break;
    }
  }

  return lastRoyalty;
}

// main calculation for all users
async function calculateIncomes() {
  const users = await User.find(); // saare users

  for (const user of users) {
    // direct income (sirf level 1 users ka deposit)
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

    const level = [
      { d_Income: 300, t_Income: 300, royalty: 10 },
      { d_Income: 350, t_Income: 700, royalty: 50 },
      { d_Income: 500, t_Income: 2000, royalty: 100 },
      { d_Income: 600, t_Income: 700, royalty: 300 },
      { d_Income: 1000, t_Income: 22000, royalty: 600 },
      { d_Income: 2000, t_Income: 55000, royalty: 1100 },
      { d_Income: 3000, t_Income: 110000, royalty: 2500 },
      { d_Income: 4000, t_Income: 500000, royalty: 4000 },
      { d_Income: 7000, t_Income: 1500000, royalty: 11000 },
      { d_Income: 15000, t_Income: 5000000, royalty: 21000 },
    ];

    // Royalty check
    const royalty = calculateRoyalty({ directIncome, teamIncome }, level);

    user.walletRoyalty += royalty;
    await user.save();

    const addRoyaltyCommission = new CommissionModel({
      userId: user._id, // referrer (receiver)
      fromUserId: null,
      level: 0, // 1..10
      text: "Royalty",
      amount: royalty,
      date: new Date(), // the “earning day”
    });

    await addRoyaltyCommission.save();

    // console.log(`User: ${user.userName}`);
    // console.log(`Direct Income: ${directIncome}`);
    // console.log(`Team Income: ${teamIncome}`);
    // console.log("---------------------------");
  }
}

// Royalty calculate karne wala function
async function calculateRoyaltyForAllUsers() {
  console.log("Royalty calculation started:", new Date());

  // yaha tu apna pura directIncome/teamIncome + royalty wala logic call karega
  await calculateIncomes();

  console.log("Royalty calculation finished:", new Date());
}

function startRoyaltyCron() {
  console.log("royalty cron job run");
  // Cron job schedule
  // "0 6 1 * *" => har month ke 1st din, subah 6:00 AM
  cron.schedule("0 6 1 * *", () => {
    calculateRoyaltyForAllUsers();
  });
}

function startCron() {
  // Every weekday at 01:00
  cron.schedule("0 1 * * 1-5", async () => {
    try {
      console.log("⏰ Running daily commission distribution...");
      const res = await runDailyDistribution(new Date());
      console.log("✅ Commission job result:", res);
    } catch (e) {
      console.error("❌ Commission job error:", e.message);
    }
  });
  console.log("✅ Cron scheduled: 01:00 Mon–Fri");
}

module.exports = { startCron, startRoyaltyCron };
