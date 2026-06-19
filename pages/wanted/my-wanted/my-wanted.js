const wantedApi = require("../../../utils/api/wanted");

Page({
  data: {
    list: [],
    loading: false,
    unreadCount: 0,
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [listRes, countRes] = await Promise.all([
        wantedApi.getMyWanted(),
        wantedApi.getUnreadCount(),
      ]);
      if (listRes.code === 200) {
        const list = (listRes.data || []).map((item) => ({
          id: item._id || item.id,
          content: item.content,
          images: item.images || [],
          min_price: item.min_price || 0,
          max_price: item.max_price || 0,
          tags: item.tags || [],
          status: item.status || "open",
          statusText: item.status === "open" ? "求购中" : "已关闭",
          likeCount: item.like_count || 0,
          commentCount: item.comment_count || 0,
          time: item.createdAt
            ? item.createdAt.slice
              ? item.createdAt.slice(0, 10)
              : item.createdAt
            : "",
        }));
        this.setData({ list });
      }
      if (countRes.code === 200) {
        this.setData({ unreadCount: countRes.data.count || 0 });
      }
    } catch (err) {
      console.error("加载我的求购失败：", err);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 关闭求购
  async onCloseTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认关闭",
      content: "关闭后该求购将不再展示",
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wantedApi.close(id);
            if (result.code === 200) {
              wx.showToast({ title: "已关闭", icon: "success" });
              this.loadData();
            }
          } catch (err) {
            wx.showToast({ title: "操作失败", icon: "none" });
          }
        }
      },
    });
  },

  // 删除求购
  async onDeleteTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除",
      content: "删除后数据不可恢复",
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wantedApi.delete(id);
            if (result.code === 200) {
              wx.showToast({ title: "已删除", icon: "success" });
              this.loadData();
            }
          } catch (err) {
            wx.showToast({ title: "删除失败", icon: "none" });
          }
        }
      },
    });
  },

  // 编辑求购
  onEditTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: "编辑功能开发中", icon: "none" });
  },

  // 发布求购
  onPublishTap() {
    wx.navigateTo({ url: "/pages/wanted/publish/publish" });
  },
});
