const { updateOrderStatus } = require("../../../utils/api");

Page({
  data: {
    orderId: "",
    price: "0",
    title: "",
    paying: false,
  },

  onLoad(options) {
    this.setData({
      orderId: options.orderId || "",
      price: options.price || "0",
      title: options.title || "",
    });
  },

  async onPay() {
    const { orderId, price, title } = this.data;
    if (!orderId) {
      return wx.showToast({ title: "订单信息异常", icon: "none" });
    }

    this.setData({ paying: true });

    try {
      // 调用 wxpayFunctions 云函数下单
      const res = await wx.cloud.callFunction({
        name: "XXXX",
        data: {
          type: "XXXX",
          orderId: orderId,
          price: price,
          title: title,
        },
      });

      console.log("下单结果: ", res);
      const paymentData = res.result?.data;

      if (!paymentData) {
        throw new Error("获取预付订单信息失败");
      }

      // 唤起微信支付组件，完成支付
      const payResult = await new Promise((resolve, reject) => {
        wx.requestPayment({
          timeStamp: paymentData.timeStamp,
          nonceStr: paymentData.nonceStr,
          package: paymentData.packageVal,
          paySign: paymentData.paySign,
          signType: "RSA", // 该参数为固定值
          success(res) {
            resolve(res);
          },
          fail(err) {
            reject(err);
          },
        });
      });

      console.log("唤起支付组件成功：", payResult);

      // 支付成功后更新订单状态
      await updateOrderStatus(orderId, "paid");

      wx.showToast({ title: "支付成功", icon: "success" });
      setTimeout(() => {
        wx.switchTab({ url: "/pages/content/index/index" });
      }, 1500);
    } catch (err) {
      console.error("支付失败：", err);
      wx.showToast({ title: err.errMsg || "支付失败", icon: "none" });
    } finally {
      this.setData({ paying: false });
    }
  },
});
