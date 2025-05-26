/**
 * Recommendation Service - Uses collaborative filtering and content-based filtering
 * to provide personalized event recommendations for users.
 */

// Helper function to calculate similarity between users
function calculateUserSimilarity(userA, userB, purchaseData) {
  // If either user has no purchases, they cannot be compared
  if (!purchaseData[userA] || !purchaseData[userB]) return 0;

  const eventsA = new Set(
    purchaseData[userA].map((purchase) => purchase.eventId)
  );
  const eventsB = new Set(
    purchaseData[userB].map((purchase) => purchase.eventId)
  );

  // Intersection of events purchased by both users
  const intersection = new Set(
    [...eventsA].filter((event) => eventsB.has(event))
  );

  // Calculate Jaccard similarity
  const union = new Set([...eventsA, ...eventsB]);
  return intersection.size / union.size;
}

// Helper function to calculate similarity between events based on features
function calculateEventSimilarity(eventA, eventB) {
  if (!eventA || !eventB) return 0;

  let score = 0;
  let count = 0;

  // Type of event
  if (eventA.typeEvent === eventB.typeEvent) {
    score += 1;
    count += 1;
  }

  // Compare time (preference for events in the same season/month)
  if (eventA.timeStart && eventB.timeStart) {
    const dateA = new Date(eventA.timeStart);
    const dateB = new Date(eventB.timeStart);
    // Same month
    if (dateA.getMonth() === dateB.getMonth()) {
      score += 0.5;
    }
    count += 1;
  }

  return count > 0 ? score / count : 0;
}

/**
 * User-based collaborative filtering recommendation
 * Recommends events that similar users have purchased
 */
async function getCollaborativeFilteringRecommendations(
  userId,
  paymentModel,
  eventModel,
  limit = 5
) {
  try {
    // Get all purchases
    const allPayments = await paymentModel
      .find({})
      .populate("user")
      .populate("event");

    // Group purchases by user
    const purchasesByUser = {};
    allPayments.forEach((payment) => {
      const user = payment.user._id.toString();
      if (!purchasesByUser[user]) {
        purchasesByUser[user] = [];
      }
      purchasesByUser[user].push({
        eventId: payment.event._id.toString(),
        event: payment.event,
      });
    });

    // Calculate similarity between target user and all other users
    const userSimilarities = [];
    for (const otherUserId in purchasesByUser) {
      if (otherUserId !== userId) {
        const similarity = calculateUserSimilarity(
          userId,
          otherUserId,
          purchasesByUser
        );
        userSimilarities.push({ userId: otherUserId, similarity });
      }
    }

    // Sort users by similarity (descending)
    userSimilarities.sort((a, b) => b.similarity - a.similarity);

    // Get events purchased by similar users that the target user hasn't purchased
    const targetUserEvents = new Set(
      (purchasesByUser[userId] || []).map((purchase) => purchase.eventId)
    );

    const recommendedEvents = [];
    for (const { userId: similarUserId } of userSimilarities) {
      for (const purchase of purchasesByUser[similarUserId]) {
        if (
          !targetUserEvents.has(purchase.eventId) &&
          !recommendedEvents.some((e) => e._id.toString() === purchase.eventId)
        ) {
          recommendedEvents.push(purchase.event);
          if (recommendedEvents.length >= limit) {
            break;
          }
        }
      }
      if (recommendedEvents.length >= limit) {
        break;
      }
    }

    return recommendedEvents;
  } catch (error) {
    console.error("Error in collaborative filtering:", error);
    return [];
  }
}

/**
 * Content-based filtering recommendation
 * Recommends events similar to those the user has purchased before
 */
async function getContentBasedRecommendations(
  userId,
  paymentModel,
  eventModel,
  limit = 5
) {
  try {
    // Get user's purchases
    const userPayments = await paymentModel
      .find({ user: userId })
      .populate("event");
    const userEventIds = userPayments.map((payment) =>
      payment.event._id.toString()
    );

    if (userEventIds.length === 0) {
      return [];
    }

    // Get all available events
    const allEvents = await eventModel.find({
      _id: { $nin: userEventIds },
      isApprove: 1, // Only approved events
    });

    // Score each available event based on similarity to user's purchased events
    const eventScores = [];

    for (const candidateEvent of allEvents) {
      let totalSimilarityScore = 0;

      for (const payment of userPayments) {
        const userEvent = payment.event;
        const similarityScore = calculateEventSimilarity(
          userEvent,
          candidateEvent
        );
        totalSimilarityScore += similarityScore;
      }

      // Calculate average similarity
      const averageSimilarity =
        userPayments.length > 0
          ? totalSimilarityScore / userPayments.length
          : 0;

      eventScores.push({
        event: candidateEvent,
        score: averageSimilarity,
      });
    }

    // Sort events by score (descending)
    eventScores.sort((a, b) => b.score - a.score);

    // Return top recommendations
    return eventScores.slice(0, limit).map((item) => item.event);
  } catch (error) {
    console.error("Error in content-based filtering:", error);
    return [];
  }
}

/**
 * Get trending events based on recent ticket sales
 */
async function getTrendingRecommendations(paymentModel, eventModel, limit = 5) {
  try {
    // Get payments from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await paymentModel.find({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Count ticket sales by event
    const eventCounts = {};
    recentPayments.forEach((payment) => {
      const eventId = payment.event.toString();
      if (!eventCounts[eventId]) {
        eventCounts[eventId] = 0;
      }
      eventCounts[eventId] += parseInt(payment.number || 1);
    });

    // Sort events by ticket count
    const sortedEventIds = Object.keys(eventCounts).sort(
      (a, b) => eventCounts[b] - eventCounts[a]
    );
    const topEventIds = sortedEventIds.slice(0, limit);

    // Fetch full event details
    if (topEventIds.length === 0) {
      return [];
    }

    const trendingEvents = await eventModel.find({
      _id: { $in: topEventIds },
      isApprove: 1,
    });

    // Sort in same order as the counts
    return topEventIds
      .map((id) => trendingEvents.find((event) => event._id.toString() === id))
      .filter(Boolean);
  } catch (error) {
    console.error("Error getting trending events:", error);
    return [];
  }
}

/**
 * Get hybrid recommendations that combine multiple recommendation methods
 */
async function getHybridRecommendations(
  userId,
  paymentModel,
  eventModel,
  limit = 10
) {
  try {
    // Get recommendations from each method
    const [collaborative, contentBased, trending] = await Promise.all([
      getCollaborativeFilteringRecommendations(
        userId,
        paymentModel,
        eventModel,
        limit
      ),
      getContentBasedRecommendations(userId, paymentModel, eventModel, limit),
      getTrendingRecommendations(paymentModel, eventModel, limit),
    ]);

    // Combine and deduplicate recommendations
    const seenEventIds = new Set();
    const recommendations = [];

    // Function to add events from a source while avoiding duplicates
    const addEvents = (events, weight = 1) => {
      for (const event of events) {
        const eventId = event._id.toString();
        if (!seenEventIds.has(eventId)) {
          seenEventIds.add(eventId);
          recommendations.push({
            event,
            score: weight,
          });
        }
      }
    };

    // Add events with different weights based on method
    addEvents(collaborative, 1.0); // Highest weight for collaborative filtering
    addEvents(contentBased, 0.8); // Medium weight for content-based
    addEvents(trending, 0.6); // Lower weight for trending

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Return the top recommendations
    return recommendations.slice(0, limit).map((item) => item.event);
  } catch (error) {
    console.error("Error in hybrid recommendations:", error);
    return [];
  }
}

/**
 * Get personalized recommendations for users with no purchase history
 * Results are now fetched in larger quantities to allow for randomization in the controller
 */
async function getColdStartRecommendations(eventModel, limit = 5) {
  try {
    // For new users, recommend popular and recent events
    // We'll get a mix of recent and popular events
    const recentEvents = await eventModel
      .find({ isApprove: 1 })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit);

    // Also get some events sorted by other criteria for diversity
    const popularEvents = await eventModel
      .find({ isApprove: 1 })
      .sort({ views: -1 }) // Most viewed first, if your schema has a views field
      .limit(limit);

    // Combine events, remove duplicates
    const combinedEvents = [...recentEvents];

    // Add popular events that aren't already in the list
    popularEvents.forEach((event) => {
      const exists = combinedEvents.some(
        (e) => e._id.toString() === event._id.toString()
      );
      if (!exists) {
        combinedEvents.push(event);
      }
    });

    return combinedEvents;
  } catch (error) {
    console.error("Error in cold start recommendations:", error);
    return [];
  }
}

module.exports = {
  getCollaborativeFilteringRecommendations,
  getContentBasedRecommendations,
  getTrendingRecommendations,
  getHybridRecommendations,
  getColdStartRecommendations,
};
