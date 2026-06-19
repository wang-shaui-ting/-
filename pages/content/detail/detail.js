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

  async loadDetail(id) {
    try {
      const res = await getGoodsDetail(id);
      if (res.code === 200) {
        const d = res.data;
        wx.setNavigationBarTitle({ title: (d.title || "商品").slice(0, 12) });
        // 把 cloud:// 图片转成临时 HTTPS 链接，否则模拟器渲染 500
        const rawImages = d.images && d.images.length > 0 ? d.images : [];
        const images = await this.convertCloudUrls(rawImages);
        this.setData({
          goods: {
            id: d._id || d.id,
            title: d.title,
            price: String(d.price || 0),
            desc: d.description || "",
            tags: d.tags || [],
            category: d.category,
          },
          images,
          seller: {
            avatar: d.seller_avatar || "",
            nickname: d.seller_name || "校园用户",
            campus: d.seller_campus || "",
          },
        });
        this.checkFavStatus(id);
      }
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  /** 批量将 cloud:// fileID 数组转为临时 HTTPS URL */
  async convertCloudUrls(urls) {
    if (!urls || urls.length === 0) return [];
    const cloudIds = urls.filter((u) => u.startsWith("cloud://"));
    if (cloudIds.length === 0) return urls;
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: cloudIds });
      const map = {};
      res.fileList.forEach((f) => {
        if (f.tempFileURL) map[f.fileID] = f.tempFileURL;
      });
      return urls.map((u) => map[u] || u);
    } catch (e) {
      return urls;
    }
  },

  checkFavStatus(id) {
    const favs = wx.getStorageSync("favGoods") || [];
    this.setData({ isFaved: favs.includes(id) });
  },

  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    this.previewWithTempUrl(urls, current);
  },

  /** 将 cloud:// 文件 ID 转为临时 HTTPS 链接后再预览 */
  async previewWithTempUrl(fileIDs, current) {
    // 只处理 cloud:// 开头的，普通 URL 直接预览
    const cloudIds = fileIDs.filter((u) => u.startsWith("cloud://"));
    const normalUrls = fileIDs.filter((u) => !u.startsWith("cloud://"));
    if (cloudIds.length > 0) {
      try {
        const res = await wx.cloud.getTempFileURL({ fileList: cloudIds });
        const tempUrls = res.fileList
          .filter((f) => f.tempFileURL)
          .map((f) => f.tempFileURL);
        const allUrls = [...tempUrls, ...normalUrls];
        const cur =
          (current.startsWith("cloud://") &&
            res.fileList.find((f) => f.fileID === current)?.tempFileURL) ||
          current;
        wx.previewImage({ urls: allUrls, current: cur });
        return;
      } catch (e) {
        // 转换失败则降级直接预览
      }
    }
    wx.previewImage({ urls: fileIDs, current });
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

  onBuyTap() {
    const { goods, images } = this.data;
    const firstImage = images.length > 0 ? images[0] : "";
    wx.navigateTo({
      url: `/pages/order/confirm/confirm?id=${goods.id}&title=${encodeURIComponent(goods.title)}&image=${encodeURIComponent(firstImage)}&price=${goods.price}`,
    });
  },
});
