/**
 * 微信支付 - 根据商户订单号查询订单
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
        // 请输入实际商户订单号
        out_trade_no: "XXXX",
      },
    },
  });
  return res.result;
};
