Component({
  properties: {
    placeholder: {
      type: String,
      value: "搜索你想要的宝贝",
    },
    showCancel: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    onTap() {
      this.triggerEvent("tap");
    },
  },
});
