const userModel = require("../models/user.model");
const ErrorResponse = require("../helpers/ErrorResponse");
const { sendOtpEmail } = require("../services/email.service");
const crypto = require("crypto");

module.exports = {
  list: async (req, res) => {
    try {
      let user = await userModel.find({});
      // .populate("major")
      // .select(["-updatedAt", "-createdAt"])
      // .sort({ createdAt: -1 });
      return res.status(200).json(user);
    } catch (error) {
      throw error;
    }
  },
  listTeacherReview: async (req, res) => {
    try {
      const data = await userModel
        .find({ major: req.params.id, role: 1 })
        .populate("major");
      res.status(201).json(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  getListTeacher: async (req, res) => {
    try {
      let user = await userModel
        .find({ role: { $in: [1, 2] } })
        .populate("major");
      return res.status(200).json(user);
    } catch (error) {
      throw error;
    }
  },
  findUser: async (req, res) => {
    try {
      let user = await userModel
        .findById(req.params.id)
        .select(["-updatedAt", "-createdAt"]);
      return res.status(200).json(user);
    } catch (error) {
      throw error;
    }
  },
  login: async (req, res) => {
    try {
      let { ...body } = req.body;
      let user = await userModel
        .findOne({
          phone: body.phone,
          password: body.password,
        })
        .select("-password");

      if (!user) {
        throw new ErrorResponse(
          404,
          "Số điện thoại hoặc mật khẩu không chính xác"
        );
      }
      if (user.status?.trim().toLowerCase() === "banned") {
        return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
      }
      if (!user.isVerified && user.role === 2) {
        throw new ErrorResponse(
          404,
          "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản."
        );
      }

      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  loginGoogle: async (req, res) => {
    try {
      let { ...body } = req.body;
      let user = await userModel
        .findOne({
          email: body.email,
        })
        .populate("major")
        .select("-password");

      if (!user) {
        throw new ErrorResponse(404, "Email chưa được đăng kí");
      }
      if (user.status?.trim().toLowerCase() != "active") {
        throw new ErrorResponse(403, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
      }

      if (!user.isVerified && user.role === 2) {
        throw new ErrorResponse(
          403,
          "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản."
        );
      }

      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  create: async (req, res) => {
    try {
      let { ...body } = req.body;

      let phoneExists = await userModel.findOne({
        phone: body.phone,
      });

      if (phoneExists && phoneExists.isVerified) {
        throw new ErrorResponse(404, "Số điện thoại đã tồn tại");
      }

      if (phoneExists && !phoneExists.isVerified) {
        await userModel.findByIdAndDelete(phoneExists._id);
      }

      if (body.email) {
        const emailExists = await userModel.findOne({ email: body.email });
        if (emailExists && emailExists.isVerified) {
          throw new ErrorResponse(404, "Email đã tồn tại");
        }

        if (emailExists && !emailExists.isVerified) {
          await userModel.findByIdAndDelete(emailExists._id);
        }
      }

      body.role = 0;
      body.status = "active";
      body.isVerified = true;
      body.status = "active";

      const data = await userModel.create(body);
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  }, // Đăng ký tài khoản Organizer
  createOrganizer: async (req, res) => {
    try {
      let { ...body } = req.body;

      let phoneExists = await userModel.findOne({
        phone: body.phone,
      });

      if (phoneExists && phoneExists.isVerified) {
        throw new ErrorResponse(404, "Số điện thoại đã tồn tại");
      }

      if (phoneExists && !phoneExists.isVerified) {
        await userModel.findByIdAndDelete(phoneExists._id);
      }

      if (!body.email) {
        throw new ErrorResponse(
          400,
          "Email là bắt buộc đối với tài khoản Organizer"
        );
      }

      const emailExists = await userModel.findOne({ email: body.email });
      if (emailExists && emailExists.isVerified) {
        throw new ErrorResponse(404, "Email đã tồn tại");
      }

      if (emailExists && !emailExists.isVerified) {
        await userModel.findByIdAndDelete(emailExists._id);
      }

      const otp = crypto.randomInt(100000, 999999).toString();

      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10);

      const newUser = await userModel.create({
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password,
        role: 2, // Organizer
        isVerified: false,
        otp: otp,
        otpExpires: otpExpires,
        status: "active",
        
      });

      await sendOtpEmail(body.email, otp);

      res.status(201).json({
        _id: newUser._id,
        name: body.name,
        email: body.email,
        phone: body.phone,
        message:
          "Mã OTP đã được gửi đến email của bạn. Vui lòng xác minh để hoàn tất đăng ký.",
      });
    } catch (error) {
      console.error(error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Có lỗi xảy ra khi đăng ký tài khoản.",
      });
    }
  },
  update: async (req, res) => {
    try {
      await userModel.findByIdAndUpdate(req.params.id, {
        ...req.body,
      });
      const user = await userModel.findById(req.params.id);
      res.status(201).json(user);
    } catch (error) {
      throw error;
    }
  },
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;

      const ratingModel = require("../models/rating.model");

      await ratingModel.deleteMany({ user: userId });

      await userModel.findOneAndDelete({ _id: userId });

      res.status(201).json("Xóa user thành công");
    } catch (error) {
      throw error;
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const pendingUser = await userModel.findOne({
        email: email,
        isVerified: false,
        otp: { $exists: true },
      });

      if (!pendingUser) {
        throw new ErrorResponse(
          400,
          "Không tìm thấy tài khoản đăng ký hoặc tài khoản đã được xác thực"
        );
      }

      if (pendingUser.otp !== otp) {
        throw new ErrorResponse(400, "Mã OTP không chính xác");
      }

      const otpExpires = new Date(pendingUser.otpExpires);
      if (otpExpires < new Date()) {
        throw new ErrorResponse(400, "Mã OTP đã hết hạn");
      }

      await userModel.findByIdAndUpdate(pendingUser._id, {
        isVerified: true,
        otp: undefined,
        otpExpires: undefined,
      });

      const updatedUser = await userModel
        .findById(pendingUser._id)
        .select("-password -otp -otpExpires");

      res.status(200).json({
        message: "Đăng ký tài khoản thành công",
        user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Có lỗi xảy ra khi xác minh OTP",
      });
    }
  },
  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      const pendingUser = await userModel.findOne({
        email: email,
        isVerified: false,
        otp: { $exists: true },
      });

      if (!pendingUser) {
        throw new ErrorResponse(
          400,
          "Không tìm thấy tài khoản đăng ký hoặc tài khoản đã được xác thực"
        );
      }

      const otp = crypto.randomInt(100000, 999999).toString();

      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10);

      await userModel.findByIdAndUpdate(pendingUser._id, {
        otp: otp,
        otpExpires: otpExpires,
      });

      const emailSent = await sendOtpEmail(email, otp);

      if (!emailSent) {
        throw new ErrorResponse(500, "Không thể gửi email OTP");
      }

      res.status(200).json({
        message: "Mã OTP mới đã được gửi đến email của bạn",
      });
    } catch (error) {
      console.error(error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Có lỗi xảy ra khi gửi lại OTP",
      });
    }
  },
};
