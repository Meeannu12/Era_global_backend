const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    // User's own referral ID (generated automatically)
    sponsorID: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
    },
    // Who referred this user (referrer's sponsorID)
    referredBy: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    // Track referral statistics
    totalReferrals: {
      type: Number,
      default: 0,
    },
    walletDeposit: {
      type: Number,
      default: 0,
    },
    walletClaim: {
      type: Number,
      default: 0,
    },
    setClaimTime: {
      type: Date,
    },
    walletSelfEarn: {
      type: Number,
      default: 0,
    },
    walletTeamEarn: {
      type: Number,
      default: 0,
    },
    walletRoyalty: {
      type: Number,
      default: 0,
    },
    walletReward: {
      type: Number,
      default: 0,
    },
    lastCreditedDate: { type: Date },
    level: {
      type: Number,
      default: 0,
    },
    walletAddress: String,
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    pin: {
      type: String,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware
userSchema.pre("save", async function (next) {
  try {
    if (!this.userID) {
      this.userID = uuidv4();
    }

    if (this.isModified("password")) {
      if (!this.password.startsWith("$2")) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
      }
    }

    // Generate unique sponsorID
    if (!this.sponsorID) {
      let prefix = "ERA";
      let timestamp = Date.now().toString();
      let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let timestampChars =
        timestamp.slice(-9) +
        alphabet[Math.floor(Math.random() * alphabet.length)];

      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        const testSponsorID = `${prefix}-${timestampChars}`;
        const existing = await mongoose
          .model("User")
          .findOne({ sponsorID: testSponsorID });

        if (!existing) {
          this.sponsorID = testSponsorID;
          isUnique = true;
        } else {
          // Generate new timestamp if collision
          timestamp = (Date.now() + Math.random() * 1000).toString();
          timestampChars = timestamp.slice(-9);
          attempts++;
        }
      }

      if (!isUnique) {
        throw new Error("Unable to generate unique sponsor ID");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
