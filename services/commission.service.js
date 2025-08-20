const Commission = require("../models/commission.model");
const Level = require("../models/level.model");
const User = require("../models/user.model");

function startOfDay(d = new Date()) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function isWeekend(date = new Date()) {
  const day = date.getDay(); // 0=Sun,6=Sat
  return day === 0 || day === 6;
}

// credit chain for a single referral on given date
async function distributeForReferral(referralId, onDate = new Date()) {
  const dayKey = startOfDay(onDate);

  const referral = await User.findById(referralId).lean();
  //   console.log("user",referral)
  if (!referral) return { ok: false, reason: "referral_not_found" };

  // eligibility check (referral must have >=20 deposit)
  if ((referral.walletDeposit || 0) < 20) {
    return { ok: true, payouts: 0, reason: "referral_below_20" };
  }

  // start from referral.referredBy (sponsorID string)
  let sponsorID = referral.referredBy;
  let level = 1;
  let payouts = 0;

  // 🔥 Prefetch all level configs once
  const levelMap = {};
  const levels = await Level.find({}).lean();
  for (const L of levels) levelMap[L.level] = L.commission;

  while (sponsorID && level <= 10) {
    // find referrer by sponsorID
    const referrer = await User.findOne({ sponsorID }).exec();
    if (!referrer) break;

    // referrer must also be eligible (wallet >=20)
    if ((referrer.walletDeposit || 0) >= 20) {
      // ✅ Commission percent direct map se uthao
      const percent = levelMap[level] || 0;

      // ✅ Base amount: dono me se chhoti deposit
      const base = Math.min(referrer.walletDeposit, referral.walletDeposit);
      const amount = (base * percent) / 100;

      if (amount > 0) {
        try {
          await Commission.create({
            userId: referrer._id,
            fromUserId: referral._id,
            level,
            amount,
            date: dayKey,
          });

          // ✅ Save only in walletTeamEarn
          referrer.walletTeamEarn = (referrer.walletTeamEarn || 0) + amount;
          referrer.lastCreditedDate = new Date();
          await referrer.save();

          payouts++;
        } catch (err) {
          // duplicate commission for the day -> ignore
          if (err?.code !== 11000) throw err;
        }
      }
      //   }
    }

    // move upline
    sponsorID = referrer.referredBy; // referrer ke upline ka sponsorID
    level++;
  }

  return { ok: true, payouts };
}

// daily distribution for all users (Mon–Fri only)
async function runDailyDistribution(onDate = new Date()) {
  const dayKey = startOfDay(onDate);
  if (isWeekend(dayKey)) {
    return { ok: false, reason: "weekend_skipped", date: dayKey };
  }

  const users = await User.find({}, { _id: 1 }).lean();
  let totalPayouts = 0;

  //   console.log("Users", users);

  for (const u of users) {
    const res = await distributeForReferral(u._id, dayKey);
    if (res.ok) totalPayouts += res.payouts || 0;
  }

  return { ok: true, date: dayKey, totalPayouts };
}

module.exports = {
  startOfDay,
  isWeekend,
  distributeForReferral,
  runDailyDistribution,
};
