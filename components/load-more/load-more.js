Component({
  properties: {
    loading: {
      type: Boolean,
      value: false,
    },
    loadingText: {
      type: String,
      value: "正在加载...",
    },
    noMore: {
      type: Boolean,
      value: false,
    },
    noMoreText: {
      type: String,
      value: "—— 没有更多了 ——",
    },
  },
});
