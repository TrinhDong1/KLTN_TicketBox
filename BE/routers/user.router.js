const express = require("express");
const router = express.Router();

const {
  login,
  create,
  createOrganizer,
  verifyOTP,
  resendOTP,
  list,
  deleteUser,
  findUser,
  update,
  loginGoogle,
} = require("../controllers/user.controller");

const asyncMiddelware = require("../middlewares/asyncHandle");

router.route("/login").post(asyncMiddelware(login));
router.route("/login-google").post(asyncMiddelware(loginGoogle));
router.route("/:id").put(asyncMiddelware(update));
router.route("/:id").delete(asyncMiddelware(deleteUser));
router.route("/:id").get(asyncMiddelware(findUser));
router.route("/").post(asyncMiddelware(create));
router.route("/").get(asyncMiddelware(list));

// Routes mới cho Organizer
router.route("/register-organizer").post(asyncMiddelware(createOrganizer));
router.route("/verify-otp").post(asyncMiddelware(verifyOTP));
router.route("/resend-otp").post(asyncMiddelware(resendOTP));

module.exports = router;
