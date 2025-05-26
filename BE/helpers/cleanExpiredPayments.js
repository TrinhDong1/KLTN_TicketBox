const paymentModel = require("../models/payment.model");

/**
 * Helper function to clean up expired pending payments
 * This should be called periodically to prevent tickets from being blocked indefinitely
 * @param {Number} expiryMinutes - Number of minutes after which a pending payment is considered expired
 * @returns {Promise<Number>} - Number of expired payments cleaned up
 */
const cleanExpiredPayments = async (expiryMinutes = 30) => {
  try {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - expiryMinutes);

    // Find and update all expired pending payments
    const result = await paymentModel.updateMany(
      {
        isPending: true,
        createdAt: { $lt: expiryTime },
      },
      {
        $set: {
          isPending: false,
          status: "expired",
        },
      }
    );

    console.log(`Cleaned up ${result.modifiedCount} expired payments`);
    return result.modifiedCount;
  } catch (error) {
    console.error("Error cleaning up expired payments:", error);
    throw error;
  }
};

module.exports = cleanExpiredPayments;
