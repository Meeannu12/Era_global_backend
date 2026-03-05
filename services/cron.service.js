// services/cron.service.js
const cron = require("node-cron");
const { levelTeamIncome } = require("./commission.service");
// import cron from "node-cron";
const User = require("../models/user.model");
const selfEarning = require("../cronJobs/walletCredit");
const { calculateAndCreditRoyalty } = require("./royalty.service");

// helper function - recursive
async function getTeamIncome(userId, level, maxLevel) {
  if (level > maxLevel) return 0;

  const referrals = await User.find({ referredBy: userId });
  let total = 0;

  for (const ref of referrals) {
    total += ref.walletDeposit; // unka deposit
    total += await getTeamIncome(ref.sponsorID, level + 1, maxLevel); // unke niche
  }

  return total;
}

// main calculation for all users
async function calculateRoyaltyIncomes() {
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


    await calculateAndCreditRoyalty(user._id, directIncome, teamIncome)

    // const addRoyaltyCommission = new CommissionModel({
    //   userId: user._id, // referrer (receiver)
    //   fromUserId: null,
    //   level: 0, // 1..10
    //   text: "Royalty",
    //   amount: royalty,
    //   date: new Date(), // the “earning day”
    // });

    // await addRoyaltyCommission.save();

    // console.log(`User: ${user.sponsorID}`);
    // console.log(`Direct Income: ${directIncome}`);
    // console.log(`Team Income: ${teamIncome}`);
    // console.log(`royalty Income : ${royalty}`);
    // console.log("---------------------------");
  }
}

//royalty income function here
async function startRoyaltyCron() {
  // Cron job schedule
  // "0 6 1 * *" => har month ke 1st din, subah 6:00 AM
  console.log("Running royalty commission job every month on 1st day at 6AM ");
  cron.schedule("0 6 1 * *", async () => {
    console.log("royalty cron job run");
    await calculateRoyaltyIncomes();
    console.log("royalty cron job run finish");
  });
}

// level income function here
async function startLevelCron() {
  // Every weekday at 01:00 AM
  console.log("Running level commission job Monday-Friday at 1 AM");
  cron.schedule("0 1 * * 1-5", async () => {
    await levelTeamIncome();
    console.log("level commission job is finish");
  });
}

// self income function here
async function startSelfCron() {
  // "0 0 * * 1-5" => every day at 12:00AM
  // Every weekday at 12:00
  console.log("Running self commission job Monday-Friday at 12 AM");
  cron.schedule("0 0 * * 1-5", async () => {
    await selfEarning();
    console.log("Self Income calculation finish");
  });
}

async function startRewardCron() {
  // "0 6 2 * *" => har month ke 2st din, subah 6:00 AM
  cron.schedule("0 2 * * 1-5", async () => {
    console.log("reward calculation finish");
  });
}

module.exports = {
  startRoyaltyCron,
  startLevelCron,
  startSelfCron,
  startRewardCron,
  getTeamIncome,
};
