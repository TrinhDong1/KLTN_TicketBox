const userRouter = require("./user.router");
const eventRouter = require("./event.router");
const paymentRouter = require("./payment.router");
const recommendationRouter = require("./recommendation.router");
const ratingRouter = require("./rating.router");

const errorHandle = require("../middlewares/errorHandle");

module.exports = (app) => {
  app.use("/api/user", userRouter);
  app.use("/api/event", eventRouter);
  app.use("/api/payment", paymentRouter);
  app.use("/api/recommendations", recommendationRouter);
  app.use("/api/ratings", ratingRouter);

  app.use(errorHandle);
};
