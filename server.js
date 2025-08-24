const app = require("./app");
const dbConnect = require("./config/db.config");
const {
  startRoyaltyCron,
  startLevelCron,
  startSelfCron,
  startRewardCron,
} = require("./services/cron.service");
// require("./cronJobs/walletCredit"); // ✅ Ye line cron job ko import karke auto-run karegi

startLevelCron();
startRoyaltyCron();
startSelfCron();
startRewardCron();

app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
  dbConnect();
  console.log(`Server is running on port ${process.env.PORT}`);
});
