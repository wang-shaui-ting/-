const {
  uploadFile,
  createGoods,
  updateGoods,
  getGoodsDetail,
  contentSecCheck,
} = require("../../../utils/api");

Page({
  data: {
    editingId: "",
    isEdit: false,
    title: "",
    categoryIndex: 0,
    categoryList: [
      { id: 0, name: "请选择分类" },
      { id: 1, name: "教材" },
      { id: 2, name: "数码" },
      { id: 3, name: "生活" },
      { id: 4, name: "运动" },
    ],
    price: "",
    desc: "",
    images: [],
    oldImages: [], // 编辑模式下已有的云存储图片
    submitting: false,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ editingId: options.id, isEdit: true });
      this.loadGoodsData(options.id);
    }
  },

  async loadGoodsData(id) {
    try {
      const res = await getGoodsDetail(id);
      if (res.code === 200) {
        const data = res.data;
        const catId = data.category || 0;
        const catIndex = this.data.categoryList.findIndex(
          (c) => c.id === catId,
        );
        this.setData({
          title: data.title || "",
          categoryIndex: catIndex >= 0 ? catIndex : 0,
          price: data.price ? String(data.price) : "",
          desc: data.description || "",
          oldImages: data.images || [],
          images: [], // 编辑时旧图存在 oldImages，新选图存在 images
        });
      }
    } catch (e) {
      console.error("加载商品数据失败", e);
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },
  onPriceInput(e) {
    let val = e.detail.value;
    // 只允许数字和小数点
    val = val.replace(/[^\d.]/g, "");
    // 只保留第一个小数点
    const dotIndex = val.indexOf(".");
    if (dotIndex >= 0) {
      val =
        val.slice(0, dotIndex + 1) + val.slice(dotIndex + 1).replace(/\./g, "");
    }
    this.setData({ price: val });
  },
  onPriceBlur(e) {
    let val = this.data.price;
    if (!val) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      this.setData({ price: "" });
      return;
    }
    // 格式化保留两位小数
    this.setData({ price: num.toFixed(2) });
  },
  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },
  onCategoryChange(e) {
    this.setData({ categoryIndex: parseInt(e.detail.value) });
  },

  onChooseImage() {
    const remain = 6 - this.data.images.length;
    wx.chooseImage({
      count: remain,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        this.setData({ images: [...this.data.images, ...res.tempFilePaths] });
      },
    });
  },

  onDelImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== idx);
    this.setData({ images });
  },

  resetForm() {
    this.setData({
      editingId: "",
      isEdit: false,
      title: "",
      categoryIndex: 0,
      price: "",
      desc: "",
      images: [],
      submitting: false,
    });
  },

  async onSubmit() {
    const {
      editingId,
      isEdit,
      title,
      categoryIndex,
      price,
      desc,
      images,
      oldImages,
    } = this.data;
    if (!title.trim())
      return wx.showToast({ title: "请输入标题", icon: "none" });
    if (categoryIndex === 0)
      return wx.showToast({ title: "请选择分类", icon: "none" });
    if (!price || parseFloat(price) <= 0)
      return wx.showToast({ title: "请输入有效价格", icon: "none" });
    if (!isEdit && images.length === 0)
      return wx.showToast({ title: "请至少上传一张图片", icon: "none" });
    if (isEdit && images.length === 0 && oldImages.length === 0)
      return wx.showToast({ title: "请至少保留一张图片", icon: "none" });

    this.setData({ submitting: true });
    try {
      // 内容安全检测
      const checkText = [title, desc].filter(Boolean).join(" ");
      const checkResult = await contentSecCheck(checkText);
      if (!checkResult.pass) {
        this.setData({ submitting: false });
        return wx.showToast({ title: checkResult.msg, icon: "none" });
      }

      const formattedPrice = parseFloat(price).toFixed(2);
      const payload = {
        title: title.trim(),
        category: this.data.categoryList[categoryIndex].id,
        price: parseFloat(formattedPrice),
        description: desc.trim(),
      };

      let finalImages = oldImages.slice(); // 保留旧图

      // 上传新选的图片到云存储
      if (images.length > 0) {
        const urls = [];
        for (const fp of images) {
          const data = await uploadFile(fp);
          urls.push(data.url);
        }
        finalImages = finalImages.concat(urls);
      }

      payload.images = finalImages;

      let res;
      if (isEdit) {
        res = await updateGoods(editingId, payload);
      } else {
        res = await createGoods(payload);
      }

      if (res.code === 200) {
        wx.showToast({
          title: isEdit ? "保存成功" : "发布成功",
          icon: "success",
        });
        this.resetForm();
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1000);
      }
    } catch (err) {
      wx.showToast({ title: "操作失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
