const app = require("./app");
const dbConnect = require("./config/db.config");

app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
  dbConnect();
  console.log(`Server is running on port ${process.env.PORT}`);
});
