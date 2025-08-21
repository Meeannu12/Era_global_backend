const app = require("./app");
const dbConnect = require("./config/db.config");
// const { startCron } = require("./services/cron.service");
// require("./cronJobs/walletCredit"); // ✅ Ye line cron job ko import karke auto-run karegi

// startCron();

app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
  dbConnect();
  console.log(`Server is running on port ${process.env.PORT}`);
});
