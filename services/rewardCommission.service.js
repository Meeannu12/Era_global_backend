const moment = require("moment");
const commissionModel = require("../models/commission.model");
const Reward = require("../models/reward.model");
const { Royalty, RoyaltyAmountStatus } = require("../models/royalty.model");
const User = require("../models/user.model");

const now = new Date();
const monthStart = moment(now).startOf("month").toDate();
const monthEnd = moment(now).endOf("month").toDate();

// Reward calculate karne wala function
async function calculateRewardForAllUsers() {
  console.log("Reward calculation started:", new Date());

  // yaha tu apna pura directIncome/teamIncome + Reward wala logic call karega
  await calculateRewardIncomes();

  console.log("Reward calculation finished:", new Date());
}

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

// Ye function ek user ke liye royalty decide karega
// async function calculateReward(user, levels, userid) {
//   let lastReward = 0;

//   for (const lvl of levels) {
//     if (user.directIncome >= lvl.d_Income && user.teamIncome >= lvl.t_Income) {
//       // pehle check karo userid exist karta hai ya nahi
//       const existing = await Reward.findOne({
//         level: lvl.level,
//         userIds: userid,
//       });

//       if (existing) {
//         // agar already added hai → skip this level and continue loop
//         continue;
//       }

//       // agar nahi mila → add userid
//       const updateResult = await Reward.updateOne(
//         { level: lvl.level },
//         { $push: { userIds: userid } },
//         { upsert: true }
//       );

//       if (updateResult.modifiedCount > 0 || updateResult.upsertedCount > 0) {
//         lastReward = lvl.reward;
//       }
//     } else {
//       // condition fail → yahin ruk jao
//       break;
//     }
//   }

//   return lastReward;
// }

async function calculationRoyalty(user, levels, userid) {
  let lastRoyalty = 0;

  for (const lvl of levels) {
    if (user.directIncome >= lvl.d_Income && user.teamIncome >= lvl.t_Income) {
      // check if already rewarded this month
      const existing = await Royalty.findOne({
        level: lvl.level,
        "userRoyalty.userIds": userid,
        "userRoyalty.date": {
          $gte: monthStart,
          $lte: monthEnd,
        },
      });

      if (existing) {
        // is month me reward already mil chuka hai
        continue; // skip karke next level check karo
      }

      // nahi mila to reward add kar do
      const updateResult = await Royalty.updateOne(
        { level: lvl.level },
        {
          $push: {
            userRoyalty: { userIds: userid, date: new Date() },
          },
        },
        { upsert: true }
      );

      if (updateResult.modifiedCount > 0 || updateResult.upsertedCount > 0) {
        // Find if any entry for this user in this month
        const existing = await RoyaltyAmountStatus.findOne({
          userIds: userid,
          date: { $gte: monthStart, $lte: monthEnd },
        });

        if (existing) {
          if (lvl.level > existing.level) {
            // If current level is higher → update
            existing.level = lvl.level;
            existing.amount += lvl.royalty - existing.amount;
            existing.date = now;

            await User.findByIdAndUpdate(userid, {
              $inc: {
                walletEarning: lvl.royalty - existing.amount,
              },
            });

            await existing.save();
          }
          // else: level is same or lower — skip
        } else {
          // No entry this month — insert new
          const newEntry = new RoyaltyAmountStatus({
            userIds: userid,
            level: lvl.level,
            amount: lvl.royalty,
            status: "unpaid",
            date: now,
          });
          await User.findByIdAndUpdate(userid, {
            $inc: {
              walletEarning: lvl.royalty,
            },
          });
          await newEntry.save();
        }

        lastRoyalty = lvl.royalty;
      }
    } else {
      break;
    }
  }

  return lastRoyalty;
}

async function calculateReward(user, levels, userid) {
  let lastReward = 0


  for (const lvl of levels) {
    if (user.directIncome > lvl.d_Income && user.teamIncome > lvl.t_Income) {
      // pehle check karo userid exist karta hai ya nahi
      const existing = await Reward.findOne({
        level: lvl.level,
        userIds: userid,
      });

      if (existing) {
        // agar already added hai → skip this level and continue loop
        continue;
      }

      // agar nahi mila → add userid
      const updateResult = await Reward.updateOne(
        { level: lvl.level },
        { $push: { userIds: userid } },
        { upsert: true }
      );

      if (updateResult.modifiedCount > 0 || updateResult.upsertedCount > 0) {
        lastReward = lvl.reward;
      }
    } else {
      // condition fail → yahin ruk jao
      break;
    }
  }
  return lastReward
}

// main calculation for all users
async function calculateRewardIncomes() {
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

    // Reward check
    const reward = await calculateReward(
      { directIncome, teamIncome },
      level,
      user._id
    );

    user.walletReward += reward;
    user.walletEarning += reward;
    await user.save();

    if (reward > 0) {
      const addRewardCommission = new commissionModel({
        userId: user._id, // referrer (receiver)
        fromUserId: null,
        level: 0, // 1..10
        text: "Reward",
        amount: reward,
        date: new Date(), // the “earning day”
      });
      await addRewardCommission.save();
    }

    // console.log(`User: ${user.sponsorID}`);
    // console.log(`Direct Income: ${directIncome}`);
    // console.log(`Team Income: ${teamIncome}`);
    // console.log(`Reward Income : ${royalty}`);
    // console.log("---------------------------");
  }
}

module.exports = {
  calculateRewardIncomes,
  calculateReward,
  calculationRoyalty,
};
