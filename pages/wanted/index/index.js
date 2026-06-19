const wantedApi = require("../../../utils/api/wanted");

Page({
  data: {
    posts: [],
    loading: false,
    page: 1,
    hasMore: true,
    expandedId: null, // 当前展开详情的求购 ID
    expandedDetail: null, // 详情数据
    comments: [], // 当前展开的评论列表
    commentLoading: false,
    commentInput: "", // 评论输入框内容
    replyTo: null, // 回复目标 { commentId, nickname }
  },

  onLoad() {
    this.loadPosts();
  },

  loadPosts() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    wantedApi
      .list({ page: this.data.page, pageSize: 10 })
      .then((res) => {
        if (res.code === 200) {
          const list = (res.data.list || []).map((item) => ({
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
            images: item.images || [],
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
        } else {
          this.setData({ loading: false });
        }
      })
      .catch(() => this.setData({ loading: false }));
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

  // 点击卡片，展开/收起详情
  onPostTap(e) {
    const id = e.detail.id;
    if (this.data.expandedId === id) {
      // 收起
      this.setData({
        expandedId: null,
        expandedDetail: null,
        comments: [],
        replyTo: null,
      });
      return;
    }
    // 展开
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
      if (commentsRes.code === 200) {
        // 构建嵌套评论结构
        const comments = (commentsRes.data || []).map((c) => ({
          id: c._id,
          parentId: c.parent_id || "",
          content: c.content,
          nickname: c.nickname || "校园用户",
          avatar: c.avatar || "",
          likeCount: c.like_count || 0,
          time: c.createdAt
            ? c.createdAt.slice
              ? c.createdAt.slice(0, 10)
              : c.createdAt
            : "",
          isLiked: false,
          replies: [],
        }));
        // 将子评论挂到父评论下
        const topLevel = [];
        const repliesMap = {};
        comments.forEach((c) => {
          if (c.parentId) {
            if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
            repliesMap[c.parentId].push(c);
          } else {
            topLevel.push(c);
          }
        });
        topLevel.forEach((c) => {
          c.replies = repliesMap[c.id] || [];
        });
        this.setData({ comments: topLevel });
      }
    } catch (err) {
      console.error("加载详情失败：", err);
    } finally {
      this.setData({ commentLoading: false });
    }
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  // 提交评论
  async onSubmitComment() {
    const { commentInput, expandedId, replyTo } = this.data;
    const content = commentInput.trim();
    if (!content) return;

    try {
      const res = await wantedApi.createComment({
        wantedId: expandedId,
        content: content,
        parentId: replyTo ? replyTo.commentId : "",
      });
      if (res.code === 200) {
        wx.showToast({
          title: replyTo ? "回复成功" : "评论成功",
          icon: "success",
        });
        this.setData({ commentInput: "", replyTo: null });
        // 刷新评论列表
        this.loadComments();
      } else {
        wx.showToast({ title: res.msg || "评论失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "评论失败", icon: "none" });
    }
  },

  // 刷新评论
  async loadComments() {
    const { expandedId } = this.data;
    if (!expandedId) return;
    try {
      const res = await wantedApi.getComments(expandedId);
      if (res.code === 200) {
        const comments = (res.data || []).map((c) => ({
          id: c._id,
          parentId: c.parent_id || "",
          content: c.content,
          nickname: c.nickname || "校园用户",
          avatar: c.avatar || "",
          likeCount: c.like_count || 0,
          time: c.createdAt
            ? c.createdAt.slice
              ? c.createdAt.slice(0, 10)
              : c.createdAt
            : "",
          isLiked: false,
          replies: [],
        }));
        const topLevel = [];
        const repliesMap = {};
        comments.forEach((c) => {
          if (c.parentId) {
            if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
            repliesMap[c.parentId].push(c);
          } else {
            topLevel.push(c);
          }
        });
        topLevel.forEach((c) => {
          c.replies = repliesMap[c.id] || [];
        });
        this.setData({ comments: topLevel });
      }
    } catch (err) {
      /* ignore */
    }
  },

  // 回复评论
  onReplyTap(e) {
    const { commentId, nickname } = e.currentTarget.dataset;
    this.setData({
      replyTo: { commentId, nickname },
      commentInput: "",
    });
  },

  // 取消回复
  onCancelReply() {
    this.setData({ replyTo: null, commentInput: "" });
  },

  // 点赞评论
  async onLikeCommentTap(e) {
    const commentId = e.currentTarget.dataset.commentId;
    try {
      await wantedApi.likeComment(commentId);
      // 更新本地状态
      const updateComments = (list) =>
        list.map((c) => {
          if (c.id === commentId) {
            return { ...c, isLiked: true, likeCount: c.likeCount + 1 };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateComments(c.replies) };
          }
          return c;
        });
      this.setData({ comments: updateComments(this.data.comments) });
    } catch (err) {
      /* ignore */
    }
  },

  onFollowTap(e) {
    const id = e.detail.id;
    const posts = this.data.posts.map((item) =>
      item.id === id ? { ...item, isFollowed: true } : item,
    );
    this.setData({ posts });
    wx.showToast({ title: "关注成功", icon: "none" });
  },

  onLikeTap(e) {
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
    // 在卡片上点击评论，展开详情并滚动到评论区
    const id = e.detail.id;
    if (this.data.expandedId !== id) {
      this.loadDetail(id);
    }
  },

  onShareTap(e) {
    const id = e.detail.id;
    const posts = this.data.posts.map((item) =>
      item.id === id ? { ...item, shareCount: item.shareCount + 1 } : item,
    );
    this.setData({ posts });
    wx.showToast({ title: "分享成功", icon: "none" });
  },

  onPreviewImage(e) {
    const { urls, current } = e.detail;
    wx.previewImage({ urls, current });
  },

  onPublishTap() {
    wx.navigateTo({ url: "/pages/wanted/publish/publish" });
  },
});
