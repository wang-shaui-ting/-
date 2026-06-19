const { getGoodsList } = require("../../../utils/api");

Page({
  data: {
    statusBarHeight: 20,
    goodsList: [],
    loading: false,
    hasMore: true,
    page: 1,
    total: 0,
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight });
    this.loadGoods();
  },

  loadGoods() {
    const { page } = this.data;
    this.setData({ loading: true });
    getGoodsList({ page, pageSize: 6 })
      .then((res) => {
        if (res.code === 200) {
          const list = (res.data.list || []).map((item) => ({
            ...item,
            image: item.images && item.images.length > 0 ? item.images[0] : "",
            price: String(item.price || 0),
          }));
          const goodsList =
            page === 1 ? list : [...this.data.goodsList, ...list];
          this.setData({
            goodsList,
            total: res.data.total,
            hasMore: goodsList.length < res.data.total,
            loading: false,
          });
        } else {
          this.setData({ loading: false });
        }
      })
      .catch(() => this.setData({ loading: false }));
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadGoods();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 }, () => this.loadGoods());
  },

  onSearchTap() {
    wx.navigateTo({ url: "/pages/goods/search/search" });
  },

  onMoreTap() {
    wx.showToast({ title: "加载中...", icon: "none" });
    this.setData({ page: this.data.page + 1 }, () => this.loadGoods());
  },

  onGoodsTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: "/pages/goods/detail/detail?id=" + id });
  },
});
