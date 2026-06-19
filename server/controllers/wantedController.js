const db = require("../config/db");

/** 求购列表 */
exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const [rows] = await db.query(
      "SELECT w.id, w.content, w.images, w.status, w.like_count, w.created_at, u.nickname, u.avatar FROM wanted w JOIN users u ON w.user_id = u.id WHERE w.status = 'open' ORDER BY w.created_at DESC LIMIT ? OFFSET ?",
      [pageSize, offset],
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM wanted WHERE status = 'open'",
    );

    const list = rows.map((item) => ({
      ...item,
      images:
        typeof item.images === "string"
          ? JSON.parse(item.images)
          : item.images || [],
    }));

    res.json({ code: 200, data: { list, total, page, pageSize } });
  } catch (err) {
    console.error("wanted list error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 发布求购 */
exports.create = async (req, res) => {
  try {
    const { content, images } = req.body;
    if (!content) return res.status(400).json({ code: 400, msg: "内容必填" });

    const [result] = await db.query(
      "INSERT INTO wanted (user_id, content, images) VALUES (?, ?, ?)",
      [req.userId, content, JSON.stringify(images || [])],
    );
    res.json({
      code: 200,
      data: { id: result.insertId },
      msg: "发布成功",
    });
  } catch (err) {
    console.error("wanted create error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 点赞 */
exports.like = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT id FROM wanted WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ code: 404, msg: "不存在" });

    await db.query(
      "UPDATE wanted SET like_count = like_count + 1 WHERE id = ?",
      [id],
    );
    res.json({ code: 200, msg: "点赞成功" });
  } catch (err) {
    console.error("wanted like error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};

/** 关闭求购（仅本人） */
exports.close = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT user_id FROM wanted WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ code: 404, msg: "不存在" });
    if (rows[0].user_id !== req.userId)
      return res.status(403).json({ code: 403, msg: "无权操作" });

    await db.query("UPDATE wanted SET status = 'closed' WHERE id = ?", [id]);
    res.json({ code: 200, msg: "已关闭" });
  } catch (err) {
    console.error("wanted close error:", err);
    res.status(500).json({ code: 500, msg: "服务器错误" });
  }
};
