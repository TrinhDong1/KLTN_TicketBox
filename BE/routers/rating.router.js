const express = require("express");
const router = express.Router();

const {
  createRating,
  getEventRatings,
  updateRating,
  deleteRating,
} = require("../controllers/rating.controller");

const asyncMiddelware = require("../middlewares/asyncHandle");

// Create a new rating
router.route("/").post(asyncMiddelware(createRating));

// Get all ratings for an event
router.route("/event/:id").get(asyncMiddelware(getEventRatings));

// Update a rating
router.route("/:id").put(asyncMiddelware(updateRating));

// Delete a rating
router.route("/:id").delete(asyncMiddelware(deleteRating));

module.exports = router;
