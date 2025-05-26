const express = require("express");
const router = express.Router();

const {
  create,
  myEvent,
  listApproveEvent,
  approveEvent,
  listEvent,
  getEventById,
  getEventByUserId,
  deleteEvent,
  updateEvent,
} = require("../controllers/event.controller");

const asyncMiddelware = require("../middlewares/asyncHandle");
const {
  getEventTicketDetail,
  getTicketStats,
} = require("../controllers/ticketStats.controller");

router.route("/my-event/:id").get(asyncMiddelware(myEvent));
router.route("/approve-event/:id").put(asyncMiddelware(approveEvent));
router.route("/approve-event").get(asyncMiddelware(listApproveEvent));
router.route("/search").get(asyncMiddelware(listEvent));
router.route("/user/:id").get(asyncMiddelware(getEventByUserId));
router.route("/ticket-stats").get(asyncMiddelware(getTicketStats));
router.route("/ticket-stats/:id").get(asyncMiddelware(getEventTicketDetail));

router.route("/:id").get(asyncMiddelware(getEventById));
router.route("/:id").delete(asyncMiddelware(deleteEvent));
router.route("/:id").put(asyncMiddelware(updateEvent));
router.route("/").post(asyncMiddelware(create));

module.exports = router;
