const { getGoodsList } = require("../../../utils/api");

Page({
  data: {
    keyword: "",
    history: [],
    hotWords: ["教材", "平板", "键盘", "四级", "台灯", "羽毛球"],
    resultList: [],
    searching: false,
  },

  onLoad() {
    const history = wx.getStorageSync("searchHistory") || [];
    this.setData({ history });
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
    if (!e.detail.value) this.setData({ resultList: [] });
  },

  onSearch(e) {
    const kw = (e.detail.value || this.data.keyword).trim();
    if (!kw) return;
    this.doSearch(kw);
  },

  onClear() {
    this.setData({ keyword: "", resultList: [] });
  },

  onCancel() {
    wx.navigateBack();
  },

  onHistoryTap(e) {
    const kw = e.detail.text;
    this.setData({ keyword: kw });
    this.doSearch(kw);
  },

  onClearHistory() {
    wx.removeStorageSync("searchHistory");
    this.setData({ history: [] });
  },

  doSearch(kw) {
    this.setData({ searching: true });

    let history = this.data.history.filter((h) => h !== kw);
    history.unshift(kw);
    if (history.length > 10) history = history.slice(0, 10);
    wx.setStorageSync("searchHistory", history);
    this.setData({ history });

    getGoodsList({ page: 1, pageSize: 50 })
      .then((res) => {
        if (res.code === 200) {
          const lower = kw.toLowerCase();
          const resultList = (res.data.list || [])
            .filter(
              (item) => item.title && item.title.toLowerCase().includes(lower),
            )
            .map((item) => ({
              ...item,
              image:
                item.images && item.images.length > 0 ? item.images[0] : "",
              price: String(item.price || 0),
            }));
          this.setData({ resultList, searching: false });
        } else {
          this.setData({ searching: false });
        }
      })
      .catch(() => this.setData({ searching: false }));
  },

  onGoodsTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: "/pages/goods/detail/detail?id=" + id });
  },
});
