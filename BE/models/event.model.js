const mongoose = require("mongoose");

const eventSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },

    permission: {
      type: Number,
      default: 1,
    },

    ticket: {
      type: String,
    },

    address: {
      type: String,
    },

    phone: {
      type: String,
    },

    email: {
      type: String,
    },

    infoEvent: {
      type: String,
    },

    infoOrganize: {
      type: String,
    },

    image: {
      type: String,
    },

    typeEvent: {
      type: Number,
    },

    timeEnd: {
      type: String,
    },

    timeStart: {
      type: String,
    },

    percent: {
      type: Number,
      default: 0,
    },

    isApprove: {
      type: Number,
      default: 0,
    },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("event", eventSchema);