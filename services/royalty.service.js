const RoyaltyHistory = require("../models/royalty.model");
const User = require("../models/user.model");





const rewardLevel = [
    { d_Income: 300, level: 1, t_Income: 300, reward: 0, royalty: 10 },
    { d_Income: 350, level: 2, t_Income: 700, reward: 50, royalty: 50 },
    { d_Income: 500, level: 3, t_Income: 2000, reward: 100, royalty: 100 },
    { d_Income: 600, level: 4, t_Income: 9000, reward: 600, royalty: 300 },
    { d_Income: 1000, level: 5, t_Income: 22000, reward: 1100, royalty: 600 },
    { d_Income: 2000, level: 6, t_Income: 55000, reward: 3300, royalty: 1100 },
    { d_Income: 3000, level: 7, t_Income: 110000, reward: 10000, royalty: 2500 },
    { d_Income: 4000, level: 8, t_Income: 500000, reward: 25000, royalty: 4000 },
    {
        d_Income: 7000,
        level: 9,
        t_Income: 1500000,
        reward: 250000,
        royalty: 11000,
    },
    {
        d_Income: 15000,
        level: 10,
        t_Income: 5000000,
        reward: 1100000,
        royalty: 21000,
    },
];

const calculateAndCreditRoyalty = async (userId, directIncome, teamIncome) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"

    // Step 1: Find which level user qualifies for
    const matchedLevel = rewardLevel
        .slice()
        .reverse()
        .find((l) => directIncome >= l.d_Income && teamIncome >= l.t_Income);

    if (!matchedLevel) {
        return { message: "No Royalty level matched yet" };
    }

    const { royalty: currentRoyalty, level: currentLevel } = matchedLevel;

    // Step 2: Find last royalty entry of user
    const lastHistory = await RoyaltyHistory.findOne({ userId }).sort({ createdAt: -1 });

    // 🆕 CASE 1: First royalty ever
    if (!lastHistory) {
        const newHistory = await RoyaltyHistory.create({
            userId,
            month: currentMonth,
            directIncome,
            levelIncome: teamIncome,
            previousRoyalty: 0,
            newRoyalty: currentRoyalty,
            creditedAmount: currentRoyalty,
            status: "unpaid",
            type: "new",
            levelAchieved: currentLevel,
        });

        await User.findByIdAndUpdate(userId, { $set: { walletRoyalty: currentRoyalty }, $inc: { walletEarning: currentRoyalty, totalEarning: currentRoyalty } });
        return { message: "First royalty credited", added: currentRoyalty };
    }

    // 🕐 CASE 2: Same month (check for upgrade)
    if (lastHistory.month === currentMonth) {
        if (currentRoyalty === lastHistory.newRoyalty) {
            return { message: "Already credited for this level" };
        }

        if (currentRoyalty > lastHistory.newRoyalty) {
            const diff = currentRoyalty - lastHistory.newRoyalty;

            lastHistory.previousRoyalty = lastHistory.newRoyalty;
            lastHistory.newRoyalty = currentRoyalty;
            lastHistory.creditedAmount = diff;
            lastHistory.levelAchieved = currentLevel;
            lastHistory.type = "upgrade";
            lastHistory.status = "unpaid";
            await lastHistory.save();

            await User.findByIdAndUpdate(userId, { $set: { walletRoyalty: currentRoyalty }, $inc: { walletEarning: diff, totalEarning: diff } });

            return { message: "Upgraded in same month", added: diff };
        }

        return { message: "No upgrade this month" };
    }

    // 📅 CASE 3: New month (new entry, full royalty)
    if (lastHistory.month !== currentMonth) {
        const newHistory = await RoyaltyHistory.create({
            userId,
            month: currentMonth,
            directIncome,
            levelIncome: teamIncome,
            previousRoyalty: lastHistory.newRoyalty,
            newRoyalty: currentRoyalty,
            creditedAmount: currentRoyalty,
            status: "unpaid",
            type: "new",
            levelAchieved: currentLevel,
        });

        await User.findByIdAndUpdate(userId, { $set: { walletRoyalty: currentRoyalty }, $inc: { walletEarning: currentRoyalty, totalEarning: currentRoyalty } });
        return { message: "New month royalty credited", added: currentRoyalty };
    }

    return { message: "No changes" };
};


module.exports = {
    calculateAndCreditRoyalty
}