Component({
  properties: {
    icon: {
      type: String,
      value: "",
    },
    text: {
      type: String,
      value: "",
    },
    showArrow: {
      type: Boolean,
      value: true,
    },
  },
  methods: {
    onTap() {
      this.triggerEvent("tap");
    },
  },
});
