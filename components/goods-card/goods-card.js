Component({
  properties: {
    goods: {
      type: Object,
      value: {},
    },
  },
  data: {
    categoryMap: {
      1: "教材",
      2: "数码",
      3: "生活",
      4: "运动",
    },
    categoryName: "",
  },
  observers: {
    "goods.category"(val) {
      this.setData({ categoryName: this.data.categoryMap[val] || "" });
    },
  },
  methods: {
    onTap() {
      this.triggerEvent("tap", { id: this.data.goods.id });
    },
  },
});
