const db = wx.cloud ? wx.cloud.database() : null;
const _ = db ? db.command : null;

// 订阅消息模板ID（在微信公众平台配置）
// 注释可修改此处
const TPL_COMMENT = "XXXX";
const TPL_ORDER = "XXXX";

/** 云数据库请求封装（保留和之前相同的 {code, data, msg} 协议） */
async function request(method, data) {
  if (!db) throw new Error("云开发未初始化");
  const res = await method(data);
  return { code: 200, data: res };
}

/** 商品列表（分页 + 分类） */
async function getGoodsList({ category = 0, page = 1, pageSize = 6 } = {}) {
  if (!db) return { code: 200, data: { list: [], total: 0, page, pageSize } };
  let query = db.collection("goods").where({ status: "selling" });
  if (category > 0) query = query.where({ status: "selling", category });
  const { data: list } = await query
    .orderBy("createdAt", "desc")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  const { total } = await query.count();
  return { code: 200, data: { list, total, page, pageSize } };
}

/** 商品详情 */
async function getGoodsDetail(id) {
  if (!db) return { code: 404, msg: "未初始化" };
  const { data } = await db.collection("goods").doc(id).get();
  if (!data) return { code: 404, msg: "商品不存在" };
  // 补充卖家信息
  let seller = {};
  try {
    const { data: users } = await db
      .collection("users")
      .where({ _openid: data._openid })
      .get();
    if (users.length > 0) {
      seller = {
        seller_name: users[0].nickname,
        seller_avatar: users[0].avatar,
        seller_campus: users[0].campus,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { code: 200, data: { ...data, ...seller } };
}

/** 发布商品 */
async function createGoods(data) {
  if (!db) throw new Error("云开发未初始化");
  const openId = getApp().globalData.openId || "";

  // 冗余存储卖家信息，列表查询时可直接显示
  let seller_name = "校园用户";
  let seller_avatar = "";
  try {
    const { data: users } = await db
      .collection("users")
      .where({ _openid: openId })
      .get();
    if (users.length > 0) {
      seller_name = users[0].nickname || seller_name;
      seller_avatar = users[0].avatar || "";
    }
  } catch (e) {
    /* ignore */
  }

  const { _id } = await db.collection("goods").add({
    data: {
      ...data,
      seller_name,
      seller_avatar,
      status: "selling",
      createdAt: db.serverDate(),
    },
  });
  return { code: 200, data: { id: _id }, msg: "发布成功" };
}

/** 我的发布 */
async function getMyGoods() {
  if (!db) return { code: 200, data: [] };
  const openId = getApp().globalData.openId || "";
  const { data } = await db
    .collection("goods")
    .where({ _openid: openId })
    .orderBy("createdAt", "desc")
    .get();
  return { code: 200, data };
}

/** 求购列表 */
async function getWantedList({ page = 1, pageSize = 10 } = {}) {
  if (!db) return { code: 200, data: { list: [], total: 0, page, pageSize } };
  const query = db.collection("wanted").where({ status: "open" });
  const { data: list } = await query
    .orderBy("createdAt", "desc")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  const { total } = await query.count();
  // nickname/avatar 已在写入时冗余存储，直接读取即可
  const enriched = list.map((item) => ({
    ...item,
    nickname: item.nickname || "校园用户",
    avatar: item.avatar || "",
  }));
  return { code: 200, data: { list: enriched, total, page, pageSize } };
}

/** 发布求购 */
async function createWanted(data) {
  if (!db) throw new Error("云开发未初始化");
  const openId = getApp().globalData.openId || "";

  // 冗余存储用户信息，避免列表查询时 N+1 查询导致超时
  let nickname = "校园用户";
  let avatar = "";
  try {
    const { data: users } = await db
      .collection("users")
      .where({ _openid: openId })
      .get();
    if (users.length > 0) {
      nickname = users[0].nickname || nickname;
      avatar = users[0].avatar || "";
    }
  } catch (e) {
    /* ignore */
  }

  const { _id } = await db.collection("wanted").add({
    data: {
      ...data,
      nickname: nickname,
      avatar: avatar,
      status: "open",
      like_count: 0,
      comment_count: 0,
      createdAt: db.serverDate(),
    },
  });
  return { code: 200, data: { id: _id }, msg: "发布成功" };
}

/** 点赞求购 */
async function likeWanted(id) {
  if (!db) throw new Error("云开发未初始化");
  await db
    .collection("wanted")
    .doc(id)
    .update({ data: { like_count: _.inc(1) } });
  return { code: 200, msg: "点赞成功" };
}

/** 上传图片到云存储 */
async function uploadFile(filePath) {
  if (!wx.cloud) throw new Error("云开发未初始化");
  const cloudPath = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const res = await wx.cloud.uploadFile({ cloudPath, filePath });
  return { url: res.fileID };
}

/** 获取用户信息 */
async function getUserProfile() {
  if (!db) throw new Error("云开发未初始化");
  const openId = getApp().globalData.openId || "";
  const { data } = await db
    .collection("users")
    .where({ _openid: openId })
    .get();
  if (data.length === 0) return { code: 404, msg: "用户不存在" };
  return { code: 200, data: data[0] };
}

/** 更新用户信息 */
async function updateUserProfile(updates) {
  if (!db) throw new Error("云开发未初始化");
  const openId = getApp().globalData.openId || "";
  await db
    .collection("users")
    .where({ _openid: openId })
    .update({ data: updates });
  return { code: 200, msg: "更新成功" };
}

/** 修改商品 */
async function updateGoods(id, updates) {
  if (!db) throw new Error("云开发未初始化");
  await db.collection("goods").doc(id).update({ data: updates });
  return { code: 200, msg: "更新成功" };
}

/** 删除商品 */
async function removeGoods(id) {
  if (!db) throw new Error("云开发未初始化");
  await db.collection("goods").doc(id).remove();
  return { code: 200, msg: "删除成功" };
}

/** 求购详情 */
async function getWantedDetail(id) {
  if (!db) return { code: 404, msg: "未初始化" };
  const { data } = await db.collection("wanted").doc(id).get();
  if (!data) return { code: 404, msg: "求购不存在" };
  // 补充发布者信息
  let publisher = {};
  try {
    const { data: users } = await db
      .collection("users")
      .where({ _openid: data._openid })
      .get();
    if (users.length > 0) {
      publisher = {
        nickname: users[0].nickname,
        avatar: users[0].avatar,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return { code: 200, data: { ...data, ...publisher } };
}

/** 我的求购列表 */
async function getMyWanted() {
  if (!db) return { code: 200, data: [] };
  const openId = getApp().globalData.openId || "";
  const { data } = await db
    .collection("wanted")
    .where({ _openid: openId })
    .orderBy("createdAt", "desc")
    .get();
  return { code: 200, data };
}

/** 更新求购 */
async function updateWanted(id, updates) {
  if (!db) throw new Error("云开发未初始化");
  await db.collection("wanted").doc(id).update({ data: updates });
  return { code: 200, msg: "更新成功" };
}

/** 删除求购 */
async function deleteWanted(id) {
  if (!db) throw new Error("云开发未初始化");
  await db.collection("wanted").doc(id).remove();
  return { code: 200, msg: "删除成功" };
}

/** 关闭求购 */
async function closeWanted(id) {
  if (!db) throw new Error("云开发未初始化");
  await db
    .collection("wanted")
    .doc(id)
    .update({ data: { status: "closed" } });
  return { code: 200, msg: "已关闭" };
}

/** 发表求购评论/回复 */
async function createWantedComment(data) {
  if (!db) throw new Error("云开发未初始化");
  const openId = getApp().globalData.openId || "";
  // 获取当前用户信息
  let nickname = "校园用户";
  let avatar = "";
  try {
    const { data: users } = await db
      .collection("users")
      .where({ _openid: openId })
      .get();
    if (users.length > 0) {
      nickname = users[0].nickname || nickname;
      avatar = users[0].avatar || "";
    }
  } catch (e) {
    /* ignore */
  }
  try {
    const { _id } = await db.collection("wanted_comments").add({
      data: {
        wanted_id: data.wantedId,
        parent_id: data.parentId || "",
        content: data.content,
        nickname: nickname,
        avatar: avatar,
        like_count: 0,
        createdAt: db.serverDate(),
      },
    });
    // 递增求购表的评论数
    await db
      .collection("wanted")
      .doc(data.wantedId)
      .update({ data: { comment_count: _.inc(1) } });

    // 发送订阅消息通知求购发布者
    const { data: wantedDoc } = await db
      .collection("wanted")
      .doc(data.wantedId)
      .get();
    if (wantedDoc && wantedDoc._openid && wantedDoc._openid !== openId) {
      sendSubscribeMessage({
        touser: wantedDoc._openid,
        template_id: TPL_COMMENT,
        page: "/pages/content/wanted/wanted?showId=" + data.wantedId,
        data: {
          thing1: { value: (data.content || "").slice(0, 20) },
          thing4: { value: (wantedDoc.content || "").slice(0, 20) },
        },
      });
    }

    return { code: 200, data: { id: _id }, msg: "评论成功" };
  } catch (err) {
    console.error(
      "发表评论失败（请确认云控制台已创建 wanted_comments 集合）：",
      err,
    );
    return { code: 500, msg: "评论失败，请稍后重试" };
  }
}

/** 获取求购评论列表 */
async function getWantedComments(wantedId) {
  if (!db) return { code: 200, data: [] };
  try {
    const { data } = await db
      .collection("wanted_comments")
      .where({ wanted_id: wantedId })
      .orderBy("createdAt", "desc")
      .get();
    return { code: 200, data };
  } catch (err) {
    console.error("获取评论列表失败（集合可能未创建）：", err);
    return { code: 200, data: [] };
  }
}

/** 点赞评论 */
async function likeWantedComment(commentId) {
  if (!db) throw new Error("云开发未初始化");
  try {
    await db
      .collection("wanted_comments")
      .doc(commentId)
      .update({ data: { like_count: _.inc(1) } });
    return { code: 200, msg: "点赞成功" };
  } catch (err) {
    console.error("点赞评论失败：", err);
    return { code: 200, msg: "ok" };
  }
}

/** 获取我的求购未读消息数 */
async function getWantedUnreadCount() {
  if (!db) return { code: 200, data: { count: 0 } };
  const openId = getApp().globalData.openId || "";
  // 获取我发布的求购
  const { data: myWanted } = await db
    .collection("wanted")
    .where({ _openid: openId })
    .get();
  if (myWanted.length === 0) return { code: 200, data: { count: 0 } };
  // 计算这些求购下的评论总数（简化：使用 comment_count 之和）
  const total = myWanted.reduce((sum, w) => sum + (w.comment_count || 0), 0);
  return { code: 200, data: { count: total } };
}

/** 搜索商品（支持分类+关键词组合） */
async function searchGoods(keyword, category = 0) {
  if (!db) return { code: 200, data: [] };
  const where = {
    status: "selling",
    title: db.RegExp({
      regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      options: "i",
    }),
  };
  if (category > 0) {
    where.category = category;
  }
  const { data } = await db
    .collection("goods")
    .where(where)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  return { code: 200, data };
}

/** 创建订单 */
async function createOrder(data) {
  if (!db) throw new Error("云开发未初始化");
  const openId = getApp().globalData.openId || "";
  const { _id } = await db.collection("orders").add({
    data: {
      _openid: openId,
      buyer_openid: openId,
      goods_id: data.goodsId,
      goods_title: data.goodsTitle,
      goods_image: data.goodsImage || "",
      price: data.price,
      status: "pending",
      createdAt: db.serverDate(),
    },
  });

  // 发送订阅消息通知卖家
  try {
    const { data: goodsDoc } = await db
      .collection("goods")
      .doc(data.goodsId)
      .get();
    if (goodsDoc && goodsDoc._openid && goodsDoc._openid !== openId) {
      sendSubscribeMessage({
        touser: goodsDoc._openid,
        template_id: TPL_ORDER,
        page: "/pages/content/detail/detail?id=" + data.goodsId,
        data: {
          thing1: { value: (data.goodsTitle || "").slice(0, 20) },
          thing4: { value: (data.goodsTitle || "").slice(0, 20) },
        },
      });
    }
  } catch (e) {
    /* ignore */
  }

  return { code: 200, data: { id: _id }, msg: "下单成功" };
}

/** 获取订单列表 */
async function getOrderList() {
  if (!db) return { code: 200, data: [] };
  const openId = getApp().globalData.openId || "";
  const { data } = await db
    .collection("orders")
    .where({ _openid: openId })
    .orderBy("createdAt", "desc")
    .get();
  return { code: 200, data };
}

/** 发送订阅消息 */
async function sendSubscribeMessage({ touser, template_id, page, data }) {
  if (!touser) return;
  try {
    await wx.cloud.callFunction({
      name: "XXXX",
      data: {
        name: "XXXX",
        data: {
          template_id,
          page: page || "",
          touser,
          data,
          miniprogram_state: "trial",
          lang: "zh_CN",
        },
      },
    });
  } catch (err) {
    console.error("发送订阅消息失败：", err);
  }
}

/** 内容安全检测（文字） */
async function contentSecCheck(content) {
  if (!content) return { pass: true };
  try {
    const res = await wx.cloud.callFunction({
      name: "XXXX",
      data: {
        name: "XXXX",
        data: {
          scene: 2, // 场景值 2: 评论/发布
          version: 2,
          content: content,
        },
      },
    });
    const result = res.result;
    if (result && result.result && result.result.suggest === "risky") {
      return { pass: false, msg: "内容含有违规信息，请修改后重试" };
    }
    return { pass: true };
  } catch (err) {
    console.error("内容安全检测失败：", err);
    return { pass: true }; // 检测失败时不阻塞发布
  }
}

/** 更新订单状态 */
async function updateOrderStatus(id, status) {
  if (!db) throw new Error("云开发未初始化");
  await db.collection("orders").doc(id).update({ data: { status } });
  return { code: 200, msg: "更新成功" };
}

module.exports = {
  getGoodsList,
  getGoodsDetail,
  createGoods,
  updateGoods,
  removeGoods,
  getMyGoods,
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
  uploadFile,
  getUserProfile,
  updateUserProfile,
  searchGoods,
  createOrder,
  getOrderList,
  updateOrderStatus,
  contentSecCheck,
  sendSubscribeMessage,
};
