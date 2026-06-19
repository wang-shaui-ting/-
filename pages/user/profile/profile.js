const { getUserProfile } = require("../../../utils/api");

Page({
  data: {
    userInfo: {
      avatar: "",
      nickname: "",
      bio: "",
      followCount: 0,
      fansCount: 0,
      likeCount: 0,
    },
    menuList: [
      { id: "my_goods", name: "我的发布", icon: "📦" },
      { id: "favorites", name: "我的收藏", icon: "⭐" },
      { id: "wanted", name: "我的求购", icon: "🔍" },
      { id: "history", name: "浏览记录", icon: "🕐" },
      { id: "messages", name: "消息中心", icon: "💬" },
    ],
    /*
     * 设置菜单（已移除"设置"卡片）
     * 如需增删菜单项，直接修改此数组
     */
    settingList: [
      { id: "feedback", name: "意见反馈", icon: "📝" },
      { id: "about", name: "关于我们", icon: "ℹ️" },
    ],
  },

  onShow() {
    // 未登录则跳转登录页
    if (!wx.getStorageSync("userInfo")) {
      wx.navigateTo({ url: "/pages/login/login/login" });
      return;
    }
    this.loadProfile();
  },

  loadProfile() {
    const user = wx.getStorageSync("userInfo");
    if (user) {
      this.setData({
        userInfo: {
          avatar: user.avatar || "",
          nickname: user.nickname || "校园用户",
          bio: user.campus || "未设置校区",
          followCount: 0,
          fansCount: 0,
          likeCount: 0,
        },
      });
    }
    // 尝试从云数据库获取最新信息
    getUserProfile()
      .then((res) => {
        if (res.code === 200) {
          const u = res.data;
          this.setData({
            userInfo: {
              avatar: u.avatar || "",
              nickname: u.nickname || "校园用户",
              bio: u.campus || "未设置校区",
              followCount: 0,
              fansCount: 0,
              likeCount: 0,
            },
          });
          wx.setStorageSync("userInfo", u);
        }
      })
      .catch(() => {});
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id;
    const routes = {
      my_goods: "/pages/user/my-goods/my-goods",
      favorites: "/pages/user/favorites/favorites",
      wanted: "/pages/user/my-wanted/my-wanted",
    };

    if (routes[id]) {
      return wx.navigateTo({ url: routes[id] });
    }

    if (id === "history") {
      return wx.showToast({ title: "功能开发中", icon: "none" });
    }

    if (id === "messages") {
      return wx.navigateTo({ url: "/pages/user/messages/messages" });
    }

    /*
     * 意见反馈：点击弹出微信群号
     * 如需修改群号，直接改下面 content 字符串即可
     */
    if (id === "feedback") {
      return wx.showModal({
        title: "意见反馈",
        content: "有任何意见反馈请加入微信：XXXX",
        showCancel: false,
        confirmText: "知道了",
      });
    }

    /*
     * 关于我们：点击弹出介绍信息
     * 如需修改内容，直接改下面字符串即可
     */
    if (id === "about") {
      return wx.showModal({
        title: "关于我们",
        content:
          "校园内二手交易平台，致力于为同学们提供安全便捷的闲置交易服务。让闲置流动，让价值传递。",
        showCancel: false,
        confirmText: "知道了",
      });
    }
  },

  onLogoutTap() {
    wx.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success(res) {
        if (res.confirm) {
          getApp().globalData.userInfo = null;
          getApp().globalData.openId = null;
          wx.removeStorageSync("userInfo");
          wx.removeStorageSync("openId");
          wx.showToast({ title: "已退出", icon: "none" });
          this.setData({
            userInfo: {
              avatar: "",
              nickname: "",
              bio: "",
              followCount: 0,
              fansCount: 0,
              likeCount: 0,
            },
          });
        }
      },
    });
  },
});
