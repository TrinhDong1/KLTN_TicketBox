const eventModel = require("../models/event.model");
const paymentModel = require("../models/payment.model");
const userModel = require("../models/user.model");
const userPreferenceModel = require("../models/userPreference.model");
const recommendationService = require("../services/recommendation.service");

module.exports = {
  getPersonalizedRecommendations: async (req, res) => {
    try {
      const userId = req.params.userId;

      // Check if user exists
      const userExists = await userModel.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userPayments = await paymentModel.find({ user: userId });
      let recommendations = [];

      if (userPayments.length > 0) {
        recommendations = await recommendationService.getHybridRecommendations(
          userId,
          paymentModel,
          eventModel,
          10
        );
      } else {
        recommendations =
          await recommendationService.getColdStartRecommendations(
            eventModel,
            10
          );
      }

      return res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error getting personalized recommendations",
        error: error.message,
      });
    }
  },

  getSimilarEvents: async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const limit = parseInt(req.query.limit) || 5;

      const event = await eventModel.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const similarEvents = await eventModel
        .find({
          _id: { $ne: eventId },
          typeEvent: event.typeEvent,
          isApprove: 1,
        })
        .limit(limit);

      return res.status(200).json({
        success: true,
        count: similarEvents.length,
        recommendations: similarEvents,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error getting similar events",
        error: error.message,
      });
    }
  },

  getTrendingEvents: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;

      const trendingEvents =
        await recommendationService.getTrendingRecommendations(
          paymentModel,
          eventModel,
          limit
        );

      return res.status(200).json({
        success: true,
        count: trendingEvents.length,
        recommendations: trendingEvents,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error getting trending events",
        error: error.message,
      });
    }
  },
  updateUserPreferences: async (req, res) => {
    try {
      const { userId, eventId, action } = req.body;

      if (!userId || !action) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId, action",
        });
      }

      const userExists = await userModel.exists({ _id: userId });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (eventId && eventId !== "none") {
        const eventExists = await eventModel.exists({ _id: eventId });
        if (!eventExists) {
          return res.status(404).json({
            success: false,
            message: "Event not found",
          });
        }
      }

      let userPreference = await userPreferenceModel.findOne({ user: userId });

      if (!userPreference) {
        userPreference = new userPreferenceModel({
          user: userId,
          preferredEventTypes: [],
          viewedEvents: [],
          clickedRecommendations: [],
          interests: [],
        });
      }

      if (action === "view_event" && eventId && eventId !== "none") {
        const event = await eventModel.findById(eventId);

        if (
          event.typeEvent &&
          !userPreference.preferredEventTypes.includes(event.typeEvent)
        ) {
          userPreference.preferredEventTypes.push(event.typeEvent);
        }

        const viewedEvent = userPreference.viewedEvents.find(
          (item) => item.event.toString() === eventId
        );

        if (viewedEvent) {
          viewedEvent.viewCount += 1;
          viewedEvent.lastViewed = new Date();
        } else {
          userPreference.viewedEvents.push({
            event: eventId,
            viewCount: 1,
            lastViewed: new Date(),
          });
        }
      } else if (
        action === "click_recommendation" &&
        eventId &&
        eventId !== "none"
      ) {
        let recommendationType = "personalized";
        if (req.body.recommendationType) {
          recommendationType = req.body.recommendationType;
        }

        userPreference.clickedRecommendations.push({
          event: eventId,
          recommendationType,
          timestamp: new Date(),
        });

        const event = await eventModel.findById(eventId);
        if (
          event.typeEvent &&
          !userPreference.preferredEventTypes.includes(event.typeEvent)
        ) {
          userPreference.preferredEventTypes.push(event.typeEvent);
        }
      } else if (action.startsWith("tab_change_")) {
      }

      await userPreference.save();

      return res.status(200).json({
        success: true,
        message: "User preferences updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating user preferences",
        error: error.message,
      });
    }
  },

  getUserPreferences: async (req, res) => {
    try {
      const userId = req.params.userId;

      const userExists = await userModel.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userPreference = await userPreferenceModel
        .findOne({ user: userId })
        .populate("viewedEvents.event", "name image typeEvent")
        .populate("clickedRecommendations.event", "name image typeEvent");

      if (!userPreference) {
        return res.status(200).json({
          success: true,
          message: "No preferences found for this user",
          preferences: {
            preferredEventTypes: [],
            viewedEvents: [],
            clickedRecommendations: [],
            interests: [],
          },
        });
      }

      return res.status(200).json({
        success: true,
        preferences: {
          preferredEventTypes: userPreference.preferredEventTypes || [],
          viewedEvents: userPreference.viewedEvents || [],
          clickedRecommendations: userPreference.clickedRecommendations || [],
          interests: userPreference.interests || [],
          settings: Object.fromEntries(userPreference.settings || new Map()),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error getting user preferences",
        error: error.message,
      });
    }
  },

  getRecommendationsByTypeEvent: async (req, res) => {
    try {
      const { typeEvent } = req.query;
      const limit = parseInt(req.query.limit) || 10;

      console.log("Requested typeEvent:", typeEvent);

      const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      if (typeEvent) {
        const typeEventNum = parseInt(typeEvent);

        const events = await eventModel
          .find({
            typeEvent: typeEventNum,
            isApprove: 1,
          })
          .limit(Math.max(20, limit * 2));

        const randomizedEvents = shuffleArray(events).slice(0, limit);

        return res.status(200).json({
          success: true,
          count: randomizedEvents.length,
          data: randomizedEvents,
        });
      } else {
        const events = await recommendationService.getColdStartRecommendations(
          eventModel,
          Math.max(20, limit * 2)
        );

        const randomizedEvents = shuffleArray(events).slice(0, limit);

        return res.status(200).json({
          success: true,
          count: randomizedEvents.length,
          data: randomizedEvents,
        });
      }
    } catch (error) {
      console.error("Error in getRecommendationsByTypeEvent:", error);
      return res.status(500).json({
        success: false,
        message: "Error getting recommendations",
        error: error.message,
      });
    }
  },
};
