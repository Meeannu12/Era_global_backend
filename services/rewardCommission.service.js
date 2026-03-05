const moment = require("moment");
const Reward = require("../models/reward.model");
const User = require("../models/user.model");

const now = new Date();
const monthStart = moment(now).startOf("month").toDate();
const monthEnd = moment(now).endOf("month").toDate();






async function calculateReward(user, levels, userid) {
  let lastReward = 0


  for (const lvl of levels) {
    if (user.directIncome >= lvl.d_Income && user.teamIncome >= lvl.t_Income) {
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
        lastReward += lvl.reward;
      }
    } else {
      // condition fail → yahin ruk jao
      break;
    }
  }
  return lastReward
}




module.exports = {
  calculateReward,
};
