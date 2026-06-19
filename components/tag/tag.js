Component({
  properties: {
    text: {
      type: String,
      value: "",
    },
    hot: {
      type: Boolean,
      value: false,
    },
    prefix: {
      type: String,
      value: "",
    },
  },
  methods: {
    onTap() {
      this.triggerEvent("tap", { text: this.data.text });
    },
  },
});
