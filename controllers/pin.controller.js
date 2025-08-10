const Pin = require("../models/pin.model");
const PinHistory = require("../models/pinHistory.model");
const User = require("../models/user.model");

// Generate single pin with ERA- prefix + 8 alphanumeric characters
function generateSinglePin() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let pin = "";
  for (let i = 0; i < 10; i++) {
    pin += chars[Math.floor(Math.random() * chars.length)];
  }
  return pin;
}

// API endpoint to generate multiple pins
async function generatePins(req, res) {
  try {
    const userID = "ERA-ANIL-584";
    const { count = 10, authCode } = req.body; // Default 1000 pins
    const maxCount = 100000; // Maximum allowed per request
    console.log(req.body);
    if (userID !== authCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid code ! You are not authorized",
      });
    }

    // Validate count
    if (count > maxCount) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxCount} pins allowed per request`,
      });
    }

    if (count <= 0) {
      return res.status(400).json({
        success: false,
        message: "Count must be greater than 0",
      });
    }

    console.log(`Generating ${count} unique pins...`);
    const startTime = Date.now();

    // Load existing pins to avoid duplicates
    const existingPins = await Pin.find({}, { pin: 1 }).lean();
    const usedPinsSet = new Set(existingPins.map((p) => p.pin));

    console.log(`Found ${existingPins.length} existing pins in database`);

    const newPins = [];
    let attempts = 0;
    const maxAttempts = count * 3; // Prevent infinite loops

    while (newPins.length < count && attempts < maxAttempts) {
      const pin = generateSinglePin();
      attempts++;

      if (!usedPinsSet.has(pin)) {
        usedPinsSet.add(pin);
        newPins.push({
          pin,
          used: false,
        });

        // Log progress for large batches
        if (newPins.length % 5000 === 0) {
          console.log(`Generated ${newPins.length}/${count} pins`);
        }
      }
    }

    if (newPins.length < count) {
      return res.status(500).json({
        success: false,
        message: `Could only generate ${newPins.length} unique pins out of ${count} requested`,
        generated: newPins.length,
      });
    }

    // Insert pins in batches
    const batchSize = 1000;
    const batches = [];

    for (let i = 0; i < newPins.length; i += batchSize) {
      const batch = newPins.slice(i, i + batchSize);
      batches.push(Pin.insertMany(batch, { ordered: false }));
    }

    await Promise.all(batches);

    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;

    // Get updated statistics
    const totalPins = await Pin.countDocuments();
    const usedPins = await Pin.countDocuments({ used: true });

    res.status(201).json({
      success: true,
      message: `Successfully generated ${count} unique pins`,
      data: {
        generated: count,
        totalAttempts: attempts,
        timeTaken: `${timeTaken.toFixed(2)} seconds`,
        successRate: `${((count / attempts) * 100).toFixed(2)}%`,
        statistics: {
          totalPinsInDatabase: totalPins,
          unusedPins: totalPins - usedPins,
        },
      },
    });
  } catch (error) {
    console.error("Error generating pins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate pins",
      error: error.message,
    });
  }
}

// API endpoint to get pin statistics
async function getPinStats(req, res) {
  try {
    const totalPins = await Pin.countDocuments();
    const usedPins = await Pin.countDocuments({ used: true });
    const unusedPins = totalPins - usedPins;

    res.json({
      success: true,
      data: {
        totalPins,
        usedPins,
        unusedPins,
        usageRate:
          totalPins > 0 ? ((usedPins / totalPins) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error("Error getting pin statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pin statistics",
      error: error.message,
    });
  }
}

// API endpoint to get unused pins
async function getUnusedPins(req, res) {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const pins = await Pin.find({ used: false, assignedTo: null })
      .select("pin createdAt")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean();

    const totalUnused = await Pin.countDocuments({ used: false });

    res.json({
      success: true,
      data: {
        pins: pins.map((p) => p.pin),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUnused / limit),
          totalUnused,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting unused pins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unused pins",
      error: error.message,
    });
  }
}

// API endpoint to mark pin as used
async function markPinAsUsed(req, res) {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: "Pin is required",
      });
    }

    const updatedPin = await Pin.findOneAndUpdate(
      { pin, used: false },
      { used: true },
      { new: true }
    );

    if (!updatedPin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found or already used",
      });
    }

    res.json({
      success: true,
      message: "Pin marked as used successfully",
      data: {
        pin: updatedPin.pin,
        used: updatedPin.used,
        updatedAt: updatedPin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error marking pin as used:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark pin as used",
      error: error.message,
    });
  }
}

const activatePin = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.userId;

    const user = await User.findOne({ userID: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingPin = await Pin.findOne({ pin: pin });
    if (!existingPin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    if (existingPin.used) {
      return res.status(400).json({
        success: false,
        message: "Pin already used",
      });
    }

    user.pin = pin;
    await user.save();

    existingPin.used = true;
    await existingPin.save();

    return res.status(200).json({
      success: true,
      message: "Pin activated successfully",
    });
  } catch (error) {
    console.error("Error activating pin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to activate pin",
      error: error.message,
    });
  }
};

const assignPinToUser = async (req, res) => {
  try {
    let { sponsorID, numberOfPins } = req.body;

    const fromUser = await User.findOne({ userID: req.userId });
    const toUser = await User.findOne({ sponsorID: sponsorID });

    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    numberOfPins = parseInt(numberOfPins);

    const pinsCount = await Pin.countDocuments({
      used: false,
      assignedTo: fromUser.sponsorID,
    });

    if (pinsCount < numberOfPins) {
      return res.status(400).json({
        success: false,
        message: "You have less number of pins to assign",
      });
    }

    const pins = await Pin.find({
      used: false,
      assignedTo: fromUser.sponsorID,
    }).limit(numberOfPins);

    const pinIds = pins.map((p) => p._id);

    const result = await Pin.updateMany(
      { _id: { $in: pinIds } },
      { $set: { assignedTo: sponsorID } }
    );

    if (result) {
      const pinHistorySend = new PinHistory({
        fromUserID: fromUser._id,
        toUserID: toUser._id,
        pinQuantity: numberOfPins,
      });
      await pinHistorySend.save();
    }

    return res.status(200).json({
      success: true,
      message: "Pins assigned to user successfully",
    });
  } catch (error) {
    console.error("Error assigning pin to user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign pin to user",
      error: error.message,
    });
  }
};

const assignPinByAdmin = async (req, res) => {
  try {
    let { sponsorID, numberOfPins } = req.body;
    console.log("sponsorID", sponsorID);

    const fromUser = await User.findOne({ userID: req.userId });
    const toUser = await User.findOne({ sponsorID: sponsorID });

    console.log("toUser", toUser);
    console.log("fromUser", fromUser);

    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    numberOfPins = parseInt(numberOfPins);

    const pinsCount = await Pin.countDocuments({
      used: false,
      assignedTo: null,
    });

    if (pinsCount < numberOfPins) {
      return res.status(400).json({
        success: false,
        message: "You have less number of pins to assign",
      });
    }

    const pins = await Pin.find({
      used: false,
      assignedTo: null,
    }).limit(numberOfPins);

    console.log("pins", pins.length);

    if (pins.length < numberOfPins) {
      return res.status(400).json({
        success: false,
        message: "You have less number of pins to assign",
      });
    }

    const pinIds = pins.map((p) => p._id);

    const result = await Pin.updateMany(
      { _id: { $in: pinIds } },
      { $set: { assignedTo: sponsorID } }
    );

    if (result) {
      const pinHistorySend = new PinHistory({
        fromUserID: fromUser._id,
        toUserID: toUser._id,
        pinQuantity: numberOfPins,
      });
      await pinHistorySend.save();
    }

    return res.status(200).json({
      success: true,
      message: "Pins assigned to user successfully",
    });
  } catch (error) {
    console.error("Error assigning pin to user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign pin to user",
      error: error.message,
    });
  }
};

const getPinsBySponsorID = async (req, res) => {
  try {
    const sponsorID = req.params.sponsorID;

    const result = await Pin.aggregate([
      { $match: { assignedTo: sponsorID } },
      {
        $facet: {
          totalPins: [{ $count: "count" }],
          pins: [{ $match: { used: false } }],
        },
      },
    ]);

    const totalPins = result[0]?.totalPins[0]?.count || 0;
    const pins = result[0]?.pins || [];
    const usedPins = totalPins - pins.length;

    return res.status(200).json({
      success: true,
      message: "Get User Information Successfully",
      data: { totalPins, pins, usedPins },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Get user failed",
      error: error.message,
    });
  }
};

module.exports = {
  generateSinglePin,
  generatePins,
  getPinStats,
  getUnusedPins,
  markPinAsUsed,
  activatePin,
  assignPinToUser,
  getPinsBySponsorID,
  assignPinByAdmin,
};
