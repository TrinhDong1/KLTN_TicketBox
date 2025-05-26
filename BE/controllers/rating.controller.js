const ratingModel = require("../models/rating.model");
const eventModel = require("../models/event.model");
const ErrorResponse = require("../helpers/ErrorResponse");

module.exports = {
  // Create a new rating
  createRating: async (req, res, next) => {
    try {
      const { eventId, userId, rating, comment } = req.body;

      if (!eventId || !userId || !rating) {
        return next(new ErrorResponse("Thiếu thông tin bắt buộc", 400));
      }

      // Check if event exists
      const event = await eventModel.findById(eventId);
      if (!event) {
        return next(new ErrorResponse("Không tìm thấy sự kiện", 404));
      } // Check if event date has passed
      const currentDate = new Date();
      // Parse date with format "DD/MM/YYYY"
      const dateParts = event.timeEnd.split("/");
      const eventEndDate = new Date(
        dateParts[2],
        dateParts[1] - 1,
        dateParts[0]
      );

      if (currentDate < eventEndDate) {
        return next(
          new ErrorResponse(
            "Chỉ có thể đánh giá sự kiện sau khi sự kiện đã kết thúc",
            400
          )
        );
      }

      // Check if user already rated this event
      const existingRating = await ratingModel.findOne({
        event: eventId,
        user: userId,
      });

      if (existingRating) {
        return next(new ErrorResponse("Bạn đã đánh giá sự kiện này rồi", 400));
      }

      const newRating = await ratingModel.create({
        event: eventId,
        user: userId,
        rating,
        comment,
      });

      res.status(201).json({
        success: true,
        data: newRating,
      });
    } catch (error) {
      next(error);
    }
  },
  // Get all ratings for an event
  getEventRatings: async (req, res, next) => {
    try {
      const eventId = req.params.id;

      const ratings = await ratingModel
        .find({ event: eventId })
        .populate("user", "name image")
        .sort({ createdAt: -1 });

      // Calculate average rating
      let totalRating = 0;
      let avgRating = 0;

      if (ratings.length > 0) {
        totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        avgRating = totalRating / ratings.length;
      }

      res.status(200).json({
        success: true,
        count: ratings.length,
        averageRating: avgRating,
        data: ratings,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a rating
  updateRating: async (req, res, next) => {
    try {
      const ratingId = req.params.id;
      const { rating, comment } = req.body;

      const updatedRating = await ratingModel.findByIdAndUpdate(
        ratingId,
        { rating, comment },
        { new: true, runValidators: true }
      );

      if (!updatedRating) {
        return next(new ErrorResponse("Không tìm thấy đánh giá", 404));
      }

      res.status(200).json({
        success: true,
        data: updatedRating,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a rating
  deleteRating: async (req, res, next) => {
    try {
      const ratingId = req.params.id;

      const rating = await ratingModel.findByIdAndDelete(ratingId);

      if (!rating) {
        return next(new ErrorResponse("Không tìm thấy đánh giá", 404));
      }

      res.status(200).json({
        success: true,
        data: {},
      });
    } catch (error) {
      next(error);
    }
  },
};
