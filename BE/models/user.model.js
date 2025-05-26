const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    image: {
      type: String,
    },

    name: {
      type: String,
    },

    email: {
      type: String,
    },

    password: {
      type: String,
      require: true,
    },

    phone: {
      type: String,
      require: true,
    },

    sex: {
      type: Number,
      default: 1,
    },

    // 0: user 1: admin 2: organizer
    role: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },
    // OTP for email verification
    otp: {
      type: String,
    },

    otpExpires: {
      type: Date,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastViewedTypeEvent: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
