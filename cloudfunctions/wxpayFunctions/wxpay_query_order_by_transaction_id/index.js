/**
 * 微信支付 - 微信支付订单号查询订单
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
        // 请输入实际微信支付订单号
        transaction_id: "XXXX",
      },
    },
  });
  return res.result;
};
