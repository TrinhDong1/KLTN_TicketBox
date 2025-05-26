const nodemailer = require("nodemailer");

// Cấu hình transporter cho nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "thanhquay113@gmail.com", // Thay thế bằng email thật
    pass: process.env.EMAIL_PASSWORD || "ygdv izrf czui ddeq", // Thay thế bằng mật khẩu bằng mã vừa lấy nha
  },
});
// 	Bật xác minh 2 bước (2FA) cho tài khoản Gmail tại:
// 👉 https://myaccount.google.com/security

// 	Vào trang tạo App Password:
//👉 https://myaccount.google.com/apppasswords
/**
 * Gửi email chứa mã OTP cho người dùng
 * @param {string} email - Email của người nhận
 * @param {string} otp - Mã OTP
 */
const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: email,
      subject: "Mã xác nhận đăng ký tài khoản",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2dc275; text-align: center;">Mã xác nhận đăng ký tài khoản</h2>
          <p>Xin chào,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống của chúng tôi. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP dưới đây:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>Mã OTP này sẽ hết hạn sau 10 phút.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

module.exports = {
  sendOtpEmail,
};
