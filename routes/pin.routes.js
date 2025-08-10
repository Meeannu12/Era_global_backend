const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/auth");
const pinController = require("../controllers/pin.controller");

router.post("/generate", pinController.generatePins);
router.get("/stats", pinController.getPinStats);
router.get("/unused", pinController.getUnusedPins);
router.put("/mark-used", pinController.markPinAsUsed);

router.put("/assign", authenticateToken, pinController.assignPinToUser);
router.get("/:sponsorID", authenticateToken, pinController.getPinsBySponsorID);
router.put("/assignByAdmin", authenticateToken, pinController.assignPinByAdmin);

router.post("/active-pin", authenticateToken, pinController.activatePin);

module.exports = router;
