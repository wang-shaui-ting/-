const { uploadFile, contentSecCheck } = require("../../../utils/api");
const wantedApi = require("../../../utils/api/wanted");
const app = getApp();

Page({
  data: {
    content: "",
    minPrice: "",
    maxPrice: "",
    tags: [],
    tagInput: "",
    images: [],
    cloudImages: [],
    submitting: false,
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onMinPriceInput(e) {
    let value = e.detail.value;
    // 只允许数字和小数点
    value = value.replace(/[^\d.]/g, "");
    // 限制一个小数点
    const parts = value.split(".");
    if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
    // 小数点后最多2位
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + "." + parts[1].slice(0, 2);
    }
    this.setData({ minPrice: value });
  },

  onMaxPriceInput(e) {
    let value = e.detail.value;
    value = value.replace(/[^\d.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + "." + parts[1].slice(0, 2);
    }
    this.setData({ maxPrice: value });
  },

  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },

  onAddTag() {
    const { tagInput, tags } = this.data;
    const tag = tagInput.trim();
    if (!tag) return;
    if (tags.length >= 5) {
      wx.showToast({ title: "最多5个标签", icon: "none" });
      return;
    }
    if (tags.includes(tag)) {
      wx.showToast({ title: "标签已存在", icon: "none" });
      return;
    }
    this.setData({
      tags: [...tags, tag],
      tagInput: "",
    });
  },

  onRemoveTag(e) {
    const index = e.currentTarget.dataset.index;
    const tags = [...this.data.tags];
    tags.splice(index, 1);
    this.setData({ tags });
  },

  onChooseImage() {
    const { images } = this.data;
    const remain = 9 - images.length;
    if (remain <= 0) return;
    wx.chooseImage({
      count: remain,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.setData({
          images: [...images, ...res.tempFilePaths],
        });
      },
    });
  },

  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    const cloudImages = [...this.data.cloudImages];
    images.splice(index, 1);
    cloudImages.splice(index, 1);
    this.setData({ images, cloudImages });
  },

  async uploadAllImages() {
    const { images } = this.data;
    if (images.length === 0) return [];
    wx.showLoading({ title: "上传图片中..." });
    try {
      const results = await Promise.all(images.map((path) => uploadFile(path)));
      return results.map((r) => r.url);
    } finally {
      wx.hideLoading();
    }
  },

  async onSubmit() {
    const { content, minPrice, maxPrice, tags, submitting } = this.data;
    if (submitting) return;

    // 未登录检查
    if (!app.globalData.openId) {
      wx.showModal({
        title: "请先登录",
        content: "发布求购需要登录",
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
            setTimeout(() => {
              wx.navigateTo({ url: "/pages/login/login/login" });
            }, 300);
          }
        },
      });
      return;
    }

    // 描述校验
    if (!content.trim()) {
      return wx.showToast({ title: "请填写求购描述", icon: "none" });
    }
    if (content.length < 5) {
      return wx.showToast({ title: "描述至少5个字", icon: "none" });
    }

    // 价格校验
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (minPrice && (isNaN(min) || min < 0)) {
      return wx.showToast({ title: "最低价格式不正确", icon: "none" });
    }
    if (maxPrice && (isNaN(max) || max < 0)) {
      return wx.showToast({ title: "最高价格式不正确", icon: "none" });
    }
    if (minPrice && maxPrice && min > max) {
      return wx.showToast({ title: "最低价不能高于最高价", icon: "none" });
    }

    this.setData({ submitting: true });

    try {
      // 内容安全检测
      const checkText = [content, tags.join(" ")].filter(Boolean).join(" ");
      const checkResult = await contentSecCheck(checkText);
      if (!checkResult.pass) {
        this.setData({ submitting: false });
        return wx.showToast({ title: checkResult.msg, icon: "none" });
      }

      const cloudImages = await this.uploadAllImages();

      const res = await wantedApi.create({
        content: content.trim(),
        min_price: min || 0,
        max_price: max || 0,
        tags: tags,
        images: cloudImages,
      });

      if (res.code === 200) {
        wx.showToast({ title: "发布成功", icon: "success" });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: res.msg || "发布失败", icon: "none" });
      }
    } catch (err) {
      console.error("发布求购失败：", err);
      wx.showToast({ title: "发布失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
