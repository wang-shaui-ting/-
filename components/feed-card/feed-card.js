Component({
  properties: {
    post: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onTap() {
      this.triggerEvent("tap", { id: this.data.post.id });
    },
    onFollowTap() {
      this.triggerEvent("follow", { id: this.data.post.id });
    },
    onPreviewImage(e) {
      this.triggerEvent("preview", {
        urls: e.currentTarget.dataset.urls,
        current: e.currentTarget.dataset.current,
      });
    },
    onLikeTap() {
      this.triggerEvent("like", { id: this.data.post.id });
    },
    onCommentTap() {
      this.triggerEvent("comment", { id: this.data.post.id });
    },
    onShareTap() {
      this.triggerEvent("share", { id: this.data.post.id });
    },
  },
});
