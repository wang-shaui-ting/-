const app = getApp();

Page({
  data: {
    loading: false,
    loggedIn: false,
    phoneBound: false,
    bindingPhone: false,
  },

  onWxLogin(e) {
    if (this.data.loading) return;

    const { userInfo } = e.detail;
    if (!userInfo) {
      return wx.showToast({ title: "需要授权才能登录", icon: "none" });
    }

    this.setData({ loading: true });

    // 1. 通过云模板获取 openId
    wx.cloud.callFunction({
      name: "XXXX",
      data: {
        name: "XXXX",
      },
      success: (res) => {
        const openId = res.result?.openId;
        if (!openId) {
          wx.showToast({ title: "登录失败", icon: "none" });
          this.setData({ loading: false });
          return;
        }

        app.globalData.openId = openId;
        wx.setStorageSync("openId", openId);

        // 2. 调用 login 云函数，将用户信息写入 users 集合
        wx.cloud.callFunction({
          name: "XXXX",
          data: {
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl,
          },
          success: (res2) => {
            const loginRes = res2.result;
            const profile = {
              nickname:
                (loginRes && loginRes.code === 200 && loginRes.data.nickname) ||
                userInfo.nickName,
              avatar:
                (loginRes && loginRes.code === 200 && loginRes.data.avatar) ||
                userInfo.avatarUrl,
              openId: openId,
            };
            app.globalData.userInfo = profile;
            wx.setStorageSync("userInfo", profile);

            this.setData({ loggedIn: true });
          },
          fail: (err) => {
            console.error("调用 login 云函数失败：", err);
            const profile = {
              nickname: userInfo.nickName,
              avatar: userInfo.avatarUrl,
              openId: openId,
            };
            app.globalData.userInfo = profile;
            wx.setStorageSync("userInfo", profile);

            this.setData({ loggedIn: true });
          },
          complete: () => {
            this.setData({ loading: false });
          },
        });
      },
      fail: (err) => {
        console.error("获取 openId 失败：", err);
        wx.showToast({ title: "登录失败，请检查网络", icon: "none" });
        this.setData({ loading: false });
      },
    });
  },

  // 步骤2：获取手机号
  getPhoneNumber(e) {
    const code = e.detail?.code;
    if (!code) {
      // 用户拒绝授权
      this.setData({ phoneBound: true });
      return;
    }

    this.setData({ bindingPhone: true });

    wx.cloud.callFunction({
      name: "XXXX",
      data: {
        name: "XXXX",
        data: { code },
      },
      success: (res) => {
        const phoneInfo = res.result?.phoneInfo;
        if (phoneInfo && phoneInfo.phoneNumber) {
          // 存储手机号
          const userInfo = app.globalData.userInfo || {};
          userInfo.phone = phoneInfo.phoneNumber;
          app.globalData.userInfo = userInfo;
          wx.setStorageSync("userInfo", userInfo);

          // 更新云数据库中的手机号
          const { updateUserProfile } = require("../../../utils/api");
          updateUserProfile({ phone: phoneInfo.phoneNumber }).catch(() => {});
        }
        this.setData({ phoneBound: true, bindingPhone: false });
      },
      fail: (err) => {
        console.error("获取手机号失败：", err);
        wx.showToast({ title: "获取手机号失败", icon: "none" });
        this.setData({ phoneBound: true, bindingPhone: false });
      },
    });
  },

  // 跳过手机号绑定
  onSkipPhone() {
    this.setData({ phoneBound: true });
  },

  // 完成登录，返回上一页
  onFinish() {
    wx.navigateBack();
  },
});
