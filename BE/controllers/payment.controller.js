const paymentModel = require("../models/payment.model");
const eventModel = require("../models/event.model");
const nodemailer = require("nodemailer");
const userModel = require("../models/user.model");
const vnpayService = require("../services/vnpay.service");

module.exports = {
  list: async (req, res) => {
    try {
      const data = await paymentModel
        .find({})
        .populate("user")
        .populate({
          path: "event",
          populate: {
            path: "owner",
          },
        });
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },

  create: async (req, res) => {
    try {
      const data = await paymentModel.create(req.body);
      const user = await userModel.findOne({ _id: req.body.user });
      const event = await eventModel.findOne({ _id: req.body.event });
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "trieuphucdinh1506@gmail.com", // Your email address
          pass: "hwccnfkgecvdkryw", // Password (for gmail, your app password)
        },
      });
      if (user?.email) {
        await transporter.sendMail({
          from: "trieuphucdinh1506@gmail.com",
          to: user?.email,
          subject: "Đặt vé thành công",
          html: `
    <h1>Sự kiện ${event?.name}</h1>
    <p>Tên vé: ${req.body.name}</p>
    <p>Giá vé: ${req.body.price}</p>
    <p>Số lượng: ${req.body.number}</p>
    <p>Thanh toán: ${req.body.amount}</p>
    `,
        });
      }
      res.status(201).json(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  getByUserId: async (req, res) => {
    try {
      const data = await paymentModel
        .find({ user: req.params.id })
        .populate("user")
        .populate("event");
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },

  getByEventId: async (req, res) => {
    try {
      const data = await paymentModel
        .find({
          event: { $in: req.body?.listIdEvent },
        })
        .populate("user")
        .populate("event");
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },
  countTicketSell: async (req, res) => {
    try {
      const payments = await paymentModel.find({
        name: req.body.name,
        event: req.body.eventId,
        isPending: { $ne: true }, // Only count completed payments, not pending ones
      });

      let totalNumber = 0;

      payments.forEach((payment) => {
        totalNumber += Number(payment.number);
      });

      res.status(201).json({ totalNumber });
    } catch (error) {
      throw error;
    }
  },
  // Phương thức tạo URL thanh toán VNPay
  createVnPayUrl: async (req, res) => {
    try {
      // Lưu thông tin thanh toán tạm thời
      const paymentData = await paymentModel.create({
        ...req.body,
        isPending: true,
        status: "pending",
      });

      // Lấy IP của người dùng
      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      // Tạo URL thanh toán VNPay
      const vnpayResponse = await vnpayService.createPaymentUrl(
        paymentData,
        ipAddr
      );

      res.status(200).json({
        success: true,
        paymentUrl: vnpayResponse.url,
        paymentId: paymentData._id,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo URL thanh toán VNPay",
        error: error.message,
      });
    }
  },

  // Phương thức xử lý kết quả trả về từ VNPay
  vnpayReturn: async (req, res) => {
    try {
      const vnpParams = req.query;

      // Xác thực thông tin trả về từ VNPay
      const verifyResult = vnpayService.verifyReturnUrl(vnpParams);

      if (verifyResult.isSuccess) {
        // Lấy thông tin từ vnp_OrderInfo
        const orderInfo = JSON.parse(vnpParams.vnp_OrderInfo);

        // Tìm và cập nhật trạng thái thanh toán
        const paymentId = vnpParams.vnp_TxnRef;
        const payment = await paymentModel.findById(paymentId);

        if (payment) {
          // Check if payment is successful
          if (vnpParams.vnp_ResponseCode === "00") {
            // Payment successful, update payment status
            payment.isPending = false;
            payment.status = "completed";
          } else {
            // Payment failed or canceled, mark payment as failed
            payment.isPending = false;
            payment.status = "failed";
          }

          payment.paymentMethod = "vnpay";
          payment.vnpayTransactionId = vnpParams.vnp_TransactionNo;
          payment.vnpayTransactionStatus = vnpParams.vnp_ResponseCode;
          payment.vnpayPayDate = vnpParams.vnp_PayDate;

          await payment.save();

          // Lấy thông tin user và event
          const user = await userModel.findOne({ _id: payment.user });
          const event = await eventModel.findOne({ _id: payment.event });

          // Gửi email thông báo
          if (user?.email && vnpParams.vnp_ResponseCode === "00") {
            let transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              port: 465,
              secure: true,
              auth: {
                user: "trieuphucdinh1506@gmail.com", // Your email address
                pass: "hwccnfkgecvdkryw", // Password (for gmail, your app password)
              },
            });

            await transporter.sendMail({
              from: "trieuphucdinh1506@gmail.com",
              to: user?.email,
              subject: "Đặt vé thành công với VNPay",
              html: `
                <h1>Sự kiện ${event?.name}</h1>
                <p>Tên vé: ${payment.name}</p>
                <p>Giá vé: ${payment.price}</p>
                <p>Số lượng: ${payment.number}</p>
                <p>Thanh toán: ${payment.amount}</p>
                <p>Phương thức thanh toán: VNPay</p>
                <p>Mã giao dịch VNPay: ${vnpParams.vnp_TransactionNo}</p>
                <p>Ngày thanh toán: ${vnpParams.vnp_PayDate}</p>
              `,
            });
          }

          // Chuyển hướng về trang thành công hoặc thất bại
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:3000";

          if (vnpParams.vnp_ResponseCode === "00") {
            res.redirect(
              `${frontendUrl}/payment-success?paymentId=${paymentId}`
            );
          } else {
            res.redirect(
              `${frontendUrl}/payment-failed?paymentId=${paymentId}&error=${vnpParams.vnp_ResponseCode}`
            );
          }
        } else {
          res.redirect(`${frontendUrl}/payment-failed?error=payment_not_found`);
        }
      } else {
        // Thanh toán thất bại hoặc bị hủy
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        res.redirect(`${frontendUrl}/payment-failed?error=verification_failed`);
      }
    } catch (error) {
      console.log(error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/payment-failed?error=server_error`);
    }
  },

  // Phương thức kiểm tra trạng thái thanh toán VNPay
  checkVnPayStatus: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await paymentModel.findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thanh toán",
        });
      }

      // For payments still in pending state after a certain time, we should mark them as failed
      // This prevents tickets from being blocked indefinitely
      if (payment.isPending) {
        const createdAt = new Date(payment.createdAt);
        const now = new Date();
        const timeDifferenceMinutes = (now - createdAt) / (1000 * 60);

        // If payment has been pending for more than 30 minutes, mark it as failed
        if (timeDifferenceMinutes > 30) {
          payment.isPending = false;
          payment.status = "expired";
          await payment.save();
        }
      }

      res.status(200).json({
        success: true,
        payment: payment,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra trạng thái thanh toán",
        error: error.message,
      });
    }
  },
  // Phương thức để hủy một thanh toán đang chờ xử lý
  cancelPendingPayment: async (req, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await paymentModel.findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thanh toán",
        });
      }

      // Chỉ có thể hủy thanh toán đang ở trạng thái chờ xử lý
      if (!payment.isPending) {
        return res.status(400).json({
          success: false,
          message:
            "Thanh toán này không thể hủy vì không ở trạng thái chờ xử lý",
        });
      }

      // Cập nhật trạng thái thanh toán thành hủy
      payment.isPending = false;
      payment.status = "failed";

      await payment.save();

      res.status(200).json({
        success: true,
        message: "Đã hủy thanh toán thành công",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi hủy thanh toán",
        error: error.message,
      });
    }
  },
};
