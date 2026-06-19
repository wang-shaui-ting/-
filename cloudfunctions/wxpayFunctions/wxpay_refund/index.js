/**
 * 微信支付 - 申请退款
 */
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数
exports.main = async (event, context) => {
  const res = await cloud.callFunction({
    name: "XXXX",
    data: {
      name: "XXXX",
      data: {
        transaction_id: "XXXX", // 微信订单号
        out_refund_no: "XXXX", // 商户内部退款单号
        amount: {
          refund: 1, // 退款金额
          total: 1, // 原订单金额,
          currency: "CNY",
        },
      },
    },
  });
  return res.result;
};
