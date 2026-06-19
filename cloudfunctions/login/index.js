const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const db = cloud.database();
  const { nickname, avatar } = event;

  // 查用户是否已存在
  const { data: users } = await db
    .collection("users")
    .where({ _openid: OPENID })
    .get();

  if (users.length > 0) {
    // 如果传入了昵称/头像，更新用户信息
    if (nickname || avatar) {
      const updates = {};
      if (nickname) updates.nickname = nickname;
      if (avatar) updates.avatar = avatar;
      await db.collection("users").doc(users[0]._id).update({ data: updates });
      return { code: 200, data: { ...users[0], ...updates } };
    }
    return { code: 200, data: users[0] };
  }

  // 新用户注册
  const newUser = {
    _openid: OPENID,
    nickname: nickname || "校园用户",
    avatar: avatar || "",
    campus: "",
    createdAt: db.serverDate(),
  };
  const { _id } = await db.collection("users").add({ data: newUser });
  return { code: 200, data: { ...newUser, _id } };
};
