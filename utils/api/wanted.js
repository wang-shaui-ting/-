const {
  getWantedList,
  getWantedDetail,
  createWanted,
  updateWanted,
  deleteWanted,
  likeWanted,
  closeWanted,
  getMyWanted,
  createWantedComment,
  getWantedComments,
  likeWantedComment,
  getWantedUnreadCount,
} = require("../api");

module.exports = {
  list(params) {
    return getWantedList({ page: params.page, pageSize: params.pageSize });
  },
  detail(id) {
    return getWantedDetail(id);
  },
  create(data) {
    return createWanted(data);
  },
  update(id, data) {
    return updateWanted(id, data);
  },
  delete(id) {
    return deleteWanted(id);
  },
  like(id) {
    return likeWanted(id);
  },
  close(id) {
    return closeWanted(id);
  },
  getMyWanted() {
    return getMyWanted();
  },
  createComment(data) {
    return createWantedComment(data);
  },
  getComments(wantedId) {
    return getWantedComments(wantedId);
  },
  likeComment(commentId) {
    return likeWantedComment(commentId);
  },
  getUnreadCount() {
    return getWantedUnreadCount();
  },
};
