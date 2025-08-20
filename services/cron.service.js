// services/cron.service.js
const cron = require("node-cron");
const { runDailyDistribution } = require("./commission.service");

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

// const data = async () => {
//   const data = await runDailyDistribution(new Date());
//   console.log("DATA...........", data);
// };

// data();

module.exports = { startCron };
