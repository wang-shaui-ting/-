/**
 * 微信支付 - 下单
 * 接收前端传入的订单参数，调用云模板下单接口获取预付订单信息
 */
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  // 从 event 中获取前端传入的订单参数
  const { orderId, price, title } = event;
  const totalFee = Math.round(parseFloat(price) * 100); // 金额单位：分

  // 使用 orderId 作为商户订单号，确保唯一性
  const outTradeNo =
    orderId || Math.round(Math.random() * 10 ** 13) + Date.now();

  // 商户存储订单号到数据库，便于后续与微信侧订单号关联。例如使用云开发云存储能力：
  // db.collection('orders').add({ data: { outTradeNo } });

  const res = await cloud.callFunction({
    name: "XXXX",
    data: {
      name: "XXXX",
      data: {
        description: title || "<商品描述>",
        amount: {
          total: totalFee,
          currency: "CNY",
        },
        // 商户生成的订单号
        out_trade_no: outTradeNo,
        payer: {
          // 服务端云函数中直接获取当前用户openId
          openid: wxContext.OPENID,
        },
      },
    },
  });
  return res.result;
};
