App({
  onLaunch: function () {
    wx.cloud.init({
      // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      env: "XXXX",
      // 是否在将用户访问记录到用户管理中，在控制台中可见，默认为false
      traceUser: false,
    });

    // 调用云模板获取 openId
    wx.cloud.callFunction({
      name: "XXXX",
      data: {
        name: "XXXX",
        data: {},
      },
      success: (res) => {
        const openId = res.result?.openId;
        if (openId) {
          this.globalData.openId = openId;
          wx.setStorageSync("openId", openId);
          console.log("获取到的openId：", openId);
        }
      },
      fail: (err) => {
        console.error("获取 openId 失败：", err);
      },
    });
  },

  globalData: {
    userInfo: null,
    openId: null,
  },
});
