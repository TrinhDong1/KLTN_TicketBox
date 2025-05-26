const express = require("express");
const router = express.Router();

const {
  create,
  list,
  getByUserId,
  getByEventId,
  countTicketSell,
  createVnPayUrl,
  vnpayReturn,
  checkVnPayStatus,
  cancelPendingPayment,
} = require("../controllers/payment.controller");

const asyncMiddelware = require("../middlewares/asyncHandle");

router.route("/").post(asyncMiddelware(create));
router.route("/").get(asyncMiddelware(list));
router.route("/user/:id").get(asyncMiddelware(getByUserId));
router.route("/event").post(asyncMiddelware(getByEventId));
router.route("/count-ticket-sell").post(asyncMiddelware(countTicketSell));

// VNPay routes
router.route("/create-vnpay-url").post(asyncMiddelware(createVnPayUrl));
router.route("/vnpay-return").get(asyncMiddelware(vnpayReturn));
router
  .route("/check-vnpay-status/:paymentId")
  .get(asyncMiddelware(checkVnPayStatus));

// Route for canceling a pending payment
router
  .route("/cancel-payment/:paymentId")
  .post(asyncMiddelware(cancelPendingPayment));

module.exports = router;
