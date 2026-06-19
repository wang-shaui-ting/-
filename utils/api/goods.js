const {
  getGoodsList,
  getGoodsDetail,
  createGoods,
  updateGoods,
  removeGoods,
  getMyGoods,
} = require("../api");

module.exports = {
  list(params) {
    return getGoodsList({
      category: params.category,
      page: params.page,
      pageSize: params.pageSize,
    });
  },
  detail(id) {
    return getGoodsDetail(id);
  },
  create(data) {
    return createGoods(data);
  },
  update(id, data) {
    return updateGoods(id, data);
  },
  remove(id) {
    return removeGoods(id);
  },
  myGoods() {
    return getMyGoods();
  },
};
