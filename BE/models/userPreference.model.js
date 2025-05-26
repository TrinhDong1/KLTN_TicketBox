const mongoose = require("mongoose");

/**
 * User Preference Schema
 * Stores user preferences and interactions to improve recommendations
 */
const userPreferenceSchema = mongoose.Schema(
  {
    // Reference to the user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // Event categories/types that the user has shown interest in
    preferredEventTypes: [
      {
        type: Number,
        default: [],
      },
    ],

    // Track viewed events
    viewedEvents: [
      {
        event: { type: mongoose.Schema.Types.ObjectId, ref: "event" },
        viewCount: { type: Number, default: 1 },
        lastViewed: { type: Date, default: Date.now },
      },
    ],

    // Track clicked recommendations
    clickedRecommendations: [
      {
        event: { type: mongoose.Schema.Types.ObjectId, ref: "event" },
        recommendationType: {
          type: String,
          enum: ["personalized", "similar", "trending"],
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Store explicit user interests if they provide them
    interests: [
      {
        type: String,
      },
    ],

    // Store any custom preferences or settings
    settings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
userPreferenceSchema.index({ user: 1 });
userPreferenceSchema.index({ "viewedEvents.event": 1, user: 1 });

module.exports = mongoose.model("userPreference", userPreferenceSchema);
