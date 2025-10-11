const User = require("../models/user.model");
const { generateToken, setTokenCookie } = require("../utils/helper");

const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phone,
      sponsorId: referralCode,
    } = req.body;

    if (!username || !email || !password || !phone || !referralCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ sponsorID: referralCode });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid Referral Code",
        });
      }
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      phone,
      referredBy: referralCode,
    });

    await newUser.save();

    if (referrer) {
      await User.findOneAndUpdate(
        { userID: referrer.userID },
        { $inc: { totalReferrals: 1 } }
      );
    }

    const token = generateToken(newUser.userID);

    setTokenCookie(res, token);

    newUser.lastLogin = new Date();

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user: newUser, password, token },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { sponsorID, password } = req.body;

    console.log("sponsorID", sponsorID);
    console.log("password", password);

    if (!sponsorID || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ sponsorID: sponsorID });


    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // if (!user.isActive) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Account is deactivated. Please contact support",
    //   });
    // }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLogin = new Date();

    await user.save();

    const token = generateToken(user.userID);

    await setTokenCookie(res, token);

    console.log("Login successful");
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, token },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

const forgetPassword = async (req, res) => { };

module.exports = { login, register, logout };
