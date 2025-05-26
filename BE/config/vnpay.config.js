const express = require("express");
const app = express();
const port = 8000;
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");

app.post("/api/create-qr", async (req, res) => {
  const vnp = new VNPay({
    tmnCode: "NO9UFAY8",
    secureSecret: "QD1DHE0C645DMMDE25NT97YSJ1I8YDC3",
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: "SHA512",
    loggerFn: ignoreLogger,
  });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const vnpayResponse = await vnp.buildPaymentUrlPaymentUrl({
    vnp_Amout: findCart.totalPrice * 100,
    vnp_IpAddr: "127.0.0.1",
    vnp_TxnRef: findCart._id,
    vnp_OrderInfo: `${findCart._id}`,
    vnp_Locale: VnpLocale.VN,
    vnp_ReturnUrl: "http://localhost:8000/api/check-payment-vnpay",
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(tomorrow),
  });
  return res.status(201).json(vnpayResponse);
});

app.get("api/check-payment-vnpay", (req, res) => {
  // logic xử lý dữ liệu đơn hàng
  console.log(req.query);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
