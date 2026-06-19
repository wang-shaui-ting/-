const { createOrder } = require("../../../utils/api");

Page({
  data: {
    goods: {
      id: "",
      title: "",
      image: "",
      price: "0",
    },
    submitting: false,
  },

  onLoad(options) {
    const { id, title, image, price } = options;
    this.setData({
      goods: {
        id: id || "",
        title: title ? decodeURIComponent(title) : "未命名商品",
        image: image ? decodeURIComponent(image) : "",
        price: price || "0",
      },
    });
  },

  async onSubmit() {
    const { goods } = this.data;
    if (!goods.id) {
      return wx.showToast({ title: "商品信息异常", icon: "none" });
    }

    this.setData({ submitting: true });
    try {
      const res = await createOrder({
        goodsId: goods.id,
        goodsTitle: goods.title,
        goodsImage: goods.image,
        price: parseFloat(goods.price),
      });

      if (res.code === 200) {
        const orderId = res.data.id;
        wx.redirectTo({
          url: `/pages/order/pay/pay?orderId=${orderId}&price=${goods.price}&title=${goods.title}`,
        });
      } else {
        wx.showToast({ title: res.msg || "下单失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "下单失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
