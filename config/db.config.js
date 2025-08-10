const mongoose = require("mongoose");

const db = () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
      console.log("DB is Connected");
    })
    .catch((error) => {
      console.error("DB Connection Error", error.message);
    });
};

module.exports = db;
