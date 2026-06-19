const { searchGoods } = require("../../../utils/api");

Page({
  data: {
    keyword: "",
    categoryIndex: 0,
    categoryList: [
      { id: 0, name: "全部" },
      { id: 1, name: "教材" },
      { id: 2, name: "数码" },
      { id: 3, name: "生活" },
      { id: 4, name: "运动" },
    ],
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

  onCategoryTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (index === this.data.categoryIndex) return;
    this.setData({ categoryIndex: index }, () => {
      const kw = this.data.keyword.trim();
      if (kw) this.doSearch(kw);
    });
  },

  async doSearch(kw) {
    const { categoryIndex, categoryList } = this.data;
    const category = categoryList[categoryIndex].id;
    this.setData({ searching: true });

    let history = this.data.history.filter((h) => h !== kw);
    history.unshift(kw);
    if (history.length > 10) history = history.slice(0, 10);
    wx.setStorageSync("searchHistory", history);
    this.setData({ history });

    try {
      const res = await searchGoods(kw, category);
      if (res.code === 200) {
        const rawList = (res.data || []).map((item) => ({
          ...item,
          id: item._id || item.id,
          image: item.images && item.images.length > 0 ? item.images[0] : "",
          price: String(item.price || 0),
        }));
        const resultList = await this.convertCloudImages(rawList);
        this.setData({ resultList, searching: false });
      } else {
        this.setData({ searching: false });
      }
    } catch (e) {
      this.setData({ searching: false });
    }
  },

  /** 批量将列表中商品首图的 cloud:// fileID 转为临时 HTTPS URL */
  async convertCloudImages(list) {
    const cloudIds = list
      .map((item) => item.image)
      .filter((url) => url && url.startsWith("cloud://"));
    if (cloudIds.length === 0) return list;
    try {
      const result = await wx.cloud.getTempFileURL({ fileList: cloudIds });
      const map = {};
      result.fileList.forEach((f) => {
        if (f.tempFileURL) map[f.fileID] = f.tempFileURL;
      });
      return list.map((item) => ({
        ...item,
        image: map[item.image] || item.image,
      }));
    } catch (e) {
      return list;
    }
  },

  onGoodsTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: "/pages/content/detail/detail?id=" + id });
  },
});
