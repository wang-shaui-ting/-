const { getGoodsDetail } = require("../../../utils/api");

Page({
  data: {
    favList: [],
    loading: true,
  },

  onShow() {
    this.loadFavorites();
  },

  async loadFavorites() {
    this.setData({ loading: true });
    const favIds = wx.getStorageSync("favGoods") || [];
    if (favIds.length === 0) {
      this.setData({ favList: [], loading: false });
      return;
    }

    try {
      const list = [];
      for (const id of favIds) {
        try {
          const res = await getGoodsDetail(id);
          if (res.code === 200) {
            const item = res.data;
            list.push({
              ...item,
              id: item._id || item.id,
              image:
                item.images && item.images.length > 0 ? item.images[0] : "",
              price: String(item.price || 0),
            });
          }
        } catch (e) {
          // 单个商品加载失败跳过
        }
      }
      this.setData({ favList: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onGoodsTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: "/pages/content/detail/detail?id=" + id });
  },
});
