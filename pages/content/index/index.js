const { getGoodsList } = require("../../../utils/api");

Page({
  data: {
    statusBarHeight: 20,
    qrcodeUrl: "", // 小程序码图片地址
    showQrcode: false, // 是否展示弹层
    qrcodeLoading: false, // 生成中
    /*
     * 公告栏内容（数组，每条一条公告，支持横向滚动）
     * 如需新增/修改公告，直接编辑此数组即可
     */
    noticeList: [
      "欢迎来到校园二手交易广场！当前版本为早期版本，所有使用的同学们都是原始股东，后续会一直更新这个小程序版本，有很多不足的地方微信发给我，会在一次一次的更新中开发！",
      "💡 发布商品时请上传清晰实拍图片哦",
    ],
    /** 公告栏跑马灯拼接文本（noticeList 用分隔符拼接成的单行文字） */
    noticeMarqueeText: "",
    categoryIndex: 0,
    categoryList: [
      { id: 0, name: "全部" },
      { id: 1, name: "教材" },
      { id: 2, name: "数码" },
      { id: 3, name: "生活" },
      { id: 4, name: "运动" },
    ],
    goodsList: [],
    loading: false,
    hasMore: true,
    page: 1,
    total: 0,
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const { noticeList } = this.data;
    // 将公告数组用分隔符拼接成跑马灯单行文本
    const noticeMarqueeText = noticeList.join("   ·   ");
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      noticeMarqueeText,
    });
    this._firstLoad = true;
    this.loadGoods();
  },

  onShow() {
    // 首次进入页面时 onShow 紧跟在 onLoad 之后，跳过以避免重复请求
    if (this._firstLoad) {
      this._firstLoad = false;
      return;
    }
    // 从其他页面返回时刷新列表
    this.setData({ page: 1 });
    this.loadGoods();
  },

  async loadGoods() {
    const { page, categoryIndex, categoryList } = this.data;
    const category = categoryList[categoryIndex].id;
    this.setData({ loading: true });
    try {
      const res = await getGoodsList({ category, page, pageSize: 12 });
      if (res.code === 200) {
        const rawList = (res.data.list || []).map((item) => ({
          ...item,
          id: item._id || item.id,
          image: item.images && item.images.length > 0 ? item.images[0] : "",
          price: String(item.price || 0),
        }));
        // 把 cloud:// 图片转为临时 HTTPS 链接，列表才能正常显示
        const list = await this.convertCloudImages(rawList);
        const goodsList = page === 1 ? list : [...this.data.goodsList, ...list];
        this.setData({
          goodsList,
          total: res.data.total,
          hasMore: goodsList.length < res.data.total,
          loading: false,
        });
      } else {
        this.setData({ loading: false });
      }
    } catch (e) {
      this.setData({ loading: false });
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

  onCategoryTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (index === this.data.categoryIndex) return;
    this.setData({ categoryIndex: index, page: 1, goodsList: [] }, () =>
      this.loadGoods(),
    );
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
    wx.navigateTo({ url: "/pages/content/search/search" });
  },

  onGoodsTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: "/pages/content/detail/detail?id=" + id });
  },

  // 小程序码入口
  onQrcodeTap() {
    const cached = wx.getStorageSync("qrcode_url");
    if (cached) {
      this.setData({ qrcodeUrl: cached, showQrcode: true });
      return;
    }
    this.generateQrcode();
  },

  // 生成小程序码
  generateQrcode() {
    if (this.data.qrcodeLoading) return;
    this.setData({ qrcodeLoading: true, showQrcode: true });

    wx.cloud.callFunction({
      name: "XXXX",
      data: {
        name: "XXXX",
        data: {
          path: "pages/content/index/index",
          width: 430,
          env_version: "release",
        },
      },
      success: (res) => {
        const url = res.result?.result;
        if (url) {
          wx.setStorageSync("qrcode_url", url);
          this.setData({ qrcodeUrl: url, qrcodeLoading: false });
        } else {
          wx.showToast({ title: "生成失败，请重试", icon: "none" });
          this.setData({ showQrcode: false, qrcodeLoading: false });
        }
      },
      fail: () => {
        wx.showToast({ title: "获取小程序码失败", icon: "none" });
        this.setData({ showQrcode: false, qrcodeLoading: false });
      },
    });
  },

  // 关闭弹层
  onCloseQrcode() {
    this.setData({ showQrcode: false });
  },
});
