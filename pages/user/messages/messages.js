const app = getApp();

Page({
  data: {
    messages: [],
    loading: true,
  },

  onShow() {
    this.loadMessages();
  },

  async loadMessages() {
    this.setData({ loading: true });
    const openId = app.globalData.openId;
    if (!openId) {
      this.setData({ loading: false });
      return;
    }

    try {
      const db = wx.cloud.database();

      // 1. 查我发布的求购
      const { data: myWanted } = await db
        .collection("wanted")
        .where({ _openid: openId })
        .get();

      if (myWanted.length === 0) {
        this.setData({ messages: [], loading: false });
        return;
      }

      const wantedIds = myWanted.map((w) => w._id);
      const wantedMap = {};
      myWanted.forEach((w) => {
        wantedMap[w._id] = {
          title:
            (w.content || "").slice(0, 30) +
            ((w.content || "").length > 30 ? "..." : ""),
          status: w.status || "open",
        };
      });

      // 2. 查这些求购下的所有评论，按时间倒序
      const { data: comments } = await db
        .collection("wanted_comments")
        .where({ wanted_id: db.command.in(wantedIds) })
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const messages = comments.map((c) => ({
        id: c._id,
        wantedId: c.wanted_id,
        content: c.content || "",
        nickname: c.nickname || "校园用户",
        avatar: c.avatar || "",
        time: c.createdAt
          ? typeof c.createdAt === "string"
            ? c.createdAt.slice(0, 16)
            : ""
          : "",
        wantedTitle: wantedMap[c.wanted_id]?.title || "未知求购",
      }));

      this.setData({ messages, loading: false });
    } catch (err) {
      console.error("加载消息失败：", err);
      this.setData({ loading: false });
    }
  },

  // 点击消息跳转到求购广场并展开对应帖子
  onMessageTap(e) {
    const { wantedId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: "/pages/content/wanted/wanted?showId=" + wantedId,
    });
  },
});
