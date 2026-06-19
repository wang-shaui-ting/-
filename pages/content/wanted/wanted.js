const wantedApi = require("../../../utils/api/wanted");
const app = getApp();

Page({
  data: {
    posts: [],
    loading: false,
    page: 1,
    hasMore: true,
    expandedId: null,
    expandedDetail: null,
    comments: [],
    commentLoading: false,
    commentInput: "",
    replyTo: null,
  },

  onLoad(options) {
    this.loadPosts();
    wx.showShareMenu({ withShareTicket: false });
    // 从消息中心跳转时自动展开对应帖子
    if (options.showId) {
      this.setData({ showIdOnLoad: options.showId });
    }
  },

  onShow() {
    if (this.data.posts.length > 0) {
      this.setData({ page: 1 }, () => this.loadPosts());
    }
  },

  async loadPosts() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await wantedApi.list({ page: this.data.page, pageSize: 10 });
      if (res.code === 200) {
        const rawList = res.data.list || [];
        // 批量转换云存储图片为临时 HTTPS 链接
        const cloudUrls = [];
        rawList.forEach((item) => {
          if (item.images && item.images.length > 0) {
            item.images.forEach((u) => {
              if (u.startsWith("cloud://")) cloudUrls.push(u);
            });
          }
        });
        const urlMap = {};
        if (cloudUrls.length > 0) {
          try {
            const tempRes = await wx.cloud.getTempFileURL({
              fileList: cloudUrls,
            });
            tempRes.fileList.forEach((f) => {
              if (f.tempFileURL) urlMap[f.fileID] = f.tempFileURL;
            });
          } catch (e) {
            /* ignore */
          }
        }

        const list = rawList.map((item) => ({
          id: item._id || item.id,
          avatar: item.avatar || "",
          nickname: item.nickname || "校园用户",
          verified: false,
          time: item.createdAt
            ? item.createdAt.slice
              ? item.createdAt.slice(0, 10)
              : item.createdAt
            : "",
          content: item.content,
          images: (item.images || []).map((u) => urlMap[u] || u),
          min_price: item.min_price || 0,
          max_price: item.max_price || 0,
          tags: item.tags || [],
          likeCount: item.like_count || 0,
          commentCount: item.comment_count || 0,
          shareCount: 0,
          isLiked: false,
          isFollowed: false,
          status: item.status || "open",
          statusText: item.status === "open" ? "求购中" : "已关闭",
        }));
        const posts =
          this.data.page === 1 ? list : [...this.data.posts, ...list];
        this.setData({
          posts,
          hasMore: posts.length < res.data.total,
          loading: false,
        });
        // 从消息中心跳转时自动展开对应帖子
        if (this.data.showIdOnLoad) {
          const id = this.data.showIdOnLoad;
          this.setData({ showIdOnLoad: "" });
          this.loadDetail(id);
        }
      } else {
        this.setData({ loading: false });
      }
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.setData(
      { page: 1, expandedId: null, expandedDetail: null, comments: [] },
      () => {
        this.loadPosts();
        wx.stopPullDownRefresh();
      },
    );
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 }, () => this.loadPosts());
  },

  requireLogin(actionName) {
    if (!app.globalData.openId) {
      wx.showModal({
        title: "请先登录",
        content: `${actionName}需要登录`,
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: "/pages/login/login/login" });
        },
      });
      return false;
    }
    return true;
  },

  onPostTap(e) {
    const id = e.detail.id;
    if (this.data.expandedId === id) {
      this.setData({
        expandedId: null,
        expandedDetail: null,
        comments: [],
        replyTo: null,
      });
      return;
    }
    this.loadDetail(id);
  },

  async loadDetail(id) {
    this.setData({
      expandedId: id,
      expandedDetail: null,
      comments: [],
      commentLoading: true,
      replyTo: null,
    });
    try {
      const [detailRes, commentsRes] = await Promise.all([
        wantedApi.detail(id),
        wantedApi.getComments(id),
      ]);
      if (detailRes.code === 200) {
        const item = detailRes.data;
        this.setData({
          expandedDetail: {
            id: item._id || item.id,
            avatar: item.avatar || "",
            nickname: item.nickname || "校园用户",
            time: item.createdAt
              ? item.createdAt.slice
                ? item.createdAt.slice(0, 10)
                : item.createdAt
              : "",
            content: item.content,
            images: item.images || [],
            min_price: item.min_price || 0,
            max_price: item.max_price || 0,
            tags: item.tags || [],
            status: item.status || "open",
            statusText: item.status === "open" ? "求购中" : "已关闭",
          },
        });
      }
      if (commentsRes.code === 200) this.buildComments(commentsRes.data || []);
    } catch (err) {
      console.error("加载详情失败：", err);
    } finally {
      this.setData({ commentLoading: false });
    }
  },

  buildComments(rawList) {
    const comments = rawList.map((c) => ({
      id: c._id,
      parentId: c.parent_id || "",
      content: c.content,
      nickname: c.nickname || "校园用户",
      avatar: c.avatar || "",
      likeCount: c.like_count || 0,
      time: c.createdAt
        ? c.createdAt.slice
          ? c.createdAt.slice(0, 16)
          : c.createdAt
        : "",
      isLiked: false,
      replies: [],
    }));
    const topLevel = [],
      repliesMap = {};
    comments.forEach((c) => {
      if (c.parentId) {
        if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
        repliesMap[c.parentId].push(c);
      } else topLevel.push(c);
    });
    topLevel.forEach((c) => {
      c.replies = repliesMap[c.id] || [];
    });
    this.setData({ comments: topLevel });
  },

  async loadComments() {
    if (!this.data.expandedId) return;
    try {
      const res = await wantedApi.getComments(this.data.expandedId);
      if (res.code === 200) this.buildComments(res.data || []);
    } catch (err) {
      /* ignore */
    }
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  async onSubmitComment() {
    if (!this.requireLogin("评论")) return;
    const { commentInput, expandedId, replyTo } = this.data;
    const content = commentInput.trim();
    if (!content) return;
    try {
      const res = await wantedApi.createComment({
        wantedId: expandedId,
        content,
        parentId: replyTo ? replyTo.commentId : "",
      });
      if (res.code === 200) {
        wx.showToast({
          title: replyTo ? "回复成功" : "评论成功",
          icon: "success",
        });
        this.setData({ commentInput: "", replyTo: null });
        this.loadComments();
      } else {
        wx.showToast({ title: res.msg || "评论失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "评论失败", icon: "none" });
    }
  },

  onReplyTap(e) {
    if (!this.requireLogin("回复")) return;
    const { commentId, nickname } = e.currentTarget.dataset;
    this.setData({ replyTo: { commentId, nickname }, commentInput: "" });
  },

  onCancelReply() {
    this.setData({ replyTo: null, commentInput: "" });
  },

  async onLikeCommentTap(e) {
    if (!this.requireLogin("点赞")) return;
    const commentId = e.currentTarget.dataset.commentId;
    try {
      await wantedApi.likeComment(commentId);
      const updateComments = (list) =>
        list.map((c) => {
          if (c.id === commentId)
            return { ...c, isLiked: true, likeCount: c.likeCount + 1 };
          if (c.replies && c.replies.length > 0)
            return { ...c, replies: updateComments(c.replies) };
          return c;
        });
      this.setData({ comments: updateComments(this.data.comments) });
    } catch (err) {
      /* ignore */
    }
  },

  onFollowTap(e) {
    if (!this.requireLogin("关注")) return;
    const id = e.detail.id;
    const posts = this.data.posts.map((item) =>
      item.id === id ? { ...item, isFollowed: true } : item,
    );
    this.setData({ posts });
    wx.showToast({ title: "关注成功", icon: "none" });
  },

  onLikeTap(e) {
    if (!this.requireLogin("点赞")) return;
    const id = e.detail.id;
    wantedApi.like(id).then((res) => {
      if (res.code === 200) {
        const posts = this.data.posts.map((item) => {
          if (item.id !== id) return item;
          const isLiked = !item.isLiked;
          return {
            ...item,
            isLiked,
            likeCount: item.likeCount + (isLiked ? 1 : -1),
          };
        });
        this.setData({ posts });
      }
    });
  },

  onCommentTap(e) {
    const id = e.detail.id;
    if (this.data.expandedId !== id) this.loadDetail(id);
  },

  onShareTap(e) {
    const id = e.detail.id;
    const post = this.data.posts.find((p) => p.id === id);
    if (post) this.setData({ shareTarget: post });
  },

  onShareAppMessage() {
    const post = this.data.shareTarget;
    if (post) {
      return {
        title:
          post.content.slice(0, 30) + (post.content.length > 30 ? "..." : ""),
        path: "/pages/content/wanted/wanted",
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : "",
      };
    }
    return {
      title: "校园二手交易 - 求购广场",
      path: "/pages/content/wanted/wanted",
    };
  },

  onPreviewImage(e) {
    const { urls, current } = e.detail || e.currentTarget.dataset;
    this.previewWithTempUrl(urls, current);
  },

  async previewWithTempUrl(fileIDs, current) {
    if (!fileIDs || fileIDs.length === 0) return;
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
        /* ignore */
      }
    }
    wx.previewImage({ urls: fileIDs, current });
  },

  onPublishTap() {
    if (!this.requireLogin("发布求购")) return;
    wx.navigateTo({ url: "/pages/wanted/publish/publish" });
  },
});
