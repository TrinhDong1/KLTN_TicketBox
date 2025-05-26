const express = require("express");
const router = express.Router();

const {
  getPersonalizedRecommendations,
  getSimilarEvents,
  getTrendingEvents,
  updateUserPreferences,
  getUserPreferences,
  getRecommendationsByTypeEvent,
} = require("../controllers/recommendation.controller");

const asyncMiddleware = require("../middlewares/asyncHandle");

// Route to get recommendations by typeEvent
router.route("/").get(asyncMiddleware(getRecommendationsByTypeEvent));

// Route to get personalized recommendations for a user
router
  .route("/user/:userId")
  .get(asyncMiddleware(getPersonalizedRecommendations));

// Route to get similar events to a specific event
router.route("/similar/:eventId").get(asyncMiddleware(getSimilarEvents));

// Route to get trending events based on ticket sales
router.route("/trending").get(asyncMiddleware(getTrendingEvents));

// Route to update user preferences
router.route("/preferences").post(asyncMiddleware(updateUserPreferences));

// Route to get user preferences
router.route("/preferences/:userId").get(asyncMiddleware(getUserPreferences));

module.exports = router;
