const app = require("./app");
const dbConnect = require("./config/db.config");
const { startRoyaltyCron, startCron } = require("./services/cron.service");
// const { startCron, startRoyaltyCron } = require("./services/cron.service");
// require("./cronJobs/walletCredit"); // ✅ Ye line cron job ko import karke auto-run karegi

startCron();
startRoyaltyCron();


app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
  dbConnect();
  console.log(`Server is running on port ${process.env.PORT}`);
});
