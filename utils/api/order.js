const { createOrder, getOrderList, updateOrderStatus } = require("../api");

module.exports = {
  create(data) {
    return createOrder(data);
  },
  list() {
    return getOrderList();
  },
  updateStatus(id, status) {
    return updateOrderStatus(id, status);
  },
};
