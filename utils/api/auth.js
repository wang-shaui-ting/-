const { getUserProfile, updateUserProfile } = require("../api");

module.exports = {
  /**
   * 通过云模板获取 openId
   */
  login() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: "XXXX",
        data: {
          name: "XXXX",
        },
        success: (res) => {
          const openId = res.result?.openId;
          if (openId) {
            getApp().globalData.openId = openId;
            wx.setStorageSync("openId", openId);
            resolve({ openId });
          } else {
            reject(new Error("获取 openId 失败"));
          }
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  },
  getProfile() {
    return getUserProfile();
  },
  updateProfile(data) {
    return updateUserProfile(data);
  },
};
