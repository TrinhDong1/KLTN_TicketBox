const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    price: {
      type: String,
    },
    number: {
      type: String,
    },
    amount: {
      type: String,
    },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "event" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    isPending: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "expired", null],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "paypal", "vnpay", null],
      default: null,
    },
    vnpayTransactionId: {
      type: String,
      default: null,
    },
    vnpayTransactionStatus: {
      type: String,
      default: null,
    },
    vnpayPayDate: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("payment", paymentSchema);
