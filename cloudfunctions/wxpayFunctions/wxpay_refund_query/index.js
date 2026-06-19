/**
 * 微信支付 - 通过商户退款单号查询单笔退款
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
        params: {
          out_refund_no: "XXXX", // 填入商户退款单号
        },
      },
    },
  });
  return res.result;
};
