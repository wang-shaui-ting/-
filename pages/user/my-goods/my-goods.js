const { getMyGoods, removeGoods } = require("../../../utils/api");

Page({
  data: {
    goodsList: [],
    loading: true,
  },

  onShow() {
    this.loadMyGoods();
  },

  loadMyGoods() {
    this.setData({ loading: true });
    getMyGoods()
      .then((res) => {
        if (res.code === 200) {
          const goodsList = (res.data || []).map((item) => ({
            ...item,
            id: item._id || item.id,
            image: item.images && item.images.length > 0 ? item.images[0] : "",
            price: String(item.price || 0),
          }));
          this.setData({ goodsList, loading: false });
        } else {
          this.setData({ loading: false });
        }
      })
      .catch(() => this.setData({ loading: false }));
  },

  onPublishTap() {
    wx.switchTab({ url: "/pages/goods/publish/publish" });
  },

  onEditTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: "/pages/goods/publish/publish?id=" + id });
  },

  onDeleteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除",
      content: "删除后无法恢复，确定要删除这个商品吗？",
      success: (res) => {
        if (res.confirm) {
          removeGoods(id)
            .then((res) => {
              if (res.code === 200) {
                wx.showToast({ title: "已删除", icon: "success" });
                this.loadMyGoods();
              } else {
                wx.showToast({ title: "删除失败", icon: "none" });
              }
            })
            .catch(() => wx.showToast({ title: "删除失败", icon: "none" }));
        }
      },
    });
  },

  onGoodsTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: "/pages/content/detail/detail?id=" + id });
  },
});
