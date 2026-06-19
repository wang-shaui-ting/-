const { getGoodsDetail } = require("../../../utils/api");

Page({
  data: {
    goodsId: null,
    goods: {},
    images: [],
    seller: {},
    isFaved: false,
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ goodsId: id });
    this.loadDetail(id);
  },

  loadDetail(id) {
    getGoodsDetail(id)
      .then((res) => {
        if (res.code === 200) {
          const d = res.data;
          wx.setNavigationBarTitle({ title: (d.title || "商品").slice(0, 12) });
          this.setData({
            goods: {
              id: d._id || d.id,
              title: d.title,
              price: String(d.price || 0),
              desc: d.description || "",
              tags: d.tags || [],
              category: d.category,
            },
            images: d.images && d.images.length > 0 ? d.images : [],
            seller: {
              avatar: d.seller_avatar || "",
              nickname: d.seller_name || "校园用户",
              campus: d.seller_campus || "",
            },
          });
          this.checkFavStatus(id);
        }
      })
      .catch(() => wx.showToast({ title: "加载失败", icon: "none" }));
  },

  checkFavStatus(id) {
    const favs = wx.getStorageSync("favGoods") || [];
    this.setData({ isFaved: favs.includes(id) });
  },

  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({ urls, current });
  },

  onFavTap() {
    const id = this.data.goodsId;
    let favs = wx.getStorageSync("favGoods") || [];
    const isFaved = !this.data.isFaved;
    if (isFaved) {
      if (!favs.includes(id)) favs.push(id);
      wx.showToast({ title: "已收藏", icon: "none" });
    } else {
      favs = favs.filter((fid) => fid !== id);
      wx.showToast({ title: "已取消收藏", icon: "none" });
    }
    wx.setStorageSync("favGoods", favs);
    this.setData({ isFaved });
  },

  onShareGoodsTap() {
    wx.showToast({ title: "分享成功", icon: "none" });
  },

  onContactTap() {
    wx.showModal({
      title: "联系卖家",
      content: "确认要私信该卖家吗？",
      success(res) {
        if (res.confirm) wx.showToast({ title: "已发送私信", icon: "none" });
      },
    });
  },

  onWantTap() {
    wx.showModal({
      title: "我想要",
      content: "确认想要购买此商品？将通知卖家与你联系。",
      success(res) {
        if (res.confirm) wx.showToast({ title: "已通知卖家", icon: "success" });
      },
    });
  },
});
