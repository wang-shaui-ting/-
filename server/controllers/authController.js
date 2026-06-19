require("dotenv").config();
const axios = require("axios");
const db = require("../config/db");
const { generateToken } = require("../middleware/auth");

const APPID = process.env.APPID || "";
const SECRET = process.env.SECRET || "";

/** 微信登录 / 注册 */
exports.login = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ code: 400, msg: "缺少 code" });

    // 1. 用 code 换 openid
    const wxRes = await axios.get(
      "https://api.weixin.qq.com/sns/jscode2session",
      {
        params: {
          appid: APPID,
          secret: SECRET,
          js_code: code,
          grant_type: "authorization_code",
        },
      },
    );
    const { openid, errcode } = wxRes.data;
    if (errcode || !openid) {
      return res
        .status(400)
        .json({ code: 400, msg: "微信登录失败", err: wxRes.data });
    }

    // 2. 查数据库
    const [rows] = await db.query("SELECT * FROM users WHERE openid = ?", [
      openid,
    ]);
    let user;
    if (rows.length === 0) {
      // 新用户，注册
      const [result] = await db.query(
        "INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)",
        [openid, "校园用户", ""],
      );
      user = {
        id: result.insertId,
        openid,
        nickname: "校园用户",
        avatar: "",
        campus: "",
      };
    } else {
      user = rows[0];
    }

    // 3. 生成 token
    const token = generateToken({ userId: user.id, openid });

    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          campus: user.campus,
        },
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 更新用户信息 */
exports.updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, campus } = req.body;
    const userId = req.userId;
    const fields = [];
    const values = [];
    if (nickname !== undefined) {
      fields.push("nickname = ?");
      values.push(nickname);
    }
    if (avatar !== undefined) {
      fields.push("avatar = ?");
      values.push(avatar);
    }
    if (campus !== undefined) {
      fields.push("campus = ?");
      values.push(campus);
    }
    if (fields.length === 0)
      return res.status(400).json({ code: 400, msg: "无更新字段" });

    values.push(userId);
    await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
    res.json({ code: 200, msg: "更新成功" });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 获取用户信息 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const [rows] = await db.query(
      "SELECT id, nickname, avatar, campus FROM users WHERE id = ?",
      [userId],
    );
    if (rows.length === 0)
      return res.status(404).json({ code: 404, msg: "用户不存在" });
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};
