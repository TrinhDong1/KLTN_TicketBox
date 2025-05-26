const mongoose = require("mongoose");

const ratingSchema = mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "event",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can only rate an event once
ratingSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("rating", ratingSchema);
