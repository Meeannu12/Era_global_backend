const User = require("../models/user.model");

async function getReferralTree(sponsorID) {
  const visited = new Set(); // To avoid cycles
  let totalCount = 0;
  const queue = [sponsorID];

  while (queue.length > 0) {
    const currentSponsor = queue.shift();

    const referrals = await User.find(
      { referredBy: currentSponsor },
      "sponsorID"
    );

    for (const user of referrals) {
      if (!visited.has(user.sponsorID)) {
        visited.add(user.sponsorID);
        queue.push(user.sponsorID);
        totalCount++;
      }
    }
  }

  return {
    totalReferred: totalCount,
    users: Array.from(visited),
  };
}

async function getReferralCountByEachLevel(sponsorID) {
  const visited = new Set();
  const levelStats = {}; // level => { total, active, inactive, users: [] }
  let queue = [{ sponsorID, level: 1 }];

  while (queue.length > 0) {
    const nextQueue = [];

    for (const { sponsorID: current, level } of queue) {
      const referrals = await User.find(
        { referredBy: current },
        "sponsorID pin username phone"
      );

      if (!levelStats[level]) {
        levelStats[level] = {
          total: 0,
          active: 0,
          inactive: 0,
          users: [],
        };
      }

      for (const user of referrals) {
        if (visited.has(user.sponsorID)) continue;
        visited.add(user.sponsorID);
        nextQueue.push({ sponsorID: user.sponsorID, level: level + 1 });

        levelStats[level].total++;
        if (user.pin) levelStats[level].active++;
        else levelStats[level].inactive++;

        levelStats[level].users.push({
          sponsorID: user.sponsorID,
          username: user.username,
          phone: user.phone,
          status: user.pin ? "active" : "inactive",
        });
      }
    }

    queue = nextQueue;
  }

  return levelStats;
}

module.exports = { getReferralTree, getReferralCountByEachLevel };
