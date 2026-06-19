const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { orderId, price, title, openid } = event;
  const db = cloud.database();

  try {
    // 微信支付统一下单
    const payResult = await cloud.cloudPay.unifiedOrder({
      body: title || "校园二手商品",
      outTradeNo: orderId,
      spbillCreateIp: "127.0.0.1",
      subMchId: "", // 子商户号，服务商模式下使用
      totalFee: Math.round(parseFloat(price) * 100), // 金额单位为分
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: "cloudPay",
      tradeType: "JSAPI",
      openid: openid,
    });

    return { code: 200, data: payResult };
  } catch (err) {
    console.error("cloudPay error:", err);
    return { code: 500, msg: "支付下单失败" };
  }
};
