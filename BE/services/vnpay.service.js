const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");

class VnPayService {
  constructor() {
    this.vnpay = new VNPay({
      tmnCode: "NO9UFAY8",
      secureSecret: "QD1DHE0C645DMMDE25NT97YSJ1I8YDC3",
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });
  }
  createPaymentUrl(paymentData, ipAddr) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpayUrl = this.vnpay.buildPaymentUrl({
      vnp_Amount: parseInt(paymentData.amount),
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: paymentData._id,
      vnp_OrderInfo: JSON.stringify({
        eventId: paymentData.event,
        userId: paymentData.user,
        ticketName: paymentData.name,
        ticketPrice: paymentData.price,
        ticketNumber: paymentData.number,
        amount: paymentData.amount,
      }),
      vnp_Locale: VnpLocale.VN,
      vnp_ReturnUrl: "http://localhost:8000/api/payment/vnpay-return",
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return {
      url: vnpayUrl,
    };
  }

  verifyReturnUrl(vnpParams) {
    return this.vnpay.verifyReturnUrl(vnpParams);
  }
}

module.exports = new VnPayService();
