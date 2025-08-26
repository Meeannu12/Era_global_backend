const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authenticateToken = require("../middlewares/auth");

router.get("/me", authenticateToken, userController.getUser);
router.put("/edit-profile", authenticateToken, userController.editUserProfile);
router.put(
  "/change-password",
  authenticateToken,
  userController.changePassword
);

router.put(
  "/forget-password",
  authenticateToken,
  userController.forgetPassword
);

router.get(
  "/:sponsorID",
  authenticateToken,
  userController.getUsersBySponsorID
);

router.get(
  "/level/:sponsorID",
  authenticateToken,
  userController.getReferralCountByLevel
);

router.get(
  "/sponsor/:sponsorID",
  authenticateToken,
  userController.getAllUserSponsorBySponsorID
);

router.post(
  "/addWalletAddress",
  authenticateToken,
  userController.addWalletAddress
);

router.get(
  "/getTeamIncomFindByUser/:sponsorID",
  authenticateToken,
  userController.getTeamIncomFindByUser
);
module.exports = router;
